import * as path from 'path'
import * as fs from 'fs'
import * as Ajv from 'ajv'
import * as Octokit from '@octokit/rest'

import { Config as CoreConfig } from '@prisma/github-labels-core'
import { RepositoryConfig as CoreRepositoryConfig } from '@prisma/github-labels-core/dist/labels'

/** Schema */

import schema = require('./schema.json')
import { getRepositories, GithubRepository } from './github.js'

const ajv = new Ajv().addMetaSchema(
  require('ajv/lib/refs/json-schema-draft-06.json'),
)
const validateSchema = ajv.compile(schema)

/**
 * Labels
 */

type LabelConfig =
  | string
  | {
      color: string
      description?: string
    }

type RepositoryConfig =
  | string
  | {
      paths: string
      labels?: { [name: string]: LabelConfig }
      strict?: boolean
    }

interface PublishConfig {
  branch: string
}

interface LabelsConfig {
  strict?: boolean
  labels: { [name: string]: LabelConfig }
  repositories: RepositoryConfig[]
  publish: PublishConfig
}

/**
 *
 * Gets labels configuration from absolute path and validates schema.
 *
 * @param configPath
 */
export function getGithubLabelsConfiguration(
  configPath: string,
): LabelsConfig | null {
  /** Schema import */
  if (!fs.existsSync(configPath) || !path.isAbsolute(configPath)) {
    return null
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf8'))

  /** Validation */
  if (!validateSchema(config)) {
    return null
  }

  return config
}

/**
 * Transforms Github Labels configuration defined in JSON into a format
 * accepted by github-labels-core.
 *
 * @param config
 */
export async function generateConfigurationFromLabelsConfiguration(
  client: Octokit,
  config: LabelsConfig,
): Promise<
  { status: 'ok'; config: CoreConfig } | { status: 'err'; message: string }
> {
  /** Globals */
  const strict = withDefault(false)(config.strict)
  const commonLabels = config.labels
  const repositoryConfigurations = getRepositoryConfigurations(
    withDefault([] as RepositoryConfig[])(config.repositories),
  )

  try {
    /** Remote repositories */
    const repositories = await getRepositories(client)

    /** Definition is a core-compatible config of Github Labels for repo */
    const definitions = generateRepositoryDefinitions(
      repositoryConfigurations,
      repositories,
      {
        strict: strict,
        labels: commonLabels,
      },
    )

    /** Converts to object of repositories */
    const config = definitions.reduce(
      (acc, config) => ({
        ...acc,
        [config.name]: config.config,
      }),
      {},
    )

    return {
      status: 'ok',
      config: config,
    }
  } catch (err) {
    return {
      status: 'err',
      message: err.message,
    }
  }

  /**
   * Helper functions
   */

  /**
   *
   * Merges repository configurations with available repositories using globs.
   *
   * @param configs
   * @param repos
   */
  function generateRepositoryDefinitions(
    configs: {
      paths: RegExp
      labels?: { [name: string]: LabelConfig }
      strict?: boolean
    }[],
    repos: GithubRepository[],
    globals: { strict: boolean; labels: { [name: string]: LabelConfig } },
  ): { name: string; config: CoreRepositoryConfig }[] {
    const repositories = filterMap(repos, repository => {
      /** Combines definitions into one. */
      if (configs.some(config => config.paths.test(repository.full_name))) {
        return {
          name: repository.full_name,
          config: {
            strict: withDefault(globals.strict)(config.strict),
            labels: {
              ...globals.labels,
              ...config.labels,
            },
          },
        }
      } else {
        return null
      }
    })

    return repositories
  }

  /**
   *
   * Hydrates string repositories into a full-blown
   * object configuration and replaces paths with RegExp.
   *
   * @param configurations
   */
  function getRepositoryConfigurations(
    configurations: RepositoryConfig[],
  ): {
    paths: RegExp
    labels?: { [name: string]: LabelConfig }
    strict?: boolean
  }[] {
    const hydratedConigurations = configurations.map(configuration => {
      switch (typeof configuration) {
        case 'string':
          return { paths: new RegExp(configuration) }
        case 'object':
          return {
            paths: new RegExp(configuration.paths),
            labels: configuration.labels,
            strict: configuration.strict,
          }
      }
    })

    return hydratedConigurations
  }
}

/**
 * Utils
 */

/**
 *
 * Maps through the values and removes the ones which returned null.
 *
 * @param xs
 * @param fn
 */
function filterMap<X, Y>(xs: X[], fn: (x: X) => Y | null): Y[] {
  return xs.reduce<Y[]>((acc, x) => {
    const res = fn(x)
    if (res !== null) {
      return [...acc, res]
    } else {
      return acc
    }
  }, [])
}

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
