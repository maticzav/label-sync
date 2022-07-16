import * as path from 'path'

import { Dict } from '../data/dict'

/**
 * Represents a Github file and folder structure where
 * files are represented as UTF-8 encoded strings keyed by the their relative
 * path to the repository root.
 */
export type FileTree = { [path: string]: string }

/**
 * Represents a file and folder structure where
 * files are represented as UTF-8 encoded strings keyed by the their relative
 * path to the root directory.
 */
export namespace FileTree {
  export type Type = { [path: string]: string }

  /**
   * Returns the files that are not nested.
   */
  export function getRootFiles(tree: FileTree): Dict<string> {
    const files = Object.keys(tree)
      .filter(isFileInRootFolder)
      .map((name) => [name, tree[name]])

    return Object.fromEntries(files)
  }

  /**
   * Returns a dictionary of remaining subtrees.
   */
  export function getSubtrees(tree: FileTree): Dict<FileTree> {
    return Object.keys(tree)
      .filter((file) => !isFileInRootFolder(file))
      .reduce<Dict<FileTree>>((acc, filepath) => {
        const [subTree, newFilepath] = shiftPath(filepath)
        if (!acc.hasOwnProperty(subTree)) {
          acc[subTree] = {}
        }
        acc[subTree][newFilepath] = tree[filepath]
        return acc
      }, {})
  }

  /**
   * Shifts path by one and returns the shifted part as first element in tuple
   *  and remaining part as the second.
   */
  function shiftPath(filepath: string): [string, string] {
    const [dir, ...dirs] = filepath.split('/').filter(Boolean)
    return [dir, dirs.join('/')]
  }

  /**
   * Determines whether a path references a direct file
   * or a file in the nested folder.
   *
   * "/src/index.ts" -> false
   * "/index.ts" -> true
   * "index.ts" -> true
   */
  function isFileInRootFolder(filePath: string): boolean {
    return ['.', '/'].includes(path.dirname(filePath))
  }
}
