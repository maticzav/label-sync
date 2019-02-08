import * as Octokit from '@octokit/rest'
import { RepositoryConfig, LabelConfig } from '../../config'
import { GithubLabel, GithubRepository, isLabel } from '../../github'
import { withDefault } from '../../utils'

/*
 *
 * Config
 *
 */

/**
 *
 * Hydrates Github labels from configuration file.
 *
 * @param configuration
 */
export function getGithubLabelsFromRepositoryConfig(
  configuration: RepositoryConfig,
): GithubLabel[] {
  const labelNames = Object.keys(configuration.labels)
  const labels = labelNames.map(labelName =>
    hydrateLabel(labelName, configuration.labels[labelName]),
  )

  return labels

  /**
   * Helper functions
   */

  /**
   *
   * Fills the missing pieces of a label.
   *
   * @param labelName
   * @param labelConfig
   */
  function hydrateLabel(
    labelName: string,
    labelConfig: LabelConfig,
  ): GithubLabel {
    switch (typeof labelConfig) {
      case 'string': {
        return {
          name: labelName,
          description: '',
          color: labelConfig,
          default: false,
        }
      }
      case 'object': {
        return {
          name: labelName,
          description: withDefault('')(labelConfig.description),
          color: labelConfig.color,
          default: false,
        }
      }
    }
  }
}

/*
 *
 * Label Sync
 *
 */

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
  labels: GithubLabel[],
  repository: GithubRepository,
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
        owner: repository.owner.login,
        repo: repository.name,
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
  labels: GithubLabel[],
  repository: GithubRepository,
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
        owner: repository.owner.login,
        repo: repository.name,
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
  labels: GithubLabel[],
  repository: GithubRepository,
): Promise<GithubLabel[]> {
  const actions = labels.map(label => removeLabelFromRepository(label))
  await Promise.all(actions)

  return labels

  /**
   * Helper functions
   */
  async function removeLabelFromRepository(
    label: GithubLabel,
  ): Promise<Octokit.IssuesDeleteLabelResponse> {
    return github.issues
      .deleteLabel({
        owner: repository.owner.login,
        repo: repository.name,
        name: label.name,
      })
      .then(res => res.data)
  }
}

/**
 *
 * Calculates the diff of labels.
 *
 * @param currentLabels
 * @param newLabels
 */
export function getLabelsDiff(
  currentLabels: GithubLabel[],
  newLabels: GithubLabel[],
): {
  add: GithubLabel[]
  update: GithubLabel[]
  remove: GithubLabel[]
} {
  const labels = [...currentLabels, ...newLabels]
  const diff = labels.reduce<{
    add: GithubLabel[]
    update: GithubLabel[]
    remove: GithubLabel[]
  }>(
    (acc, label) => {
      const status = getLabelStatus(label)

      switch (status) {
        case 'create':
          return { ...acc, add: acc.add.concat(label) }

        case 'update':
          return { ...acc, update: acc.update.concat(label) }

        case 'delete':
          return { ...acc, remove: acc.remove.concat(label) }

        case 'ignore':
          return acc
      }
    },
    {
      add: [],
      update: [],
      remove: [],
    },
  )

  return diff

  /**
   * Helper functions
   */
  function getLabelStatus(
    label: GithubLabel,
  ): 'create' | 'update' | 'delete' | 'ignore' {
    const isNew = newLabels.find(isLabel(label))
    const newDefinition = newLabels.find(isLabelDefinition(label))
    const currentDefinition = currentLabels.find(isLabelDefinition(label))

    if (newDefinition && !currentDefinition) {
      return 'create'
    } else if (
      newDefinition &&
      currentDefinition &&
      !isLabel(newDefinition)(currentDefinition) &&
      isNew
    ) {
      return 'update'
    } else if (!newDefinition && currentDefinition) {
      return 'delete'
    } else {
      return 'ignore'
    }
  }

  /**
   * Helper functions
   */
  function isLabelDefinition(
    label: GithubLabel,
  ): (compare: GithubLabel) => boolean {
    return compare => label.name === compare.name
  }
}
