import { Octokit } from 'probot'

import {
  LSCRepository,
  LSCLabel,
  LSCRepositoryConfiguration,
} from '../configuration'
import * as maybe from '../data/maybe'
import { Dict } from '../data/dict'
import {
  GithubLabel,
  getRepositoryLabels,
  addLabelsToRepository,
  updateLabelsInRepository,
  removeLabelsFromRepository,
  aliasLabelsInRepository,
} from '../github'
import { withDefault } from '../utils'

export type LabelSyncReport =
  | {
      status: 'Success'
      owner: string
      repo: string
      additions: GithubLabel[]
      updates: GithubLabel[]
      removals: GithubLabel[]
      aliases: GithubLabel[]
      config: {
        config: Required<LSCRepositoryConfiguration>
        labels: Dict<LSCLabel>
      }
    }
  | {
      status: 'Failure'
      repo: string
      owner: string
      message: string
      config: {
        config: LSCRepositoryConfiguration
        labels: Dict<LSCLabel>
      }
    }

/**
 *
 * Performs a labels sync with configuration.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export async function handleLabelSync(
  octokit: Octokit,
  owner: string,
  repo: string,
  { config, labels }: LSCRepository,
  persist: boolean,
): Promise<LabelSyncReport> {
  /**
   * Label Sync handler firstly loads current labels from Github,
   * and new labels from local configuration.
   *
   * After that it generates a diff and creates, updates or deletes
   * label definitions in a particular repository.
   */
  const remoteLabels = await getRepositoryLabels(octokit, { repo, owner })
  const labelsDiff = maybe.andThen(remoteLabels, calculateDiff(labels))

  /* Configuration */

  const removeUnconfiguredLabels = withDefault(
    false,
    config?.removeUnconfiguredLabels,
  )

  /* istanbul ignore if */
  if (labelsDiff === null) {
    return {
      status: 'Failure',
      owner,
      repo,
      message: `Couldn't make a diff of labels.`,
      config: {
        labels,
        config: {
          removeUnconfiguredLabels,
        },
      },
    }
  }

  const { added, changed, aliased, removed } = labelsDiff

  /* Perform sync */
  /**
   * 1. Add new labels.
   * 2. Perform updates.
   * 3. Alias labels.
   * 4. Remove labels.
   */

  const additions = await addLabelsToRepository(
    octokit,
    { repo, owner },
    added,
    persist,
  )
  const updates = await updateLabelsInRepository(
    octokit,
    { repo, owner },
    changed,
    persist,
  )
  const aliases = await aliasLabelsInRepository(
    octokit,
    { repo, owner },
    aliased,
    persist,
  )
  const removals = await removeLabelsFromRepository(
    octokit,
    { repo, owner },
    removed,
    removeUnconfiguredLabels && persist,
  )

  return {
    status: 'Success',
    repo,
    owner,
    additions,
    updates,
    removals,
    aliases,
    config: {
      config: {
        removeUnconfiguredLabels,
      },
      labels,
    },
  }
}

/**
 *
 * Calculates the diff of labels.
 *
 * @param currentLabels
 * @param newLabels
 */
export function calculateDiff(
  config: LSCRepository['labels'],
): (
  currentLabels: GithubLabel[],
) => {
  added: GithubLabel[]
  changed: GithubLabel[]
  aliased: GithubLabel[]
  removed: GithubLabel[]
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

  return (currentLabels) => {
    const currentLabelsNames = currentLabels.map((l) => l.name)

    /* Labels */

    let added: GithubLabel[] = []
    let changed: GithubLabel[] = []
    let aliased: GithubLabel[] = []
    // let aliased: { [target: string]: GithubLabel[] } = {}
    let removed: GithubLabel[] = []

    /* Calculate differences */

    // TODO: you may not split label alias

    for (const label of Object.keys(config)) {
      /**
       * We know that each label in here is only referenced once.
       * You may not reference the same label in two different alias.
       */
      const hydratedLabel = hydrateLabel(label)
      /* prettier-ignore */
      const labelAlias: string[] = withDefault([], config[label].alias)
        .filter((aliasName) => currentLabelsNames.includes(aliasName))
      const existingLabel = currentLabelsNames.includes(label)
      const labelIsAliased = labelAlias.length !== 0

      /**
       * New labels:
       *  - doesn't exist yet
       *  - isn't aliased
       */
      if (!existingLabel && !labelIsAliased) {
        added.push(hydratedLabel)
        continue
      }

      /**
       * Updated labels:
       *  - either color or description has changed.
       */

      const labelHasChanged = currentLabels.some(
        (cLabel) =>
          // Must have the same name.
          cLabel.name === hydratedLabel.name &&
          // Description or color might have changed.
          (cLabel.description !== hydratedLabel.description ||
            cLabel.color !== hydratedLabel.color),
      )

      if (existingLabel && labelHasChanged && !labelIsAliased) {
        changed.push(hydratedLabel)
        continue
      }

      /**
       * Aliased labels:
       *  - add an existing label to changed labels
       *  - this one shouldn't be removed afterwards since we
       *    are renaming it.
       */
      const existingAliasedLabel = labelAlias.find((alias) =>
        currentLabelsNames.includes(alias),
      )

      for (const alias of labelAlias) {
        /**
         * We should rename the label to an existing one if the new
         * one doesn't exist yet.
         */
        if (alias === existingAliasedLabel && !existingLabel) {
          changed.push({
            ...hydratedLabel,
            old_name: alias,
          })
        } else {
          aliased.push({
            ...hydratedLabel,
            old_name: alias,
          })
        }
      }

      /* End of label investigation */
    }

    for (const label of currentLabels) {
      /* Indicates that a label has been removed */
      const labelRemoved = !config.hasOwnProperty(label.name)
      const labelRenamed = changed.find(
        ({ old_name }) => old_name === label.name,
      )

      /**
       * Remove all the labels that weren't renamed (changed)
       * as part of the aliasing.
       */
      if (labelRemoved && !labelRenamed) {
        removed.push({
          name: label.name,
          color: label.color,
        })
        continue
      }
    }

    return {
      added,
      changed,
      removed,
      aliased,
    }
  }

  /* Helper functions */

  function hydrateLabel(name: string): GithubLabel {
    return {
      name,
      color: config[name]!.color,
      description: config[name]!.description,
    }
  }
}
