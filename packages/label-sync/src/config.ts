import * as path from 'path'
import * as fs from 'fs'
import * as Ajv from 'ajv'
import * as Octokit from '@octokit/rest'

import { Config as CoreConfig, SyncOptions } from 'label-sync-core'
import {
  RepositoryConfig as CoreRepositoryConfig,
  LabelConfig,
  Config,
} from 'label-sync-core/dist/labels'

import { getRepositories, GithubRepository } from './github'

/** Schema */

import schema = require('./schema.json')

const ajv = new Ajv()
const validateSchema = ajv.compile(schema)

/**
 * Labels
 */

interface PublishConfig {
  branch: string
}

type RepositoryConfig =
  | string
  | {
      paths: string
      labels?: { [name: string]: LabelConfig }
      strict?: boolean
    }

interface LabelsConfig {
  strict?: boolean
  labels: { [name: string]: LabelConfig }
  repositories: RepositoryConfig[]
  publish: PublishConfig
}

/**
 *
 * Gets JSON labels configuration from absolute path, and validates schema.
 *
 * @param configPath
 */
export function getGithubLabelsJSONConfiguration(
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
 *
 * Obtains JavaScript configuration file.
 *
 * @param configPath
 */
export function getGithubLabelsJSConfiguration(
  configPath: string,
): CoreConfig | null {
  /** Schema import */
  if (!fs.existsSync(configPath) || !path.isAbsolute(configPath)) {
    return null
  }

  const config = require(configPath)

  return config
}

/**
 * Transforms Github Labels configuration defined in JSON into a format
 * accepted by github-labels-core.
 *
 * @param config
 */
export async function generateConfigurationFromJSONLabelsConfiguration(
  config: LabelsConfig,
  options: {
    githubToken: string
  },
): Promise<
  { status: 'ok'; config: CoreConfig } | { status: 'err'; message: string }
> {
  /**
   * Authentication
   */

  const client = new Octokit()

  client.authenticate({
    type: 'token',
    token: options.githubToken,
  })

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
      isExact: boolean
      labels?: { [name: string]: LabelConfig }
      strict?: boolean
    }[],
    repos: GithubRepository[],
    globals: { strict: boolean; labels: { [name: string]: LabelConfig } },
  ): { name: string; config: CoreRepositoryConfig }[] {
    const repositories = filterMap(repos, repository => {
      /** Finds every repository definition in configuration. */
      const repositoryConfigs = configs.filter(config =>
        config.paths.test(repository.full_name),
      )

      /** Combines definitions into one. */
      if (repositoryConfigs.length > 0) {
        const combinedLabels = repositoryConfigs.reduce<{
          [label: string]: LabelConfig
        }>(
          (acc, config) => ({
            ...acc,
            ...config.labels,
          }),
          {},
        )

        // TODO: Improve strict definition.
        const combinedStrict = repositoryConfigs.find(
          config => config.isExact && config.strict !== undefined,
        )

        return {
          name: repository.full_name,
          config: {
            strict: withDefault(globals.strict)(
              combinedStrict ? combinedStrict.strict : undefined,
            ),
            labels: {
              ...globals.labels,
              ...combinedLabels,
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
    isExact: boolean
    labels?: { [name: string]: LabelConfig }
    strict?: boolean
  }[] {
    const hydratedConigurations = configurations.map(configuration => {
      switch (typeof configuration) {
        case 'string':
          return {
            paths: new RegExp(configuration),
            isExact: configuration.includes('*'),
          }
        case 'object':
          return {
            paths: new RegExp(configuration.paths),
            isExact: configuration.paths.includes('*'),
            labels: configuration.labels,
            strict: configuration.strict,
          }
      }
    })

    return hydratedConigurations
  }
}

export interface ConfigurationOptions {
  dryrun?: boolean
}

/**
 *
 * Obtains the configuration file from relative path.
 *
 * @param relativeConfigPath
 */
export async function getConfigurationFile(
  relativeConfigPath: string,
  options: ConfigurationOptions = {},
): Promise<
  | { status: 'ok'; config: Config; options: SyncOptions }
  | { status: 'err'; message: string }
> {
  const absoluteConfigPath = path.resolve(process.cwd(), relativeConfigPath)

  if (absoluteConfigPath.endsWith('.js')) {
    /** JavaScript configuration file */
    const config = getGithubLabelsJSConfiguration(absoluteConfigPath)

    if (config === null) {
      return {
        status: 'err',
        message: `Couldn't find a valid configuration file at ${absoluteConfigPath}`,
      }
    }

    return {
      status: 'ok',
      config,
      options: {
        githubToken: process.env.GITHUB_TOKEN!,
        dryRun: withDefault(false)(options.dryrun),
      },
    }
  } else if (absoluteConfigPath.endsWith('.json')) {
    /** JSON configuration file */
    const configFile = getGithubLabelsJSONConfiguration(absoluteConfigPath)

    if (configFile === null) {
      return {
        status: 'err',
        message: `Couldn't find a valid configuration file at ${absoluteConfigPath}`,
      }
    }

    /** Parse configuration file */
    const config = await generateConfigurationFromJSONLabelsConfiguration(
      configFile,
      {
        githubToken: process.env.GITHUB_TOKEN!,
      },
    )

    if (config.status === 'err') {
      return {
        status: 'err',
        message: config.message,
      }
    }

    /** Report missing GITHUB_BRANCH environment */
    if (get(configFile, 'publish.branch') && !process.env.GITHUB_BRANCH) {
      return {
        status: 'err',
        message: 'Missing GITHUB_BRANCH environment variable.',
      }
    }

    /**
     * Override dryrun if specified in flags.
     */
    const dryRun = withDefault(
      get(configFile, 'publish.branch')
        ? get(configFile, 'publish.branch') !== process.env.GITHUB_BRANCH
        : false,
    )(options.dryrun)

    return {
      status: 'ok',
      config: config.config,
      options: {
        githubToken: process.env.GITHUB_TOKEN!,
        dryRun: dryRun,
      },
    }
  } else {
    /** Unsupported cases */
    return {
      status: 'err',
      message: `Unsupported configuration type ${relativeConfigPath}`,
    }
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

/**
 *
 * Recursively gets a poroperty from the path.
 *
 * @param obj
 * @param path
 */
function get(obj: any, path: string): any {
  const [head, ...tail] = path.split('.')
  if (obj.hasOwnProperty(head)) {
    if (tail.length === 0) {
      return obj[head]
    } else {
      return get(obj[head], tail.join('.'))
    }
  } else {
    return undefined
  }
}
