/**
 * This file contains utility functions that we use to communicate
 * with GitHub about issues and related content.
 */

import { ProbotOctokit } from 'probot'

import { withDefault } from '../utils'

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Types

export interface GithubLabel {
  /* Naming */
  old_name?: string
  name: string
  /* Description */
  old_description?: string | null
  description?: string | null
  /* Colors */
  old_color?: string
  color: string
  default?: boolean
}

// MARK: - Methods

type GetRepositoryLabelsParams = {
  repo: string
  owner: string
}

/**
 * Fetches labels in a repository.
 */
export async function getRepositoryLabels(
  github: Octokit,
  params: GetRepositoryLabelsParams,
) {
  let labels: GithubLabel[] = []

  /* Github paginates from page 1 */
  await handler(1)

  return labels

  /* Paginates and performs changes. */
  async function handler(page: number) {
    const repoLabels = await github.issues
      .listLabelsForRepo({
        owner: params.owner,
        repo: params.repo,
        per_page: 100,
        page: page,
      })
      .then((res) => res.data)

    labels.push(...repoLabels)

    /* Rerun handler if there are more labels available. */
    /* istanbul ignore next */
    if (repoLabels.length === 100) {
      await handler(page + 1)
    }
  }
}

type AddLabelsToRepositoryParams = {
  repo: string
  owner: string
  /**
   * List of labels that we should add to the repository.
   */
  labels: Pick<GithubLabel, 'name' | 'color'>[]
  /**
   * Tells whether this is only a simulation or persisting change.
   */
  persist: boolean
}

/**
 * Create new labels in a repository.
 */
export async function addLabelsToRepository(
  github: Octokit,
  params: AddLabelsToRepositoryParams,
): Promise<GithubLabel[]> {
  /* Return immediately on non-persistent sync. */
  if (params.persist === false) return params.labels

  /* Perform sync on persist. */
  const actions = params.labels.map((label) => addLabelToRepository(label))
  await Promise.all(actions)

  return params.labels

  /**
   * Helper functions
   */
  async function addLabelToRepository(label: GithubLabel) {
    try {
      await github.issues.createLabel({
        owner: params.owner,
        repo: params.repo,
        name: label.name,
        description: label.description || undefined,
        color: label.color,
      })
    } catch (err) /* istanbul ignore next */ {
      throw new Error(
        `Couldn't create ${label.name} in ${params.owner}/${params.repo}: ${err.message}`,
      )
    }
  }
}

type UpdateLabelsInRepositoryParams = {
  repo: string
  owner: string
  /**
   * Labels that we should update.
   */
  labels: GithubLabel[]
  /**
   * Tells whether the changes should remain visible.
   */
  persist: boolean
}

/**
 *
 * Updates labels in repository.
 *
 * When old_name is specified in the label, we try to rename the label.
 */
export async function updateLabelsInRepository(
  github: Octokit,
  params: UpdateLabelsInRepositoryParams,
): Promise<GithubLabel[]> {
  /* Return immediately on non-persistent sync. */
  if (params.persist === false) return params.labels

  /* Update values on persist. */
  const actions = params.labels.map((label) => updateLabelInRepository(label))
  await Promise.all(actions)

  return params.labels

  /**
   * Helper functions
   */
  async function updateLabelInRepository(label: GithubLabel) {
    try {
      await github.issues.updateLabel({
        current_name: withDefault(label.name, label.old_name),
        owner: params.owner,
        repo: params.repo,
        name: label.name,
        description: label.description || undefined,
        color: label.color,
      })
    } catch (err) /* istanbul ignore next */ {
      throw new Error(
        `Couldn't update ${label.name} in ${params.owner}/${params.repo}: ${err.message}`,
      )
    }
  }
}

type RemoveLabelFromRepositoryParams = {
  repo: string
  owner: string
  /**
   * Labels that we should remove.
   */
  labels: Pick<GithubLabel, 'name'>[]
  /**
   * Tells whether the changes should be made live.
   */
  persist: boolean
}

/**
 * Removes labels from repository.
 */
export async function removeLabelsFromRepository(
  github: Octokit,
  params: RemoveLabelFromRepositoryParams,
): Promise<Pick<GithubLabel, 'name'>[]> {
  /* Return immediately on non-persistent sync. */
  if (params.persist === false) return params.labels

  const actions = params.labels.map((label) =>
    removeLabelFromRepository(label.name),
  )
  await Promise.all(actions)

  return params.labels

  /**
   * Helper functions
   */
  async function removeLabelFromRepository(label: string) {
    try {
      const ghLabel = await github.issues.deleteLabel({
        owner: params.owner,
        repo: params.repo,
        name: label,
      })

      return ghLabel.data
    } catch (err) /* istanbul ignore next */ {
      throw new Error(
        `Couldn't remove ${label} in ${params.owner}/${params.repo}: ${err.message}`,
      )
    }
  }
}

type AliasLabelsInRepositoryParams = {
  repo: string
  owner: string
  /**
   * Labels to alias.
   */
  labels: GithubLabel[]
  /**
   * Tells whether we should apple the changes or just simulate them.
   */
  persist: boolean
}

/**
 * Aliases labels in a repository by adding them to labels.
 */
export async function aliasLabelsInRepository(
  github: Octokit,
  params: AliasLabelsInRepositoryParams,
): Promise<GithubLabel[]> {
  let page = 1

  /* Skip on no labels */
  if (params.labels.length === 0) return []

  await handler()

  return params.labels

  /* Paginates and performs changes. */
  async function handler() {
    const issues = await github.issues
      .listForRepo({
        owner: params.owner,
        repo: params.repo,
        per_page: 100,
        page,
      })
      .then((res) => res.data)

    /* Process all the issues. */
    for (const issue of issues) {
      /* Filter labels that should be in this issue but are not. */
      const missingLabels = params.labels.filter((label) =>
        issue.labels.some((issueLabel) => issueLabel.name === label.old_name),
      )

      if (missingLabels.length === 0) continue

      /* Add all the missing labels. */
      await addLabelsToIssue(github, {
        ...params,
        issue: issue.number,
        labels: missingLabels,
      })
    }

    /* Rerun handler if there are more issues available. */
    /* istanbul ignore next */
    if (issues.length === 100) {
      page += 1
      await handler()
    }
  }
}

type AddLabelsToIssueParams = {
  repo: string
  owner: string
  issue: number
  /**
   * Names of the labels to add to the issue.
   */
  labels: Pick<GithubLabel, 'name'>[]
  /**
   * Tells whether we should only simulate the function.
   */
  persist: boolean
}

/**
 * Adds labels to an issue.
 */
export async function addLabelsToIssue(
  github: Octokit,
  params: AddLabelsToIssueParams,
): Promise<Pick<GithubLabel, 'name'>[]> {
  /* Return immediately on non-persistent sync. */
  /* istanbul ignore next */
  if (params.persist === false) return params.labels

  const ghLabels = await github.issues
    .addLabels({
      repo: params.repo,
      owner: params.owner,
      issue_number: params.issue,
      labels: params.labels.map((label) => label.name),
    })
    .then((res) => res.data)

  return ghLabels
}

/**
 * Compares two labels by comparing all of their keys.
 */
export function isLabel(local: GithubLabel): (remote: GithubLabel) => boolean {
  return (remote) =>
    local.name === remote.name &&
    local.description === remote.description &&
    local.color === remote.color
}

/**
 * Determines whether the two configurations configure the same label.
 */
export function isLabelDefinition(
  local: GithubLabel,
): (remote: GithubLabel) => boolean {
  return (remote) => local.name === remote.name
}
