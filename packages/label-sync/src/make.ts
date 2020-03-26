import { writeFileSync } from 'fs'
import path from 'path'
import { isNull, isNullOrUndefined } from 'util'

import { findFileUp } from './fs'
import { Repository, Configuration } from './generator'
import { withDefault, Dict } from './utils'

/* Constants */

const LS_CONFIG_PATH = 'labelsync.yml'

export type LabelSyncConfig = {
  repos: Dict<Repository>
}

/**
 * Parses a configuration file for the configuration.
 * @param param0
 * @param cwd
 */
export async function labelsync(
  config: LabelSyncConfig,
  output?: string,
  cwd: string = process.cwd(),
): Promise<Configuration | false> {
  /* Search for git folder */
  const pkgPath = findFileUp(cwd, 'package.json')

  /* istanbul ignore next */
  if (isNull(pkgPath) && isNullOrUndefined(output)) {
    return false
  }

  output = withDefault(path.resolve(pkgPath!, LS_CONFIG_PATH), output)

  /* Generate configuration */

  const configuration = new Configuration({ repos: config.repos })

  /* Write config to file */
  writeFileSync(output, configuration.getYAML(), { encoding: 'utf-8' })

  return configuration
}
