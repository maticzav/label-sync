import { compile } from 'handlebars'
import { GHTree } from './github'
import { mapEntries } from './data/dict'

/**
 * Populates the template with repositories.
 * @param tree
 */
export function populateTempalte(
  tree: GHTree,
  data: { repositories: { name: string }[] },
): GHTree {
  return mapEntries(tree, file => compile(file)(data))
}
