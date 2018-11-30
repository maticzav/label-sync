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

  const configuration = getGithubLabelsConfiguration(
    process.env.GITHUB_WORKSPACE,
  )
}

main()

/**
 * Helper functions
 */

interface GithubLabelsConfiguration {
  labels: { [label: string]: string }
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
  id: number
  node_id: string
  url: string
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
  const labels = github.issues.listLabelsForRepo({
    repo: repository.repo,
    owner: repository.owner,
  })
  return labels
}
