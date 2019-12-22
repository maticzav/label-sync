import { Octokit } from 'probot'

import { LSCRepository, LSCLabel } from '../configuration'
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

export type LabelSyncReport =
  | {
      status: 'Success'
      owner: string
      repo: string
      additions: GithubLabel[]
      updates: GithubLabel[]
      removals: GithubLabel[]
      config: {
        strict: boolean
        labels: Dict<LSCLabel>
      }
    }
  | {
      status: 'Failure'
      repo: string
      owner: string
      message: string
      config: {
        strict: boolean
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
  { strict, labels }: LSCRepository,
  persist: boolean = false,
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

  console.log({ labelsDiff })

  /* istanbul ignore if */
  if (labelsDiff === null) {
    return {
      status: 'Failure',
      owner,
      repo,
      message: `Couldn't make a diff of labels.`,
      config: { labels, strict },
    }
  }

  const { added, changed, removed } = labelsDiff

  /* Perform sync */
  const [additions, updates, removals] = await Promise.all([
    addLabelsToRepository(octokit, { repo, owner }, added, persist),
    // updateLabelsInRepository(octokit, { repo, owner }, changed, persist),
    // removeLabelsFromRepository(
    //   octokit,
    //   { repo, owner },
    //   removed,
    //   strict && persist,
    // ),
  ])

  return {
    status: 'Success',
    repo,
    owner,
    additions,
    updates,
    removals,
    config: {
      strict,
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
  labels: GithubLabel[],
) => {
  added: GithubLabel[]
  changed: GithubLabel[]
  removed: GithubLabel[]
  unchanged: GithubLabel[]
} {
  return labels => {
    const labelsNames = labels.map(l => l.name)

    const added = Object.keys(config)
      .filter(label => !labelsNames.includes(label))
      .map(hydrateLabel)
    const changed = Object.keys(config)
      .filter(label => {
        const persisted = labelsNames.includes(label)
        const changed = !labels.some(isLabel(hydrateLabel(label)))
        return persisted && changed
      })
      .map(hydrateLabel)
    const unchanged = Object.keys(config)
      .filter(label => labels.some(isLabel(hydrateLabel(label))))
      .map(hydrateLabel)
    const removed = labels.filter(label => !config.hasOwnProperty(label.name))

    return {
      added,
      changed,
      removed,
      unchanged,
    }
  }

  /* Helper functions */

  function hydrateLabel(name: string): GithubLabel {
    return { ...config[name], name, default: false }
  }
}
