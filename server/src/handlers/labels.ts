import { Octokit } from 'probot'

import {
  LSCRepository,
  LSCLabel,
  LSCRepositoryConfiguration,
} from '../configuration'
import * as maybe from '../data/maybe'
import { Dict } from '../data/dict'
import {
  GithubLabel,
  getRepositoryLabels,
  isLabel,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
} from '../github'
import { withDefault } from '../utils'

export type LabelSyncReport =
  | {
      status: 'Success'
      owner: string
      repo: string
      additions: GithubLabel[]
      updates: GithubLabel[]
      removals: GithubLabel[]
      config: {
        config: Required<LSCRepositoryConfiguration>
        labels: Dict<LSCLabel>
      }
    }
  | {
      status: 'Failure'
      repo: string
      owner: string
      message: string
      config: {
        config: LSCRepositoryConfiguration
        labels: Dict<LSCLabel>
      }
    }

/**
 *
 * Performs a labels sync with configuration.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export async function handleLabelSync(
  octokit: Octokit,
  owner: string,
  repo: string,
  { config, labels }: LSCRepository,
  persist: boolean,
): Promise<LabelSyncReport> {
  /**
   * Label Sync handler firstly loads current labels from Github,
   * and new labels from local configuration.
   *
   * After that it generates a diff and creates, updates or deletes
   * label definitions in a particular repository.
   */
  const remoteLabels = await getRepositoryLabels(octokit, { repo, owner })
  const labelsDiff = maybe.andThen(remoteLabels, calculateDiff(labels))

  /* Configuration */

  const removeUnconfiguredLabels = withDefault(
    false,
    config?.removeUnconfiguredLabels,
  )

  /* istanbul ignore if */
  if (labelsDiff === null) {
    return {
      status: 'Failure',
      owner,
      repo,
      message: `Couldn't make a diff of labels.`,
      config: {
        labels,
        config: {
          removeUnconfiguredLabels,
        },
      },
    }
  }

  const { added, changed, removed } = labelsDiff

  /* Perform sync */
  const [additions, updates, removals] = await Promise.all([
    addLabelsToRepository(octokit, { repo, owner }, added, persist),
    updateLabelsInRepository(octokit, { repo, owner }, changed, persist),
    removeLabelsFromRepository(
      octokit,
      { repo, owner },
      removed,
      removeUnconfiguredLabels && persist,
    ),
  ])

  return {
    status: 'Success',
    repo,
    owner,
    additions,
    updates,
    removals,
    config: {
      config: {
        removeUnconfiguredLabels,
      },
      labels,
    },
  }
}

/**
 *
 * Calculates the diff of labels.
 *
 * @param currentLabels
 * @param newLabels
 */
export function calculateDiff(
  config: LSCRepository['labels'],
): (
  currentLabels: GithubLabel[],
) => {
  added: GithubLabel[]
  changed: GithubLabel[]
  removed: GithubLabel[]
  // unchanged: GithubLabel[]
} {
  return currentLabels => {
    const currentLabelsNames = currentLabels.map(l => l.name)

    /* Labels */

    let added: GithubLabel[] = []
    let changed: GithubLabel[] = []
    // let unchanged: GithubLabel[] = []
    let removed: GithubLabel[] = []

    /* Find changes */

    for (const label of Object.keys(config)) {
      /* New labels */
      if (!currentLabelsNames.includes(label)) {
        added.push(hydrateLabel(label))
        continue
      }
      /* Updated labels */
      const labelPersisted = currentLabelsNames.includes(label)
      const labelHasChanged = !currentLabels.some(isLabel(hydrateLabel(label)))

      if (labelPersisted && labelHasChanged) {
        changed.push(hydrateLabel(label))
        continue
      }
    }

    for (const label of currentLabels) {
      const labelRemoved = !config.hasOwnProperty(label.name)
      const labelAlias = Object.keys(config).find(labelName => {
        const aliases = withDefault([], config[labelName].alias)
        return aliases.some(a => a === label.name)
      })
      /* Aliases */
      if (labelRemoved && labelAlias) {
        changed.push({
          old_name: label.name,
          name: labelAlias,
          color: config[labelAlias]!.color,
          description: config[labelAlias]!.description,
        })
        continue
      }

      /* Removed */
      if (labelRemoved && !labelAlias) {
        removed.push({
          name: label.name,
          color: label.color,
          description: label.description,
        })
        continue
      }
    }

    return {
      added,
      changed,
      removed,
      // unchanged,
    }
  }

  /* Helper functions */

  function hydrateLabel(name: string): GithubLabel {
    return {
      name,
      color: config[name]!.color,
      description: config[name]!.description,
    }
  }
}
