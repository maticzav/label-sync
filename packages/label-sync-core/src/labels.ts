import * as assert from 'assert'
import * as Octokit from '@octokit/rest'

import { withDefault } from './utils'

/**
 * Labels definition
 */

/**
 * Configuration
 */

export type LabelConfig =
  | {
      description?: string
      color: string
      siblings?: string[]
    }
  | string

export interface RepositoryConfig {
  strict?: boolean
  labels: { [name: string]: LabelConfig }
}

export interface Config {
  [repository: string]: RepositoryConfig
}

export function getRepositoriesFromConfiguration(
  configuration: Config,
): { name: string; config: RepositoryConfig }[] {
  const repositories = Object.keys(configuration).map(repository => ({
    name: repository,
    config: hydrateRepositoryConfig(configuration[repository]),
  }))

  return repositories

  /**
   * Helpers
   */
  function hydrateRepositoryConfig(config: RepositoryConfig) {
    return {
      strict: withDefault(false)(config.strict),
      labels: config.labels,
    }
  }
}

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

/**
 * Github functions
 */

export interface GithubRepository {
  owner: string
  repo: string
}

/**
 *
 * Converts Github repository name to GithubRepository
 *
 * @param name
 */
export function getRepositoryFromName(name: string): GithubRepository | null {
  try {
    const [owner, repo] = name.split('/')

    assert.ok(typeof owner === 'string')
    assert.ok(typeof repo === 'string')

    return {
      owner,
      repo,
    }
  } catch (err) {
    return null
  }
}

export interface GithubLabel {
  id?: number
  node_id?: string
  url?: string
  name: string
  description: string
  color: string
  default: boolean
}

/**
 *
 * Obtains all labels used in particular repository.
 *
 * @param github
 * @param repository
 */
export async function getRepostioryLabels(
  github: Octokit,
  repository: GithubRepository,
  page: number = 1,
): Promise<GithubLabel[]> {
  const size = 100

  return github.issues
    .listLabelsForRepo({
      repo: repository.repo,
      owner: repository.owner,
      page: page,
      per_page: size,
    })
    .then(async res => {
      if (res.data.length < size) {
        return res.data
      } else {
        const remainingLabels = await getRepostioryLabels(
          github,
          repository,
          page + 1,
        )

        return [...res.data, ...remainingLabels]
      }
    })
}

/**
 *
 * Creates new labels in a repository.
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
        owner: repository.owner,
        repo: repository.repo,
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
        owner: repository.owner,
        repo: repository.repo,
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
        owner: repository.owner,
        repo: repository.repo,
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

/**
 *
 * Compares two labels by comparing all of their keys.
 *
 * @param label
 */
export function isLabel(local: GithubLabel): (remote: GithubLabel) => boolean {
  const keys = ['name', 'description', 'color', 'default']

  return remote => keys.every(key => get(local, key) === get(remote, key))

  /* Helper functions */
  function get<T>(
    object: { [key: string]: T | any },
    value: string,
  ): T | undefined {
    return object[value]
  }
}
