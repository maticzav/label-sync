import * as path from 'path'

import { handleSync, generateSyncReport, SyncReport } from 'label-sync-core'

import { getConfigurationFile, ConfigurationOptions } from './config'

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
