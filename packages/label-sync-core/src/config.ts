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
