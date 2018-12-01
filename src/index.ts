import * as fs from 'fs'
import * as path from 'path'
import * as assert from 'assert'
import * as Octokit from '@octokit/rest'

async function main(): Promise<void> {
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
  const newLabels = getGithubLabelsFromConfiguration(configuration)

  // Github
  const repository = getRepositoryFromName(process.env.GITHUB_REPOSITORY)
  const currentLabels = await getRepostioryLabels(client, repository!) // TODO: add check

  const diff = getLabelsDiff(currentLabels, newLabels)
}

main()

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
  strict?: boolean
  labels: { [name: string]: LabelConfiguration }
}

/**
 *
 * Gets labels configuration from Github repository workspace.
 * Replaces optional values with defaults if no value is provided.
 *
 * @param workspace
 */
function getGithubLabelsConfiguration(
  workspace: string,
): GithubLabelsConfiguration {
  const configPath = path.resolve(workspace, 'labels.config.json')

  if (!fs.existsSync(configPath)) {
    throw new Error('No configuration file found!')
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
function getGithubLabelsFromConfiguration(
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

interface GithubRepository {
  owner: string
  repo: string
}

/**
 *
 * Converts Github repository name to GithubRepository
 *
 * @param name
 */
function getRepositoryFromName(name: string): GithubRepository | null {
  try {
    const [owner, repo] = name.split('/')
    return {
      owner,
      repo,
    }
  } catch (err) {
    return null
  }
}

interface GithubLabel {
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
async function getRepostioryLabels(
  github: Octokit,
  repository: GithubRepository,
): Promise<GithubLabel[]> {
  return github.issues
    .listLabelsForRepo({ repo: repository.repo, owner: repository.owner })
    .then(res => res.data)
}

/**
 *
 * Calculates the diff of labels.
 *
 * @param currentLabels
 * @param newLabels
 */
function getLabelsDiff(
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
function withDefault<T>(fallback: T): (value: T | undefined) => T {
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
function isLabel(label: GithubLabel): (compare: GithubLabel) => boolean {
  return compare => {
    try {
      assert.deepStrictEqual(label, compare)
      return true
    } catch (err) {
      return false
    }
  }
}
