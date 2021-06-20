import { writeFileSync } from 'fs'
import path from 'path'

import { findFileUp } from './fs'
import { Repository, Configuration } from './generator'
import { withDefault, Dict } from './utils'

/* Constants */

const LS_CONFIG_PATH = 'labelsync.yml'

export type LabelSyncConfig = {
  repos: Dict<Repository>
}

/**
 * Creates a configuration file out of TypeScript configuration.
 */
export async function labelsync(
  config: LabelSyncConfig,
  output?: string,
  cwd: string = process.cwd(),
): Promise<Configuration | false> {
  /**
   * If there's no output path given, we try to find the first
   * package.json file and use that as the root.
   */
  /* istanbul ignore next */
  if (output === undefined) {
    const pkgPath = findFileUp(cwd, 'package.json')
    if (pkgPath === null) return false

    output = withDefault(path.resolve(pkgPath, LS_CONFIG_PATH), output)
  }

  /* Generate configuration */

  const configuration = new Configuration({ repos: config.repos })

  /* Write config to file */
  writeFileSync(output, configuration.getYAML(), { encoding: 'utf-8' })

  return configuration
}
