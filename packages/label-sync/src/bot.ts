import { getGithubBot as getGithubBotCore } from 'label-sync-core'
import { getConfigurationFile } from './config'

/**
 *
 * Generates bot from configuration.
 *
 * @param relativeConfigPath
 */
export async function getGithubBot(relativeConfigPath: string) {
  /* Obtains configuration */

  const config = await getConfigurationFile(relativeConfigPath, {})

  if (config.status === 'err') {
    return { status: 'err', message: config.message }
  }

  const bot = getGithubBotCore(config.config)

  return bot
}
