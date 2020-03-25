import { compile } from 'handlebars'

import { mapEntries } from './data/dict'
import { GHTree } from './github'

/**
 * Populates the template with repositories.
 * @param tree
 */
export function populateTempalte(
  tree: GHTree,
  data: { repository: string; repositories: { name: string }[] },
): GHTree {
  return mapEntries(tree, (file) => compile(file)(data))
}
