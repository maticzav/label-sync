import arg from 'arg'
import { writeFileSync } from 'fs'
import path from 'path'
import { isNull } from 'util'

import { findFolderUp } from './fs'
import { Configuration } from './generator'
import { withDefault } from './utils'

/* Constants */

const LS_CONFIG_PATH = 'labelsync.yml'

/* File compilation */

export async function compile(configPath: string, cwd: string) {
  /* Search for git folder */
  const gitPath = await findFolderUp(cwd, '.git')

  /* istanbul ignore next */
  if (isNull(gitPath)) {
    console.log(`Couldn't find .git folder.`)
    process.exit(1)
  }

  /* Load configuration */
  const config: Configuration = require(path.resolve(cwd, configPath)).default

  /* istanbul ignore next */
  if (config.constructor.name !== 'Configuration') {
    console.log(`Config file doesn't expose default Configuration type.`)
    process.exit(1)
  }

  /* Parse config */

  try {
    const yamlPath = path.resolve(gitPath!, LS_CONFIG_PATH)
    writeFileSync(yamlPath, config.getYAML(), { encoding: 'utf-8' })
    console.log(`Succesfully loaded configuration to: ${yamlPath}`)
    process.exit(0)
  } catch (err) /* istanbul ignore next */ {
    console.error(err)
    process.exit(1)
  }
}

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'TEST') {
  const argv = arg({
    '--path': String,
  })

  const path = withDefault('labelsync.ts', argv['--path'])
  compile(path, process.cwd())
}
