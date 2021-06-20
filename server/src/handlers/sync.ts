/**
 * This file contains the flow for handling label syncing.
 */

import { ProbotOctokit } from 'probot'

import * as config from '../config'
import { Maybe } from '../data/maybe'
import * as gh from '../github'
import { withDefault } from '../utils'

// MARK: - Types

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Methods

type HandleLabelSyncParams = {
  /**
   * Owner of the repository.
   */
  owner: string
  /**
   * Repository name.
   */
  repo: string
  /**
   * LabelSync configuration that we should sync.
   */
  config: config.LSCRepository
}

export type SyncResult =
  | { success: true; diff: Changes }
  | { success: false; message: string }

/**
 * Performs a labels sync with configuration.
 */
export async function sync(
  github: Octokit,
  params: HandleLabelSyncParams,
): Promise<SyncResult> {
  const difference = await changes(github, {
    owner: params.owner,
    repo: params.repo,
    labels: params.config.labels,
  })

  if (difference === null)
    return { success: false, message: `Could not calculate the change.` }

  /**
   * 1. Add new labels.
   * 2. Perform updates.
   * 3. Alias labels.
   * 4. Remove labels.
   */
  try {
    await Promise.all([
      gh.addLabelsToRepository(github, {
        repo: params.repo,
        owner: params.owner,
        labels: difference.additions,
        persist: true,
      }),
      gh.updateLabelsInRepository(github, {
        repo: params.repo,
        owner: params.owner,
        labels: difference.updates,
        persist: true,
      }),
      gh.aliasLabelsInRepository(github, {
        repo: params.repo,
        owner: params.owner,
        labels: difference.aliases,
        persist: true,
      }),
      gh.removeLabelsFromRepository(github, {
        repo: params.repo,
        owner: params.owner,
        labels: difference.removals,
        persist: params.config?.config?.removeUnconfiguredLabels || false,
      }),
    ])

    return { success: true, diff: difference }
  } catch (err) /* istanbul ignore next */ {
    return { success: false, message: err.message }
  }
}

/**
 * Respresents the changes between two configurations.
 */
export type Changes = {
  additions: gh.GithubLabel[]
  updates: gh.GithubLabel[]
  removals: gh.GithubLabel[]
  aliases: gh.GithubLabel[]
}

type ChangesParams = {
  repo: string
  owner: string
  labels: config.LSCRepository['labels']
}

/**
 * Finds the changes between configuration and the current state of the
 * labels on GitHub.
 */
export async function changes(
  github: Octokit,
  params: ChangesParams,
): Promise<Maybe<Changes>> {
  const remoteLabels = await gh.getRepositoryLabels(github, {
    repo: params.repo,
    owner: params.owner,
  })

  /* istanbul ignore if */
  if (remoteLabels === null) return null

  return diff(params.labels, remoteLabels)
}

/**
 * Calculates the diff of two label configurations.
 */
function diff(
  config: config.LSCRepository['labels'],
  current: gh.GithubLabel[],
): Changes {
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

  const currentLabelsMap = new Map<string, gh.GithubLabel>()

  for (const label of current) {
    currentLabelsMap.set(label.name, label)
  }

  /* Labels */

  let added: gh.GithubLabel[] = []
  let changed: gh.GithubLabel[] = []
  let aliased: gh.GithubLabel[] = []
  let removed: gh.GithubLabel[] = []

  /* Calculate differences */

  // TODO: you may not split label alias

  for (const label of config.keys()) {
    /**
     * We know that each label inhere is only referenced once.
     * You may not reference the same label in two different alias.
     */
    const hydratedLabel = hydrateLabel(label)

    const existingLabel = hydratedLabel.old_name !== undefined
    /* prettier-ignore */
    const labelAlias: string[] = withDefault([], config.get(label)?.alias)
        .filter((aliasName) => currentLabelsMap.has(aliasName))
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

    const labelHasChanged = current.some((cLabel) => {
      // Must have the same name.
      const sameName = cLabel.name === hydratedLabel.name

      /**
       * Description is optional. It has changed if:
       *  - it wasn't defined and now is
       *  - it was defined and has changed
       */
      const descriptionChanged =
        withDefault('', cLabel.description) !==
        withDefault('', hydratedLabel.description)

      /**
       * Color of a label is always defined. We check whether it has changed.
       */
      const colorChanged = cLabel.color !== hydratedLabel.color

      return sameName && (descriptionChanged || colorChanged)
    })

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
      currentLabelsMap.has(alias),
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

  for (const label of current) {
    /* Indicates that a label has been removed */
    const labelRemoved = !config.has(label.name)
    const labelRenamed = changed.find(({ old_name }) => old_name === label.name)

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
    additions: added,
    updates: changed,
    removals: removed,
    aliases: aliased,
  }

  /* Helper functions */

  function hydrateLabel(name: string): gh.GithubLabel {
    const oldLabel = currentLabelsMap.get(name)

    return {
      /* Naming */
      old_name: oldLabel?.name,
      name,
      /* Description */
      old_description: oldLabel?.description,
      description: config.get(name)!.description,
      /* Color */
      old_color: oldLabel?.color,
      color: config.get(name)!.color,
    }
  }

  //
}

/**
 * Tells whether report has changed.
 */
export function changed(diff: Changes): boolean {
  const changes =
    diff.additions.length +
    diff.aliases.length +
    diff.updates.length +
    diff.removals.length

  return changes > 0
}
