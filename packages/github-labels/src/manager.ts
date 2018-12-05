import * as path from 'path'

import {
  handleSync,
  generateSyncReport,
  Config,
  SyncOptions,
  SyncReport,
} from '@prisma/github-labels-core'

import {
  generateConfigurationFromJSONLabelsConfiguration,
  getGithubLabelsJSONConfiguration,
  getGithubLabelsJSConfiguration,
} from './config'

/**
 * Main
 */

export async function main(
  relativeConfigPath: string,
  options: { dryrun: boolean },
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
          dryRun: options.dryrun,
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
      if (configFile.publish.branch && !process.env.GITHUB_BRANCH) {
        return {
          status: 'err',
          message: 'Missing GITHUB_BRANCH environment variable.',
        }
      }

      /**
       * Override dryrun if specified in flags.
       */
      const dryRun =
        options.dryrun || configFile.publish.branch
          ? configFile.publish.branch !== process.env.GITHUB_BRANCH
          : false

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
