import fs from 'fs'
import path from 'path'
import { mapKeys } from './data/dict'

/**
 * Negates the wrapped function.
 * @param fn
 */
export function not<T, L extends Array<T>>(
  fn: (...args: L) => boolean,
): (...args: L) => boolean {
  return (...args) => !fn(...args)
}

/**
 * Loads a tree of utf-8 decoded files at paths.
 *
 * @param path
 */
export function loadTreeFromPath(
  root: string,
  ignore: (string | RegExp)[],
): { [path: string]: string } {
  const files = fs.readdirSync(root, { encoding: 'utf-8' })
  const tree = files
    .filter(file => !ignore.some(glob => RegExp(glob).test(file)))
    .flatMap(file => {
      const rootFilePath = path.resolve(root, file)
      if (fs.lstatSync(rootFilePath).isDirectory()) {
        return Object.entries(
          mapKeys(loadTreeFromPath(rootFilePath, ignore), key =>
            unshift(file, key),
          ),
        )
      } else {
        return [[file, fs.readFileSync(rootFilePath, { encoding: 'utf-8' })]]
      }
    })

  return Object.fromEntries(tree)
}

/**
 * Adds a folder to the path.
 * @param pre
 * @param path
 */
function unshift(pre: string, path: string): string {
  return [pre, ...path.split('/').filter(Boolean)].join('/')
}
