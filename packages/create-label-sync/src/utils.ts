import * as fs from 'fs'
import * as path from 'path'

import { promisify } from 'util'

const mkdir = promisify(fs.mkdir)
const writeFile = promisify(fs.writeFile)

type Dict<T> = { [key: string]: T }

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
    .filter((file) => !ignore.some((glob) => RegExp(glob).test(file)))
    .flatMap((file) => {
      const rootFilePath = path.resolve(root, file)
      if (fs.lstatSync(rootFilePath).isDirectory()) {
        return Object.entries(
          mapKeys(loadTreeFromPath(rootFilePath, ignore), (key) =>
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

/**
 * Maps entries in an object.
 * @param m
 * @param fn
 */
export function mapEntries<T, V>(
  m: Dict<T>,
  fn: (v: T, key: string) => V,
): Dict<V> {
  return Object.fromEntries(
    Object.keys(m).map((key) => {
      return [key, fn(m[key], key)]
    }),
  )
}

/**
 * Writes virtual file system representation to the file system.
 *
 * @param vfs
 */
export async function writeTreeToPath(
  root: string,
  tree: { [path: string]: string },
): Promise<void> {
  tree = mapKeys(tree, (file) => path.resolve(root, file))

  const actions = Object.keys(tree).map(async (filePath) => {
    await mkdir(path.dirname(filePath), { recursive: true })
    await writeFile(filePath, tree[filePath])
  })

  try {
    await Promise.all(actions)
  } catch (err) /* istanbul ignore next */ {
    throw err
  }
}

/**
 * Maps keys of an object.
 * @param m
 * @param fn
 */
export function mapKeys<T>(
  m: Dict<T>,
  fn: (key: string, v: T) => string,
): Dict<T> {
  return Object.fromEntries(
    Object.keys(m).map((key) => {
      return [fn(key, m[key]), m[key]]
    }),
  )
}

/**
 * Creates a fallback default value.
 * @param fallback
 * @param value
 */
export function withDefault<T>(fallback: T, value: T | undefined): T {
  if (value) return value
  else return fallback
}
