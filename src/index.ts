import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'
import * as Octokit from '@octokit/rest'

/* istanbul ignore next */
if (!(process.env.NODE_ENV === 'test')) main()

/**
 * Action
 */

export async function main(): Promise<boolean> {
  if (
    !process.env.GITHUB_TOKEN ||
    !process.env.GITHUB_WORKSPACE ||
    !process.env.GITHUB_HOME ||
    !process.env.GITHUB_REPOSITORY ||
    !process.env.GITHUB_EVENT_NAME ||
    !process.env.GITHUB_REF
  ) {
    throw new Error('Missing Github configuration!')
  }

  /**
   * Authentication
   */

  const client = new Octokit()

  client.authenticate({
    type: 'app',
    token: process.env.GITHUB_TOKEN,
  })

  /**
   * Labels
   */

  // Local
  const configuration = getGithubLabelsConfiguration(
    process.env.GITHUB_WORKSPACE,
  )

  if (!configuration) {
    throw new Error('No configuration file found!')
  }

  const newLabels = getGithubLabelsFromConfiguration(configuration)

  // Github
  const repository = getRepositoryFromName(process.env.GITHUB_REPOSITORY)

  if (!repository) {
    throw new Error('Cannot decode the provided repository name.')
  }

  const currentLabels = await getRepostioryLabels(client, repository)

  /**
   * Diff
   */

  const diff = getLabelsDiff(currentLabels, newLabels)

  /**
   * Sync
   */
  if (diff.add) await addLabelsToRepository(client, diff.add, repository)

  if (diff.update) {
    await updateLabelsInRepository(client, diff.update, repository)
  }

  if (diff.remove && configuration.strict) {
    await removeLabelsFromRepository(client, diff.remove, repository)
  }

  return true
}

/**
 * Helper functions
 */

type LabelConfiguration =
  | {
      description?: string
      color: string
    }
  | string

interface GithubLabelsConfiguration {
  strict: boolean
  labels: { [name: string]: LabelConfiguration }
  // branch: string
  // event: string
}

/**
 *
 * Gets labels configuration from Github repository workspace.
 * Replaces optional values with defaults if no value is provided.
 *
 * @param workspace
 */
export function getGithubLabelsConfiguration(
  workspace: string,
): GithubLabelsConfiguration | null {
  const configPath = path.resolve(workspace, 'labels.config.json')

  if (!fs.existsSync(configPath)) {
    return null
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  // TODO: add configuration schema check

  return {
    strict: withDefault(false)(config.strict),
    labels: config.labels,
  }
}

/**
 *
 * Hydrates Github labels from configuration file.
 *
 * @param configuration
 */
export function getGithubLabelsFromConfiguration(
  configuration: GithubLabelsConfiguration,
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
    labelConfig: LabelConfiguration,
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
): Promise<GithubLabel[]> {
  return github.issues
    .listLabelsForRepo({ repo: repository.repo, owner: repository.owner })
    .then(res => res.data)
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

  return Promise.all(actions)

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
  const actions = labels.map(label => updateLabelInREpository(label))

  return Promise.all(actions)

  /**
   * Helper functions
   */
  async function updateLabelInREpository(
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
): Promise<Octokit.IssuesDeleteLabelResponse[]> {
  const actions = labels.map(label => removeLabelFromRepository(label))

  return Promise.all(actions)

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
    const newDefinition = newLabels.find(isLabelDefinition(label))
    const currentDefinition = currentLabels.find(isLabelDefinition(label))

    if (newDefinition && !currentDefinition) {
      return 'create'
    } else if (
      newDefinition &&
      currentDefinition &&
      !isLabel(newDefinition)(currentDefinition)
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
 * Utils
 */

/**
 *
 * Returns fallback if value is undefined.
 *
 * @param fallback
 */
export function withDefault<T>(fallback: T): (value: T | undefined) => T {
  return value => {
    if (value !== undefined) {
      return value
    } else {
      return fallback
    }
  }
}

/**
 *
 * Compares two labels by comparing all of their keys.
 *
 * @param label
 */
export function isLabel(label: GithubLabel): (compare: GithubLabel) => boolean {
  return compare => {
    try {
      assert.deepStrictEqual(label, compare)
      return true
    } catch (err) {
      return false
    }
  }
}
