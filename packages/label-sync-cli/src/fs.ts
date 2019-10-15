import fs from 'fs'
import path from 'path'
import { promisify } from 'util'

import { Maybe } from './utils'

const fsReaddir = promisify(fs.readdir)

/**
 * Looks up for a folder starting with the current directory and
 * going up until it reaches the root folder or finds the folder.
 *
 * @param dir
 * @param name
 */
export async function findFolderUp(
  dir: string,
  name: string,
): Promise<Maybe<string>> {
  return findUp(dir, p => path.dirname(p) === name)
}

/**
 * Traverses file system up to find a specific directory that contains
 * a matching pattern.
 *
 * @param dir
 * @param pattern
 */
export async function findUp(
  dir: string,
  pattern: (path: string) => boolean,
): Promise<Maybe<string>> {
  switch (path.normalize(dir)) {
    /* End case: we reached the root. */
    case '/': {
      return null
    }
    /* Recursive case. */
    default: {
      const elements = await fsReaddir(dir)
      const includes = elements.some(pattern)

      if (includes) return dir
      else return findUp(path.join(dir, '../'), pattern)
    }
  }
}
