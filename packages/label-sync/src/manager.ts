import * as path from 'path'

import {
  handleSync,
  generateSyncReport,
  Config,
  SyncOptions,
  SyncReport,
} from 'label-sync-core'

import {
  generateConfigurationFromJSONLabelsConfiguration,
  getGithubLabelsJSONConfiguration,
  getGithubLabelsJSConfiguration,
} from './config'

/**
 * Manager
 */

export async function manage(
  relativeConfigPath: string,
  options: { dryrun?: boolean },
): Promise<
  | { status: 'ok'; report: SyncReport; message: string }
  | { status: 'err'; message: string }
> {
  /**
   * Environment
   */

  if (!process.env.GITHUB_TOKEN) {
    return { status: 'err', message: 'Missing Github credentials!' }
  }

  /**
   * Configuration
   */

  const config = await getConfigurationFile(relativeConfigPath)

  if (config.status === 'err') {
    return { status: 'err', message: config.message }
  }

  /**
   * Sync
   */

  const report = await handleSync(config.config, config.options)

  /**
   * Report
   */

  return {
    status: 'ok',
    report: report,
    message: generateSyncReport(report),
  }

  /**
   * Helper functions
   *
   * Functions which help with the execution of the main
   * process of Label Sync.
   */

  /**
   *
   * Obtains the configuration file from relative path.
   *
   * @param relativeConfigPath
   */
  async function getConfigurationFile(
    relativeConfigPath: string,
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
}

/**
 * Utils
 */

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
