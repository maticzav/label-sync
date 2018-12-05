#!/bash/node

import * as meow from 'meow'
import * as path from 'path'

import { handleSync, generateSyncReport } from '@prisma/github-labels-core'

import {
  generateConfigurationFromLabelsConfiguration,
  getGithubLabelsJSONConfiguration,
  getGithubLabelsJSConfiguration,
} from './config'

const cli = meow(
  `

`,
  {},
)

main('')

/**
 * Main
 */

async function main(relativeConfigPath: string): Promise<void> {
  /**
   * Parses path
   */
  const absoluteConfigPath = path.resolve(process.cwd(), relativeConfigPath)

  if (absoluteConfigPath.endsWith('.js')) {
    /** JavaScript configuration file */
    return
  } else if (absoluteConfigPath.endsWith('.json')) {
    /** JSON configuration file */
    return
  }

  /** Unsupported cases */
  console.log(`Unsupported configuration type ${relativeConfigPath}`)
}
