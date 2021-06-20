/**
 * This file contains utility functions that we use to communicate
 * with GitHub about issues and related content.
 */

import { ProbotOctokit } from 'probot'

import { withDefault } from '../utils'

type Octokit = InstanceType<typeof ProbotOctokit>

type GetPRChangesParams = {
  owner: string
  repo: string
  base: string
  head: string
}

/**
 * Returns the list of changed files in a pull request.
 */
export async function getPullRequestChanges(
  github: Octokit,
  params: GetPRChangesParams,
) {
  const changes = await github.repos.compareCommits({
    owner: params.owner,
    repo: params.repo,
    base: params.base,
    head: params.head,
  })

  return changes.data.files || []
}
