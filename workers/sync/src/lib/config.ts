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
  aliased: Required<Pick<GitHubLabel, 'name' | 'old_name'>>[]
  removed: Pick<GitHubLabel, 'name'>[]
} {
  /**
   * Label may fall into four classes:
   *  - it may be new: not on GitHub and no other label
   *    in the configuration references it (e.g. as an old version of the label)
   *  - it may be updated: name remains the same but color
   *    or description have changed
   *  - it may be aliased: one of the labels references a
   *    label that exists on GitHub but is not present in
   *    the configuration anymore
   *    (one label may reference multiple old labels, but multiple
   *      labels can't refernce the same old label)
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

  const added: GitHubLabel[] = []
  const changed: GitHubLabel[] = []
  const aliased: Required<Pick<GitHubLabel, 'name' | 'old_name'>>[] = []
  const removed: Pick<GitHubLabel, 'name'>[] = []

  for (const label of Object.keys(config)) {
    // This algorithm assumes each label is only referenced once.
    // You may not reference the same label in two different alias.
    const hydratedLabel = hydrateLabel(label)

    const isExistingLabel = hydratedLabel.old_name !== undefined

    const aliaii: string[] = (config[label].alias ?? []).filter((aliasName) => currentLabelsMap.has(aliasName))
    const isLabelAlias = aliaii.length > 0

    const hasLabelChanged = currentLabels.some((cLabel) => {
      if (cLabel.name !== hydratedLabel.name) {
        return false
      }

      // Description is optional. It has changed if:
      //  - it wasn't defined and now is
      //  - it was defined and has changed
      const hasDescriptionChanged = (cLabel.description ?? '') !== (hydratedLabel.description ?? '')

      // Color of a label is always defined. We check whether it has changed.
      const hasColorChanged = normalizeColor(cLabel.color) !== normalizeColor(hydratedLabel.color)

      return hasDescriptionChanged || hasColorChanged
    })

    // New label:
    //  - doesn't exist yet
    //  - isn't an alias for another label
    if (!isExistingLabel && !isLabelAlias) {
      added.push(hydratedLabel)
      continue
    }

    // Updated labels:
    //  - either color or description has changed.
    if (isExistingLabel && hasLabelChanged && !isLabelAlias) {
      changed.push(hydratedLabel)
      continue
    }

    // Aliased labels:
    //  - add an existing label to changed labels
    //  - this one shouldn't be removed afterwards since we
    //    are renaming it.

    // Find the first old label of the label that is currently examined
    // and use it as the source that should be changed.
    const origin = aliaii.find((alias) => currentLabelsMap.has(alias))

    for (const alias of aliaii) {
      if (alias === origin && !isExistingLabel) {
        // Change the "original" label to the name of the new one.
        changed.push({ ...hydratedLabel, old_name: alias })
      } else {
        // Alias all other labels to the new one.
        aliased.push({ ...hydratedLabel, old_name: alias })
      }
    }
  }

  for (const label of currentLabels) {
    const isLabelConfigured = config.hasOwnProperty(label.name)
    const isLabelRenamed = changed.find(({ old_name }) => old_name === label.name)

    // Mark label as removed if it weren't renamed (changed)
    // as part of the aliasing and isn't configured anymore.
    //
    // NOTE: This also catches aliased labels that won't be renamed.
    if (!isLabelConfigured && !isLabelRenamed) {
      removed.push({ name: label.name })
    }
  }

  return {
    added,
    changed,
    removed,
    aliased,
  }

  /**
   * Returns information for the label with a given name from the
   * currently active labels map.
   */
  function hydrateLabel(name: string): GitHubLabel {
    const oldLabel = currentLabelsMap.get(name)

    return {
      old_name: oldLabel?.name,
      name,
      //
      old_description: oldLabel?.description,
      description: config[name]!.description,
      //
      old_color: oldLabel?.color,
      color: config[name]!.color,
    }
  }
}
