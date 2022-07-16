import _ from 'lodash'
import { Probot } from 'probot'

import { LS_CONFIG_PATH, isConfigRepo } from '@labelsync/config'

import { Sources } from '../lib/sources'

/**
 * Events associated with the Github App.
 */
export const github = (app: Probot, sources: Sources) => {
  app.on('installation.created', async (ctx) => {
    const account = ctx.payload.installation.account
    const owner = account.login.toLowerCase()

    /* Find installation. */

    const installation = sources.installations.upsert({
      account: owner,
      cadence: 'YEARLY',
      plan: 'FREE',
      activated: true,
    })

    app.log.info(`Onboarding ${owner}.`, {
      meta: {
        plan: installation.plan,
        periodEndsAt: installation.periodEndsAt,
      },
    })

    await sources.tasks.push({
      kind: 'onboard_org',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
      accountType: ctx.payload.sender.type,
    })
  })

  app.on('push', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name
    const ref = ctx.payload.ref
    const defaultRef = `refs/heads/${ctx.payload.repository.default_branch}`

    if (defaultRef !== ref || !isConfigRepo(owner, repo)) {
      sources.log.info(`Ignoring push because it's not default branch or not a config repository.`)
      return
    }

    if (ctx.payload.installation === undefined) {
      sources.log.info(`Missing installation information.`)
      return
    }

    const installation = await sources.installations.get({ account: owner })
    if (!installation) {
      sources.log.info(`No installation for ${owner}.`)
      return
    }

    await sources.tasks.push({
      kind: 'sync_org',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
    })
  })

  /**
   * Pull Request event
   *
   * Tasks:
   *  - review changes introduced,
   *  - open issues,
   *  - review changes.
   */
  app.on('pull_request', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name
    const number = ctx.payload.pull_request.number

    if (!isConfigRepo(owner, repo)) {
      app.log.info(`Not configuration repository, skipping pull request dry-run.`)
      return
    }

    if (!ctx.payload.installation) {
      app.log.info(`Missing installation information.`)
      return
    }

    const installation = await sources.installations.get({ account: owner })
    if (!installation) {
      app.log.info(`No installation for ${owner}.`)
      return
    }

    // Check changed files.
    const compare = await ctx.octokit.repos.compareCommits({
      owner: owner,
      repo: repo,
      base: ctx.payload.pull_request.base.ref,
      head: ctx.payload.pull_request.head.ref,
    })

    if (compare.data.files?.every((file) => file.filename !== LS_CONFIG_PATH)) {
      app.log.info(compare.data, `Configuration didn't change, skipping comment.`)
      return
    }

    // Start the process of PR review.
    switch (ctx.payload.action) {
      case 'opened':
      case 'reopened':
      case 'ready_for_review':
      case 'review_requested':
      case 'synchronize':
      case 'edited': {
        /* Review pull request. */
        await sources.tasks.push({
          kind: 'dryrun_config',
          dependsOn: [],
          ghInstallationId: ctx.payload.installation.id,
          isPaidPlan: installation.plan === 'PAID',
          org: owner,
          pr_number: number,
        })
        break
      }

      /* istanbul ignore next */
      case 'assigned':
      /* istanbul ignore next */
      case 'closed':
      /* istanbul ignore next */
      case 'labeled':
      /* istanbul ignore next */
      case 'locked':
      /* istanbul ignore next */
      case 'review_request_removed':
      /* istanbul ignore next */
      case 'unassigned':
      /* istanbul ignore next */
      case 'unlabeled':
      /* istanbul ignore next */
      case 'unlocked': {
        /* Ignore other events. */
        app.log.info(`Ignoring event ${ctx.payload.action}.`)
        return
      }
      /* istanbul ignore next */
      default: {
        /* Log unsupported pull_request action. */
        /* prettier-ignore */
        app.log.warn(`Unhandled PullRequest action: ${ctx.payload.action}`)
        return
      }
    }
  })

  app.on('label.created', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()

    const installation = await sources.installations.get({ account: owner })
    if (!installation || !ctx.payload.installation) {
      app.log.info(`No installation for ${owner}.`)
      return
    }

    await sources.tasks.push({
      kind: 'check_unconfigured_labels',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
      repo: repo,
      label: ctx.payload.label.name,
    })
  })

  app.on('issues.labeled', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()

    const installation = await sources.installations.get({ account: owner })
    if (!installation || !ctx.payload.installation) {
      app.log.info(`No installation for ${owner}.`)
      return
    }

    if (!ctx.payload.label) {
      return
    }

    await sources.tasks.push({
      kind: 'add_siblings',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
      repo: repo,
      issue_number: ctx.payload.issue.number,
      label: ctx.payload.label.name,
    })
  })

  app.on('pull_request.labeled', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()

    const installation = await sources.installations.get({ account: owner })
    if (!installation || !ctx.payload.installation) {
      app.log.info(`No installation for ${owner}.`)
      return
    }

    if (!ctx.payload.label) {
      return
    }

    await sources.tasks.push({
      kind: 'add_siblings',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
      repo: repo,
      issue_number: ctx.payload.pull_request.number,
      label: ctx.payload.label.name,
    })
  })

  app.on('repository.created', async (ctx) => {
    const owner = ctx.payload.repository.owner.login.toLowerCase()
    const repo = ctx.payload.repository.name.toLowerCase()

    const installation = await sources.installations.get({ account: owner })
    if (!installation || !ctx.payload.installation) {
      app.log.info(`No installation for ${owner}.`)
      return
    }

    await sources.tasks.push({
      kind: 'sync_repo',
      dependsOn: [],
      ghInstallationId: ctx.payload.installation.id,
      isPaidPlan: installation.plan === 'PAID',
      org: owner,
      repo: repo,
    })
  })
}
