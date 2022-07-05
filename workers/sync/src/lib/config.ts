import { LSCRepository, normalizeColor } from '@labelsync/config'
import { GitHubLabel } from './github'

/**
 * Calculates the difference between labels in the configuration
 * and the labels that are currently in the repository.
 */
export function calculateConfigurationDiff({
  config,
  currentLabels,
}: {
  config: LSCRepository['labels']
  currentLabels: GitHubLabel[]
}): {
  added: GitHubLabel[]
  changed: GitHubLabel[]
  aliased: GitHubLabel[]
  removed: GitHubLabel[]
} {
  /**
   * Label may fall into four classes:
   *  - it may be new: not on Github and no other label
   *    in the configuration references it
   *  - it may be updated: name remains the same but color
   *    or description have changed
   *  - it may be aliased: one of the labels references a
   *    label that exists on Github but is not present in
   *    the configuration anymore
   *  - it may be removed: no labels alias it and it is
   *    not in the configuration
   *
   * In light of that we diff labels so that:
   *  - added: contains all the labels we should add
   *  - changed: contains all the labels that we should rename,
   *      change description or change color
   *  - aliased: contains all the labels that we should cleverly
   *      reference in the issues
   *  - removed: contains all the labels that we should remove
   */

  const currentLabelsMap = new Map(currentLabels.map((l) => [l.name, l]))

  let added: GitHubLabel[] = []
  let changed: GitHubLabel[] = []
  let aliased: GitHubLabel[] = []
  let removed: GitHubLabel[] = []

  for (const label of Object.keys(config)) {
    // We know that each label inhere is only referenced once.
    // You may not reference the same label in two different alias.
    const hydratedLabel = hydrateLabel(label)

    const existingLabel = hydratedLabel.old_name !== undefined

    const labelAlias: string[] = (config[label].alias ?? []).filter((aliasName) => currentLabelsMap.has(aliasName))
    const labelIsAliased = labelAlias.length !== 0

    // New labels:
    //  - doesn't exist yet
    //  - isn't aliased
    if (!existingLabel && !labelIsAliased) {
      added.push(hydratedLabel)
      continue
    }

    // Updated labels:
    //  - either color or description has changed.
    const labelHasChanged = currentLabels.some((cLabel) => {
      const sameName = cLabel.name === hydratedLabel.name

      // Description is optional. It has changed if:
      //  - it wasn't defined and now is
      //  - it was defined and has changed
      const descriptionChanged = (cLabel.description ?? '') !== (hydratedLabel.description ?? '')

      // Color of a label is always defined. We check whether it has changed.
      const colorChanged = normalizeColor(cLabel.color) !== normalizeColor(hydratedLabel.color)

      return sameName && (descriptionChanged || colorChanged)
    })

    if (existingLabel && labelHasChanged && !labelIsAliased) {
      changed.push(hydratedLabel)
      continue
    }

    // Aliased labels:
    //  - add an existing label to changed labels
    //  - this one shouldn't be removed afterwards since we
    //    are renaming it.
    const existingAliasedLabel = labelAlias.find((alias) => currentLabelsMap.has(alias))
    for (const alias of labelAlias) {
      // We should rename the label to an existing one if the new
      // one doesn't exist yet.
      if (alias === existingAliasedLabel && !existingLabel) {
        changed.push({ ...hydratedLabel, old_name: alias })
      } else {
        aliased.push({ ...hydratedLabel, old_name: alias })
      }
    }
  }

  for (const label of currentLabels) {
    const labelRemoved = !config.hasOwnProperty(label.name)
    const labelRenamed = changed.find(({ old_name }) => old_name === label.name)

    // Mark label as removed if it weren't renamed (changed)
    // as part of the aliasing and isn't configured anymore.
    if (labelRemoved && !labelRenamed) {
      removed.push({ name: label.name, color: label.color })
    }
  }

  return { added, changed, removed, aliased }

  /**
   * Returns information for the label with a given name from the active labels map.
   */
  function hydrateLabel(name: string): GitHubLabel {
    const oldLabel = currentLabelsMap.get(name)

    return {
      old_name: oldLabel?.name,
      name,
      //
      description: config[name]!.description,
      //
      old_color: oldLabel?.color,
      color: config[name]!.color,
    }
  }
}
