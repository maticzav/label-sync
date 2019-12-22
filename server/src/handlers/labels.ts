import { Octokit } from 'probot'

import { LSCRepository, LSCLabel } from '../configuration'
import * as maybe from '../data/maybe'
import { GithubLabel, getRepositoryLabels, isLabel } from '../github'
import { Dict } from '../utils'

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

  const [additions, updates, removals] = await Promise.all([
    addLabelsToRepository(octokit, { repo, owner }, added, persist),
    updateLabelsInRepository(octokit, { repo, owner }, changed, persist),
    removeLabelsFromRepository(
      octokit,
      { repo, owner },
      removed,
      strict && persist,
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

/**
 *
 * Create new labels in a repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function addLabelsToRepository(
  github: Octokit,
  { repo, owner }: { repo: string; owner: string },
  labels: GithubLabel[],
  persist: boolean,
): Promise<GithubLabel[]> {
  /* Return config on non persist */
  if (!persist) {
    return labels
  }

  /* Perform sync on persist. */
  const actions = labels.map(label => addLabelToRepository(label))
  return Promise.all(actions)

  /**
   * Helper functions
   */
  async function addLabelToRepository(
    label: GithubLabel,
  ): Promise<GithubLabel> {
    return github.issues
      .createLabel({
        owner: owner,
        repo: repo,
        name: label.name,
        description: label.description,
        color: label.color,
      })
      .then(res => res.data)
  }
}

/**
 *
 * Updates labels in repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function updateLabelsInRepository(
  github: Octokit,
  { repo, owner }: { repo: string; owner: string },
  labels: GithubLabel[],
  persist: boolean,
): Promise<GithubLabel[]> {
  /* Return config on non persist */
  if (!persist) {
    return labels
  }

  /* Update values on persist. */
  const actions = labels.map(label => updateLabelInRepository(label))
  return Promise.all(actions)

  /**
   * Helper functions
   */
  async function updateLabelInRepository(
    label: GithubLabel,
  ): Promise<GithubLabel> {
    return github.issues
      .updateLabel({
        current_name: label.name,
        owner: owner,
        repo: repo,
        name: label.name,
        description: label.description,
        color: label.color,
      })
      .then(res => res.data)
  }
}

/**
 *
 * Removes labels from repository.
 *
 * @param github
 * @param labels
 * @param repository
 */
export async function removeLabelsFromRepository(
  github: Octokit,
  { repo, owner }: { repo: string; owner: string },
  labels: GithubLabel[],
  persist: boolean,
): Promise<GithubLabel[]> {
  const actions = labels.map(label => removeLabelFromRepository(label))
  if (persist) await Promise.all(actions)

  return labels

  /**
   * Helper functions
   */
  async function removeLabelFromRepository(
    label: GithubLabel,
  ): Promise<Octokit.IssuesDeleteLabelParams> {
    return github.issues
      .deleteLabel({
        owner: owner,
        repo: repo,
        name: label.name,
      })
      .then(res => res.data)
  }
}
