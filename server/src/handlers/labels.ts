import { Octokit } from 'probot'

import { LSCRepository } from '../configuration'
import * as maybe from '../data/maybe'
import { GithubLabel, getRepositoryLabels, isLabel } from '../github'

export type LabelSyncReport =
  | {
      status: 'Success'
      additions: GithubLabel[]
      updates: GithubLabel[]
      removals: GithubLabel[]
    }
  | { status: 'Failure'; message: string }

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
    return { status: 'Failure', message: '' }
  }

  const { added, changed, removed } = labelsDiff

  const [additions, updates, removals] = await Promise.all([
    addLabelsToRepository(octokit, { repo, owner }, added),
    updateLabelsInRepository(octokit, { repo, owner }, changed),
    removeLabelsFromRepository(octokit, { repo, owner }, removed, strict),
  ])

  return {
    status: 'Success',
    additions,
    updates,
    removals,
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
): Promise<GithubLabel[]> {
  const actions = labels.map(label => addLabelToRepository(label))
  const res = await Promise.all(actions)

  return res

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
): Promise<GithubLabel[]> {
  const actions = labels.map(label => updateLabelInRepository(label))
  const res = await Promise.all(actions)

  return res

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
  permanent: boolean,
): Promise<GithubLabel[]> {
  const actions = labels.map(label => removeLabelFromRepository(label))
  if (permanent) await Promise.all(actions)

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
