/**
 * This file contains utility functions that we use to communicate
 * with GitHub about repositories.
 */

import { ProbotOctokit } from 'probot'
import { Maybe } from '../data/maybe'

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Methods

export type InstallationAccess =
  | { status: 'Sufficient' }
  | { status: 'Insufficient'; missing: string[]; accessible: string[] }

// MARK: - Methods

type CheckInstallationAccessParams = {
  /**
   * List of the repository names that a configuration requires.
   */
  repos: string[]
}

/**
 * Determines whether LabelSync can access all requested repositories.
 */
export async function checkInstallationAccess(
  github: Octokit,
  params: CheckInstallationAccessParams,
): Promise<InstallationAccess> {
  /* istanbul ignore if */
  if (params.repos.length === 0) return { status: 'Sufficient' }

  /* Paginate through repos. */
  let accessRepos: string[] = []
  let page = 1

  await handler()

  const missing = params.repos.filter((repo) => !accessRepos.includes(repo))

  if (missing.length === 0) return { status: 'Sufficient' }

  return {
    status: 'Insufficient',
    missing: missing,
    accessible: accessRepos,
  }

  // Recursive utility

  async function handler() {
    const res = await github.apps
      .listReposAccessibleToInstallation({ per_page: 100, page })
      .then((res) => res.data)

    /* Push to collection */
    accessRepos.push(...res.repositories.map((repo) => repo.name.toLowerCase()))

    /* istanbul ignore if */
    if (res.repositories.length === 100) {
      page += 1
      await handler()
    }
  }
}

type GetRepoParams = {
  owner: string
  repo: string
}

/**
 * Tries to fetch a GitHub repository.
 */
export async function getRepo(github: Octokit, params: GetRepoParams) {
  return github.repos
    .get({ owner: params.owner, repo: params.repo })
    .then((res) => {
      switch (res.status) {
        case 200: {
          return { status: 'Exists' as const, repo: res.data }
        }
        /* istanbul ignore next */
        default: {
          return { status: 'Unknown' as const }
        }
      }
    })
    .catch(() => {
      return { status: 'Unknown' as const }
    })
}

type GetLatestRepositoryCommitSHAParams = {
  repo: string
  owner: string
  /**
   * Path that the commit should include in changes.
   */
  path?: string
  /**
   * SHA or branch to start listing commits from.
   */
  sha?: string
}

/**
 * Returns the latest commit of a given repository.
 */
export async function getLatestRepositoryCommitSHA(
  github: Octokit,
  params: GetLatestRepositoryCommitSHAParams,
) {
  const commits = await github.repos.listCommits({
    owner: params.owner,
    repo: params.repo,
    path: params.path,
    per_page: 1,
    sha: params.sha,
  })

  if (commits.data.length === 0) return null
  return commits.data[0].sha!
}
