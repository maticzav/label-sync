/**
 * This file contains code associated with events related to issues
 * themselves (i.e. labeling issues, comments, etc.).
 */

import * as gh from '../github'
import { Handler } from '../event'

// MARK: - Event

export const handler: Handler = (on, { data }) => {
  /**
   * Label Created
   *
   * Tasks:
   *  - figure out whether repository is strict
   *  - prune unsupported labels.
   */
  on('label.created', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()
    const label = ctx.payload.label

    ctx.log.info(`New label created in ${repo}: "${label.name}".`)

    const config = await data.config(owner, repo)

    /* istanbul ignore if */
    if (config === null) {
      ctx.log.info(`No configuration, skipping`)
      return
    }

    /* Ignore complying changes. */
    /* istanbul ignore if */
    if (config.labels.has(label.name)) {
      ctx.log.info(`Label is configured, skipping removal.`)
      return
    }

    /* Config */
    if (!config.config?.removeUnconfiguredLabels) return

    ctx.log.info(`Removing "${label.name}" from ${repo}.`)

    /* Prune unsupported labels in strict repositories. */
    await gh.removeLabelsFromRepository(ctx.octokit, {
      repo,
      owner,
      labels: [label],
      persist: true,
    })

    ctx.log.info(`Removed label "${label.name}" from ${repo}.`)
  })

  /**
   * Label assigned to pull_request
   *
   * Tasks:
   *  - check if there are any siblings that we should add
   *  - add siblings
   */
  on('pull_request.labeled', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()
    const label = ctx.payload.label!
    const issue = ctx.payload.pull_request

    ctx.log.info(`PullRequest (${issue.number}) labeled with "${label.name}".`)

    const config = await data.config(owner, repo)

    /* istanbul ignore if */
    if (config === null) {
      ctx.log.info(`No configuration found, skipping.`)
      return
    }

    /* istanbul ignore if */
    if (!config.labels.has(label.name)) {
      ctx.log.info(`Unconfigured label "${label.name}", skipping.`)
      return
    }

    const siblings = config.labels.get(label.name)?.siblings || []

    /* istanbul ignore if */
    if (siblings.length === 0) {
      ctx.log.info(`No siblings to add to "${label.name}", skipping.`)
      return
    }

    await gh.addLabelsToIssue(ctx.octokit, {
      repo,
      owner,
      issue: issue.number,
      labels: siblings.map((sibling) => ({ name: sibling })),
      persist: true,
    })

    /* prettier-ignore */
    ctx.log.info(`Added siblings of ${label.name} to pr ${issue.number}: ${siblings.join(', ')}`)
  })

  /**
   * Label assigned to issue
   *
   * Tasks:
   *  - check if there are any siblings that we should add
   *  - add siblings
   */
  on('issues.labeled', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()
    const label = ctx.payload.label!
    const issue = ctx.payload.issue

    ctx.log.info(`Issue (${issue.number}) labeled with "${label.name}".`)

    const config = await data.config(owner, repo)

    /* istanbul ignore if */
    if (config === null) {
      ctx.log.info(`No configuration found, skipping.`)
      return
    }

    /* istanbul ignore if */
    if (!config.labels.has(label.name)) {
      ctx.log.info(`Unconfigured label "${label.name}", skipping.`)
      return
    }

    const siblings = config.labels.get(label.name)?.siblings || []

    /* istanbul ignore if */
    if (siblings.length === 0) {
      ctx.log.info(`No new siblings for "${label.name}", skipping.`)
      return
    }

    await gh.addLabelsToIssue(ctx.octokit, {
      repo,
      owner,
      issue: issue.number,
      labels: siblings.map((sibling) => ({ name: sibling })),
      persist: true,
    })

    /* prettier-ignore */
    ctx.log.info(`Added siblings of ${label.name} to issue ${issue.number}: ${siblings.join(', ')}`)
  })
}
