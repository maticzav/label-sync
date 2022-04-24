import * as handlebars from 'handlebars'
import * as path from 'path'
import * as prettier from 'prettier'

import { mapEntries } from '../data/dict'
import { GHTree } from './github'

/**
 * Populates the template with repositories.
 * @param tree
 */
export function populateTemplate(tree: GHTree, data: { repository: string; repositories: { name: string }[] }): GHTree {
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
