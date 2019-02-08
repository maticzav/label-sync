import { GithubRepository, getRepositoryFromName } from '../../github'
import { RepositoryConfig } from '../../types'
import { withDefault } from '../../utils'

export interface Config {
  [repository: string]: RepositoryConfig
}

export type ConfigError = { repository: string; message: string }

/**
 *
 * Hydrates repositories from configuration file.
 *
 * @param configuration
 */
export function getRepositoriesFromConfiguration(config: Config) {
  const repositories = Object.keys(config).reduce<{
    configurations: { repository: GithubRepository; config: RepositoryConfig }[]
    errors: ConfigError[]
  }>(
    (acc, repositoryName) => {
      const repository = getRepositoryFromName(repositoryName)

      if (!repository) {
        return {
          ...acc,
          errors: acc.errors.concat({
            repository: repositoryName,
            message: `Cannot decode the provided repository name ${repositoryName}`,
          }),
        }
      }

      return {
        ...acc,
        configurations: acc.configurations.concat({
          repository: repository,
          config: hydrateRepositoryConfig(config[repositoryName]),
        }),
      }
    },
    { configurations: [], errors: [] },
  )

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
