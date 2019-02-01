import {
  handleSync,
  generateSyncReport,
  SyncReport,
  Config,
} from 'label-sync-core'
import {
  getConfigurationFile,
  ConfigurationOptions,
  getGithubLabelsJSConfiguration,
  getGithubLabelsJSONConfiguration,
  generateConfigurationFromJSONLabelsConfiguration,
} from './config'
import { withDefault, get } from './utils'

/**
 * Manager
 */

export async function manage(
  relativeConfigPath: string,
  options: ConfigurationOptions,
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

  const config = await getConfigurationFile(relativeConfigPath, options)

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
}

interface ConfigurationOptions {
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
