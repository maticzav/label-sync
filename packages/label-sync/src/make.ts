import { writeFileSync } from 'fs'
import path from 'path'
import { isNull, isNullOrUndefined } from 'util'

import { findFileUp } from './fs'
import { Configuration } from './generator'
import { withDefault } from './utils'
import { EOL } from 'os'

/* Constants */

const LS_CONFIG_PATH = 'labelsync.yml'

/* File compilation */

export type MakeInput = {
  configs: Configuration[]
  outputs?: { config?: string }
}

/**
 * Parses a configuration file for the configuration.
 * @param param0 
 * @param cwd 
 */
export async function make(
  { configs, outputs }: MakeInput,
  cwd: string = process.cwd(),
): Promise<boolean> {
  /* Search for git folder */
  const pkgPath = await findFileUp(cwd, 'package.json')

  /* istanbul ignore next */
  if (isNull(pkgPath) && isNullOrUndefined(outputs?.config)) {
    return false
  }

  const output = withDefault(
    path.resolve(pkgPath!, LS_CONFIG_PATH),
    outputs?.config,
  )

  /* Write config to file */
  writeFileSync(output, configs.map(c => c.getYAML()).join(EOL), {
    encoding: 'utf-8',
  })

  return true
}
