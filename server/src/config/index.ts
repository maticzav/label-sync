import { Plan } from '@prisma/client'

import * as parser from './parser'
import { checkConfiguration } from './checks/configuration'
import { checkPlan } from './checks/plan'
import { getLSConfigRepoName } from './constants'

import * as t from './types'

/**
 * This file bundles up all functions related to configuration.
 */

export * from './constants'
export * from './types'

/**
 * Parses the configuration.
 */
export function parse(params: {
  plan: Plan
  input: string
}): [string] | [null, t.LSCConfiguration] {
  const result = parser.parse(params.input, [
    checkPlan(params.plan),
    checkConfiguration,
  ])

  if (result.success) {
    return [null, result.config]
  }
  return [result.error]
}

// MARK: - Utility functions

/**
 * Returns a list of repositories in configuration without wildcard config.
 */
export function configRepos(config: t.LSCConfiguration): string[] {
  let repos: string[] = []

  for (let repo of config.repos.keys()) {
    repo = repo.trim()
    if (repo !== '*') repos.push(repo)
  }
  return repos
}

/**
 * Tells whether the repository is the configuration
 * repository for the account.
 */
export function isConfigRepo(account: string, repo: string): boolean {
  return getLSConfigRepoName(account) === repo.toLowerCase()
}
