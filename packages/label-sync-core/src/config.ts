import { GithubRepository, getRepositoryFromName } from './github'
import { withDefault } from './utils'

/**
 *
 * Configuration
 *
 */

export type LabelConfig =
  | {
      description?: string
      color: string
      siblings?: Sibling[]
    }
  | string

export type Sibling = string

export interface RepositoryConfig {
  strict?: boolean
  labels: { [name: string]: LabelConfig }
}

/* Legacy */

export interface Config {
  [repository: string]: RepositoryConfig
}

/**
 *
 * Hydrates repositories from configuration file.
 *
 * @param configuration
 */
export function getRepositoriesFromConfiguration(
  configuration: Config,
): (
  | { status: 'ok'; repository: GithubRepository; config: RepositoryConfig }
  | { status: 'err'; message: string; config: RepositoryConfig })[] {
  const repositories = Object.keys(configuration).map<
    | { status: 'ok'; repository: GithubRepository; config: RepositoryConfig }
    | { status: 'err'; message: string; config: RepositoryConfig }
  >(repositoryName => {
    const repository = getRepositoryFromName(repositoryName)

    if (!repository) {
      return {
        status: 'err',
        message: `Cannot decode the provided repository name ${name}`,
        config: configuration[repositoryName],
      }
    }

    return {
      status: 'ok',
      repository: repository,
      config: hydrateRepositoryConfig(configuration[repositoryName]),
    }
  })

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
