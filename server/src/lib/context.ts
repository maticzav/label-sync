import _ from 'lodash'
import { ProbotOctokit } from 'probot'

import { getLSConfigRepoName, LSCConfiguration, LS_CONFIG_PATH, parseConfig } from '@labelsync/config'
import { Installation } from '@labelsync/database'

import { getFile } from './github'
import { Sources } from './sources'
import { DateTime } from 'luxon'
import pino from 'pino'

export type Octokit = InstanceType<typeof ProbotOctokit>

/**
 * Context that all events should include.
 */
interface BaseContext {
  octokit: Octokit
  payload: {
    action?: string | null
    repository: {
      name: string
      default_branch: string
      owner: {
        id: number
        login: string
        type: string
      }
    }
  }
  sources: Sources
}

/**
 * Looks up the installation associated with the account from a given event
 * and checks that the subscription is active.
 */
export async function getAccountInstallation(ctx: BaseContext): Promise<Installation> {
  const account = ctx.payload.repository.owner.login.toLowerCase()

  const installation = await ctx.sources.installations.get({ account })

  /* istanbul ignore if */
  if (installation == null) {
    throw new ExecutionError(`Couldn't find installation for ${account}.`)
  }

  if (DateTime.fromJSDate(installation.periodEndsAt) < DateTime.now()) {
    throw new ExecutionError(`Expired subscription ${installation.account}`)
  }

  return installation
}

/**
 * Returns account configuration related to the provided event.
 */
export async function getAccountConfiguration(ctx: BaseContext): Promise<LSCConfiguration> {
  const installation = await getAccountInstallation(ctx)

  const repo = getLSConfigRepoName(installation.account)
  const ref = `refs/heads/${ctx.payload.repository.default_branch}`

  const rawConfig = await getFile(ctx.octokit, { owner: installation.account, repo, ref }, LS_CONFIG_PATH)

  /* istanbul ignore next */
  if (rawConfig === null) {
    throw new ExecutionError(`No configuration found while loading sources.`)
  }

  const parsedConfig = parseConfig({
    input: rawConfig,
    isPro: installation.plan === 'PAID',
  })

  /* istanbul ignore if */
  if (!parsedConfig.ok) {
    throw new ExecutionError(`Invalid configuration: ${parsedConfig.error}`)
  }

  return parsedConfig.config
}

/**
 * Error that may be safely thrown in the event handler.
 */
export class ExecutionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExecutionError'
  }
}

/**
 * Lets you use a context function in a safe environment.
 */
export async function withContext(ctx: BaseContext & { log: pino.Logger }, fn: () => Promise<void>): Promise<void> {
  try {
    await fn()
  } catch (err) /* istanbul ignore next */ {
    if (process.env.NODE_ENV !== 'production') {
      console.error(err)
      return
    }

    if (err instanceof ExecutionError) {
      ctx.log.debug(
        {
          action: ctx.payload.action,
          repo: ctx.payload.repository.name,
          owner: ctx.payload.repository.owner.login,
        },
        err.message,
      )
      // with context and all
      return
    }

    throw err
  }
}
