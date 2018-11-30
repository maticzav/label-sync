import * as fs from 'fs'
import * as path from 'path'
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
  const currentLabels = await getRepostioryLabels(client, repository)

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
      default?: boolean
    }
  | string

interface GithubLabelsConfiguration {
  labels: { [name: string]: LabelConfiguration }
}

/**
 *
 * Gets labels configuration from Github repository workspace.
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

  // TODO: add schema check

  return config
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
          default: withDefault(false)(labelConfig.default),
        }
      }
    }
  }

  /**
   *
   * Returns fallback if value is undefined.
   *
   * @param fallback
   */
  function withDefault<T>(fallback: T): (value: T) => T {
    return (value: T) => {
      if (value !== undefined) {
        return value
      } else {
        return fallback
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
  return {
    add: [],
    update: [],
    remove: [],
  }
}
