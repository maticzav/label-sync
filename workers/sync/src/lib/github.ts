import { getLSConfigRepoName, LS_CONFIG_PATH } from '@labelsync/config'
import { Octokit } from '@octokit/core'
import '@octokit/types'
import Sentry from '@sentry/node'
import { DateTime } from 'luxon'

import * as dict from '../data/dict'
import { FileTree } from './filetree'
import { select } from './utils'

// Interface

type RepositoryIdentifier = { owner: string; repo: string }
type BranchIdentifier = RepositoryIdentifier & { ref: string }

export interface GitHubIssue {
  id: number
  number: number
  labels: (
    | string
    | {
        id?: number
        name?: string
        description?: string | null
      }
  )[]
}

export interface GitHubCheckRun {
  /** The id of the check. */
  id: number
  /** The SHA of the commit that is being checked. */
  head_sha: string
  /** The phase of the lifecycle that the check is currently in. */
  status: 'queued' | 'in_progress' | 'completed'
  conclusion: ('success' | 'failure' | 'neutral' | 'cancelled' | 'skipped' | 'timed_out' | 'action_required') | null
  output: {
    title: string | null
    summary: string | null
    text: string | null
  }
  /** The name of the check. */
  name: string
  check_suite: { id: number } | null
}

export interface GitHubPullRequest {
  id: number
  /** Number uniquely identifying the pull request within its repository. */
  number: number
  /** State of this Pull Request. Either `open` or `closed`. */
  state: 'open' | 'closed'
  locked: boolean
  /** The title of the pull request. */
  title: string
  body: string | null
  labels: {
    id?: number
    node_id?: string
    url?: string
    name?: string
    description?: string | null
    color?: string
    default?: boolean
  }[]
  merge_commit_sha: string | null
  head: {
    label: string
    ref: string
    sha: string
  }
  base: {
    label: string
    ref: string
    sha: string
  }
  /** Indicates whether or not the pull request is a draft. */
  draft?: boolean
  merged: boolean
  mergeable: boolean | null
}

export interface GitHubLabel {
  old_name?: string
  name: string

  old_description?: string
  description?: string | null

  old_color?: string
  color: string
  default?: boolean
}

export interface GitHubRepository {
  id: number
  name: string
  default_branch: string
}

export interface GitHubBlob {
  sha: string
}

export interface GitHubRef {
  ref: string
  object: {
    type: string
    sha: string
    url: string
  }
}

export interface GitHubCommit {
  sha: string
  author: {
    date: string
    email: string
    name: string
  }
  message: string
  tree: {
    sha: string
    url: string
  }
}

export interface GitHubMergeCommit {
  sha: string
}

/**
 * Spec interface of the available GitHub methods.
 *
 * NOTE: We use a separate interface to make it possible to use mock endpoints
 * object that behaves like a real GitHub API.
 */
export interface IGitHubEndpoints {
  /**
   * Returns a repository with a given name if it exists.
   */
  getRepo(id: RepositoryIdentifier): Promise<GitHubRepository | null>

  /**
   * Loads a file from GitHub if it exists.
   */
  getFile(id: BranchIdentifier, path: string): Promise<string | null>

  /**
   * Returns the string value of the configuration file for a given owner
   * if it exists.
   */
  getConfig(id: { owner: string }): Promise<string | null>

  /**
   * Returns all labels that are present in the given repository.
   */
  getLabels({ repo, owner }: RepositoryIdentifier, page?: number): Promise<GitHubLabel[] | null>

  /**
   * Creates a new label in a given repository.
   */
  createLabel(
    id: RepositoryIdentifier,
    label: Pick<GitHubLabel, 'name' | 'color' | 'description'>,
  ): Promise<GitHubLabel | null>

  /**
   * Updates a given label configuration in repositroy if possible.
   */
  updateLabel(id: RepositoryIdentifier, label: GitHubLabel): Promise<GitHubLabel | null>

  /**
   * Removes the label with a given name from a given repository.
   */
  removeLabel(id: RepositoryIdentifier, label: Pick<GitHubLabel, 'name'>): Promise<void>

  /**
   * Adds labels to an issue.
   */
  addLabelsToIssue(
    id: RepositoryIdentifier,
    params: {
      issue_number: number
      labels: Pick<GitHubLabel, 'name'>[]
    },
  ): Promise<GitHubLabel[] | null>

  /**
   * Aliases labels in a repository by going through issues and
   * adding a label with the new name to each issue that has a label with
   * the old name of the aliased label.
   */
  aliasLabels(id: RepositoryIdentifier, labels: GitHubLabel[]): Promise<void>

  /**
   * Gets all issues in a given repository.
   */
  getRepositoryIssues({ repo, owner }: RepositoryIdentifier, page?: number): Promise<GitHubIssue[] | null>

  /**
   * Opens a new GitHub issue with given title and body.
   */
  openIssue(id: RepositoryIdentifier, params: { title: string; body: string }): Promise<GitHubIssue | null>

  /**
   * Creates a new comment on an issue or a pull request.
   */
  comment(id: RepositoryIdentifier, params: { comment: string; issue: number }): Promise<void>

  /**
   * Recursively creates a tree commit by creating blobs and generating
   * trees on folders.
   */
  createFileTree(repo: RepositoryIdentifier, tree: FileTree.Type): Promise<{ sha: string } | null>

  /**
   * Creates a Github Blob from a File.
   */
  createBlob({ owner, repo }: RepositoryIdentifier, content: string): Promise<GitHubBlob | null>

  /**
   * Creates a new repository in a given organisation.
   */
  createRepository(
    { owner, repo }: RepositoryIdentifier,
    params: { description: string },
  ): Promise<GitHubRepository | null>

  /**
   * Creates a new commit on a given repository.
   */
  createCommit(
    id: RepositoryIdentifier,
    params: { sha: string; message: string; parent: string },
  ): Promise<GitHubCommit | null>

  /**
   * Fetches a repository reference for a given repository.
   */
  getRef({ repo, owner }: RepositoryIdentifier, ref: string): Promise<GitHubRef | null>

  /**
   * Updates a reference to a given SHA on a given repository.
   */
  updateRef({ repo, owner }: RepositoryIdentifier, params: { ref: string; sha: string }): Promise<GitHubRef | null>

  /**
   * Bootstraps a configuration repository to a prescribed destination.
   * NOTE: This function assumes repository is empty.
   */
  bootstrapConfigRepository(repo: RepositoryIdentifier, tree: FileTree.Type): Promise<GitHubRef | null>

  /**
   * Tells whether this installation can access all required repositories
   * and which repositories it can access.
   */
  checkInstallationAccess(id: { owner: string; repos: string[] }): Promise<
    | {
        status: 'Sufficient'
        accessible: string[]
      }
    | {
        status: 'Insufficient'
        missing: string[]
        accessible: string[]
      }
    | null
  >

  /**
   * Returns a list of repositories that this installation may access.
   */
  getInstallationRepos(id: { owner: string }, page?: number): Promise<GitHubRepository[] | null>

  /**
   * Fetches a pull request from the repository if it exists.
   */
  getPullRequest(id: RepositoryIdentifier, params: { number: number }): Promise<GitHubPullRequest | null>

  /**
   * Creates a new check run on a given pull request if that pull request
   * exists.
   */
  createPRCheckRun(
    id: RepositoryIdentifier,
    params: { pr_number: number; name: string },
  ): Promise<GitHubCheckRun | null>

  /**
   * Completes a check run with a given status and optional output.
   */
  completePRCheckRun(
    id: RepositoryIdentifier,
    params: {
      check_run: number
      conclusion:
        | 'action_required'
        | 'cancelled'
        | 'failure'
        | 'neutral'
        | 'success'
        | 'skipped'
        | 'stale'
        | 'timed_out'
      output?: {
        title: string
        summary: string
        text?: string
      }
    },
  ): Promise<GitHubCheckRun | null>

  /**
   * Merges a given PR if it exists.
   */
  mergePR(id: RepositoryIdentifier, params: { pr_number: number }): Promise<GitHubMergeCommit | null>
}

// Implementation

/**
 * A class implementing methods that an installation may use to communicate with
 * GitHub API.
 */
export class GitHubEndpoints implements IGitHubEndpoints {
  private octokit: Octokit

  constructor(octokit: Octokit) {
    this.octokit = octokit
  }

  // MARK: - Methods

  /**
   * Returns a repository with a given name if it exists.
   */
  public async getRepo({ repo, owner }: RepositoryIdentifier): Promise<GitHubRepository | null> {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}', {
        owner: owner,
        repo: repo,
      })
      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo },
      })
      return null
    }
  }

  /**
   * Loads a file from GitHub if it exists.
   */
  public async getFile({ owner, repo, ref }: BranchIdentifier, path: string): Promise<string | null> {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/contents/{path}', {
        owner: owner,
        path: path,
        repo: repo,
        ref: ref,
      })

      if ('content' in res.data) {
        return Buffer.from(res.data.content, 'base64').toString()
      }

      return null
    } catch (err) /* istanbul ignore next */ {
      Sentry.captureException(err, {
        extra: { owner, repo, path, ref },
      })
      return null
    }
  }

  /**
   * Returns the string value of the configuration file for a given owner
   * if it exists.
   */
  public async getConfig({ owner }: { owner: string }): Promise<string | null> {
    try {
      const configRepoName = getLSConfigRepoName(owner)
      const repo = await this.getRepo({ owner, repo: configRepoName })
      if (repo == null) {
        return null
      }

      return this.getFile(
        {
          owner,
          repo: configRepoName,
          ref: `refs/heads/${repo.default_branch}`,
        },
        LS_CONFIG_PATH,
      )
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner },
      })
      return null
    }
  }

  /**
   * Returns all labels that are present in the given repository.
   */
  public async getLabels({ repo, owner }: RepositoryIdentifier, _page = 1): Promise<GitHubLabel[]> {
    const res = await this.octokit.request('GET /repos/{owner}/{repo}/labels', {
      owner,
      repo,
      per_page: 100,
      page: _page,
    })

    // Recursively fetch subpages if there my be more labels.
    let subpages: GitHubLabel[] = []

    /* istanbul ignore next */
    if (res.data.length === 100) {
      subpages = await this.getLabels({ repo, owner }, _page + 1)
    }

    return [...res.data, ...subpages]
  }

  /**
   * Creates a new label in a given repository.
   */
  public async createLabel(
    { repo, owner }: RepositoryIdentifier,
    label: Pick<GitHubLabel, 'name' | 'color' | 'description'>,
  ): Promise<GitHubLabel | null> {
    try {
      const res = await this.octokit.request('POST /repos/{owner}/{repo}/labels', {
        owner: owner,
        repo: repo,
        name: label.name,
        description: label.description ?? undefined,
        color: label.color,
      })
      return res.data
    } catch (err: any) /* istanbul ignore next */ {
      Sentry.captureException(err, { extra: { repo, owner } })
      return null
    }
  }

  /**
   * Updates a given label configuration in repositroy if possible.
   */
  public async updateLabel({ repo, owner }: RepositoryIdentifier, label: GitHubLabel): Promise<GitHubLabel | null> {
    try {
      const res = await this.octokit.request('PATCH /repos/{owner}/{repo}/labels/{name}', {
        owner: owner,
        repo: repo,
        name: label.old_name ?? label.name,
        new_name: label.name,
        description: label.description ?? undefined,
        color: label.color,
      })
      return res.data
    } catch (err: any) /* istanbul ignore next */ {
      Sentry.captureException(err, { extra: { repo, owner } })
      return null
    }
  }

  /**
   * Removes the label with a given name from a given repository.
   */
  public async removeLabel({ repo, owner }: RepositoryIdentifier, label: Pick<GitHubLabel, 'name'>): Promise<void> {
    try {
      await this.octokit.request('DELETE /repos/{owner}/{repo}/labels/{name}', {
        owner: owner,
        repo: repo,
        name: label.name,
      })
    } catch (err: any) /* istanbul ignore next */ {
      Sentry.captureException(err, { extra: { repo, owner } })
    }
  }

  /**
   * Adds labels to an issue.
   */
  public async addLabelsToIssue(
    { repo, owner }: RepositoryIdentifier,
    params: {
      issue_number: number
      labels: Pick<GitHubLabel, 'name'>[]
    },
  ): Promise<GitHubLabel[]> {
    const res = await this.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/labels', {
      repo,
      owner,
      issue_number: params.issue_number,
      labels: params.labels,
    })
    return res.data
  }

  /**
   * Aliases labels in a repository by going through issues and
   * adding a label with the new name to each issue that has a label with
   * the old name of the aliased label.
   */
  public async aliasLabels({ repo, owner }: RepositoryIdentifier, labels: GitHubLabel[]): Promise<void> {
    const issues = await this.getRepositoryIssues({ repo, owner })

    for (const issue of issues) {
      // Filter labels that should be in this issue but are not.
      const missingLabels = labels.filter((label) => {
        // issue.labels.some((issueLabel) => issueLabel.name === label.old_name)
        return false
      })

      if (missingLabels.length === 0) continue

      /* Add all the missing labels. */
      await this.addLabelsToIssue({ repo, owner }, { labels: missingLabels, issue_number: issue.number })
    }
  }

  /**
   * Gets all issues in a given repository.
   */
  public async getRepositoryIssues({ repo, owner }: RepositoryIdentifier, _page = 1): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = await this.octokit
      .request('GET /repos/{owner}/{repo}/issues', {
        owner: owner,
        repo: repo,
        per_page: 100,
        page: _page,
      })
      .then((res) => res.data)
      .then((issues) => issues.map((issue) => select(issue, ['id', 'labels', 'number'])))

    // Recursively fetch subpages if there may be more issues.
    let subpages: GitHubIssue[] = []

    /* istanbul ignore next */
    if (issues.length === 100) {
      subpages = await this.getRepositoryIssues({ repo, owner }, _page + 1)
    }

    return [...issues, ...subpages]
  }

  /**
   * Tells whether two labels are equal.
   */
  public static equals(a: GitHubLabel, b: GitHubLabel) {
    return a.name === b.name && a.color === b.color && a.description === b.description
  }

  /**
   * Determines whether the two configurations configure the same label.
   */
  public static definition(local: GitHubLabel, remote: GitHubLabel): boolean {
    return local.name === remote.name
  }

  /**
   * Opens a new GitHub issue with given title and body.
   */
  public async openIssue(
    { repo, owner }: RepositoryIdentifier,
    params: {
      title: string
      body: string
    },
  ): Promise<GitHubIssue> {
    const res = await this.octokit.request('POST /repos/{owner}/{repo}/issues', {
      owner,
      repo,
      title: params.title,
      body: params.body,
    })

    return res.data
  }

  /**
   * Creates a new comment on an issue or a pull request.
   */
  public async comment(
    { repo, owner }: RepositoryIdentifier,
    params: { comment: string; issue: number },
  ): Promise<void> {
    const res = await this.octokit.request('POST /repos/{owner}/{repo}/issues/{issue_number}/comments', {
      owner,
      repo,
      issue_number: params.issue,
      body: params.comment,
    })

    res.data
  }

  /**
   * Recursively creates a tree commit by creating blobs and generating
   * trees on folders.
   */
  public async createFileTree(repo: RepositoryIdentifier, tree: FileTree.Type): Promise<{ sha: string }> {
    const blobs = await dict.mapEntriesAsync(FileTree.getRootFiles(tree), (content) => {
      return this.createBlob(repo, content)
    })
    const trees = await dict.mapEntriesAsync(FileTree.getSubtrees(tree), (subTree) => {
      return this.createFileTree(repo, subTree)
    })

    const res = await this.octokit.request('POST /repos/{owner}/{repo}/git/trees', {
      owner: repo.owner,
      repo: repo.repo,
      tree: [
        ...Object.entries(trees).map(([treePath, { sha }]) => ({
          mode: '040000' as const,
          type: 'tree' as const,
          path: treePath,
          sha,
        })),
        ...Object.entries(blobs).map(([filePath, { sha }]) => ({
          mode: '100644' as const,
          type: 'blob' as const,
          path: filePath,
          sha,
        })),
      ],
    })

    return res.data
  }

  /**
   * Creates a Github Blob from a File.
   */
  public async createBlob({ owner, repo }: RepositoryIdentifier, content: string) {
    const res = await this.octokit.request('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
      content,
    })
    return res.data
  }

  /**
   * Creates a new repository in a given organisation.
   */
  public async createRepository(
    { owner, repo }: RepositoryIdentifier,
    params: { description: string },
  ): Promise<GitHubRepository | null> {
    try {
      const res = await this.octokit.request('POST /orgs/{org}/repos', {
        org: owner,
        name: repo,
        description: params.description,
        auto_init: true,
      })

      return {
        id: res.data.id,
        name: res.data.name,
        default_branch: res.data.default_branch,
      }
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo },
      })
      return null
    }
  }

  /**
   * Creates a new commit on a given repository.
   */
  public async createCommit(
    { repo, owner }: RepositoryIdentifier,
    params: { sha: string; message: string; parent: string },
  ): Promise<GitHubCommit | null> {
    try {
      const res = await this.octokit.request('POST /repos/{owner}/{repo}/git/commits', {
        owner,
        repo,
        message: params.message,
        tree: params.sha,
        parents: [params.parent],
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo },
      })
      return null
    }
  }

  /**
   * Fetches a repository reference for a given repository.
   */
  public async getRef({ repo, owner }: RepositoryIdentifier, ref: string): Promise<GitHubRef | null> {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/git/refs/{ref}', {
        owner,
        repo,
        ref,
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo },
      })
      return null
    }
  }

  /**
   * Updates a reference to a given SHA on a given repository.
   */
  public async updateRef(
    { repo, owner }: RepositoryIdentifier,
    params: { ref: string; sha: string },
  ): Promise<GitHubRef> {
    const res = await this.octokit.request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      ref: params.ref,
      sha: params.sha,
    })

    return res.data
  }

  /**
   * Bootstraps a configuration repository to a prescribed destination.
   * NOTE: This function assumes repository is empty.
   */
  public async bootstrapConfigRepository(id: RepositoryIdentifier, tree: FileTree.Type): Promise<GitHubRef | null> {
    const repo = await this.createRepository(id, {
      description: 'LabelSync configuration repository.',
    })
    if (repo == null) {
      return null
    }

    const ghtree = await this.createFileTree(id, tree)
    const master = await this.getRef(id, 'heads/master')
    if (master == null) {
      return null
    }

    const commit = await this.createCommit(id, {
      sha: ghtree.sha,
      message: ':sparkles: Scaffold configuration',
      parent: master.object.sha,
    })
    if (commit == null) {
      return null
    }

    const ref = await this.updateRef(id, { ref: 'heads/master', sha: commit.sha })
    return ref
  }

  /**
   * Tells whether this installation can access all required repositories
   * and which repositories it can access.
   */
  public async checkInstallationAccess({
    owner,
    repos,
  }: {
    owner: string
    repos: string[]
  }): Promise<
    | { status: 'Sufficient'; accessible: string[] }
    | { status: 'Insufficient'; missing: string[]; accessible: string[] }
    | null
  > {
    const available = await this.getInstallationRepos({ owner })
    if (available == null) {
      return null
    }

    const reponames = available.map((r) => r.name)
    const missing = repos.filter((repo) => !reponames.includes(repo))

    if (missing.length === 0) {
      return { status: 'Sufficient', accessible: reponames }
    }
    return { status: 'Insufficient', missing: missing, accessible: reponames }
  }

  /**
   * Returns a list of repositories that this installation may access.
   */
  public async getInstallationRepos({ owner }: { owner: string }, _page = 1): Promise<GitHubRepository[] | null> {
    try {
      const res = await this.octokit.request('GET /installation/repositories', {
        per_page: 50,
        page: _page,
      })

      let subpages: GitHubRepository[] = []
      if (res.data.repositories.length === 50) {
        const subres = await this.getInstallationRepos({ owner }, _page + 1)
        if (subres == null) {
          return null
        }
        subpages = subres
      }

      return [...res.data.repositories, ...subpages]
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, _page },
      })
      return null
    }
  }

  /**
   * Fetches a pull request from the repository if it exists.
   */
  public async getPullRequest({ owner, repo, number }: { owner: string; repo: string; number: number }) {
    try {
      const res = await this.octokit.request('GET /repos/{owner}/{repo}/pulls/{pull_number}', {
        owner,
        repo,
        pull_number: number,
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo, number },
      })
      return null
    }
  }

  /**
   * Creates a new check run on a given pull request if that pull request
   * exists.
   */
  public async createPRCheckRun(
    { repo, owner }: RepositoryIdentifier,
    { pr_number, name }: { pr_number: number; name: string },
  ) {
    const pr = await this.getPullRequest({ owner, repo, number: pr_number })

    if (!pr) {
      return null
    }

    try {
      const res = await this.octokit.request('POST /repos/{owner}/{repo}/check-runs', {
        name: name,
        owner,
        repo,
        head_sha: pr.head.sha,
        status: 'in_progress',
        started_at: DateTime.now().toISO(),
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo, pr_number },
      })
      return null
    }
  }

  /**
   * Completes a check run with a given status and optional output.
   */
  public async completePRCheckRun(
    { repo, owner }: RepositoryIdentifier,
    {
      check_run,
      conclusion,
      output,
    }: {
      check_run: number
      conclusion:
        | 'action_required'
        | 'cancelled'
        | 'failure'
        | 'neutral'
        | 'success'
        | 'skipped'
        | 'stale'
        | 'timed_out'
      output?: {
        title: string
        summary: string
        text?: string
      }
    },
  ) {
    try {
      const res = await this.octokit.request('PATCH /repos/{owner}/{repo}/check-runs/{check_run_id}', {
        owner,
        repo,
        check_run_id: check_run,
        completed_at: DateTime.now().toISO(),
        conclusion,
        output,
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { owner, repo, check_run },
      })
      return null
    }
  }

  /**
   * Merges a given PR if it exists.
   */
  public async mergePR(
    { repo, owner }: RepositoryIdentifier,
    { pr_number }: { pr_number: number },
  ): Promise<GitHubMergeCommit | null> {
    const pr = await this.getPullRequest({ owner, repo, number: pr_number })

    if (!pr) {
      return null
    }

    try {
      const res = await this.octokit.request('PUT /repos/{owner}/{repo}/pulls/{pull_number}/merge', {
        owner,
        repo,
        pull_number: pr_number,
        merge_method: 'squash',
      })

      return res.data
    } catch (err) {
      Sentry.captureException(err, {
        extra: { repo, owner, pr_number },
      })
      return null
    }
  }
}
