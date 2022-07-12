import path from 'path'
import fs from 'fs'
import * as handlebars from 'handlebars'
import * as prettier from 'prettier'

import { FileTree } from './filetree'
import { mapKeys, mapEntries } from '../data/dict'

const IGNORED_FILES = ['dist', 'node_modules', '.DS_Store', /.*\.log.*/, /.*\.lock.*/]

const TEMPLATES_PATH = path.resolve(__dirname, '../../../../templates')

/**
 * Preloaded template files.
 */
export const TEMPLATES = {
  yaml: loadTreeFromPath({
    root: path.resolve(TEMPLATES_PATH, 'yaml'),
    ignore: IGNORED_FILES,
  }),
  typescript: loadTreeFromPath({
    root: path.resolve(TEMPLATES_PATH, 'typescript'),
    ignore: IGNORED_FILES,
  }),
}

/**
 * Loads a tree of utf-8 decoded files at paths.
 */
export function loadTreeFromPath({ root, ignore }: { root: string; ignore: (string | RegExp)[] }): {
  [path: string]: string
} {
  const files = fs.readdirSync(root, { encoding: 'utf-8' })
  const tree = files
    .filter((file) => !ignore.some((glob) => RegExp(glob).test(file)))
    .flatMap((file) => {
      const rootFilePath = path.resolve(root, file)
      if (fs.lstatSync(rootFilePath).isDirectory()) {
        return Object.entries(mapKeys(loadTreeFromPath({ root: rootFilePath, ignore }), (key) => unshift(file, key)))
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
 * Populates the template with repositories.
 * @param tree
 */
export function populateTemplate(
  tree: FileTree,
  data: {
    repository: string
    repositories: { name: string }[]
  },
): FileTree {
  return mapEntries(tree, (file, name) => {
    /* Personalize file */
    const populatedFile = handlebars.compile(file)(data)

    /* Format it */
    switch (path.extname(name)) {
      case '.ts': {
        return prettier.format(populatedFile, { parser: 'typescript' })
      }
      case '.yml': {
        return prettier.format(populatedFile, { parser: 'yaml' })
      }
      case '.md': {
        return prettier.format(populatedFile, { parser: 'markdown' })
      }
      case '.json': {
        return prettier.format(populatedFile, { parser: 'json' })
      }
      default: {
        return populatedFile
      }
    }
  })
}
