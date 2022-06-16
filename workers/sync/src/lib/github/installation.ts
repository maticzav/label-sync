import { Octokit } from '@octokit/core'
import Sentry from '@sentry/node'
import { DateTime } from 'luxon'
import * as path from 'path'

import { Dict, mapEntriesAsync } from '../../data/dict'
import { select } from '../utils'

type RepositoryIdentifier = { owner: string; repo: string; installation: number }
type BranchIdentifier = RepositoryIdentifier & { ref: string }

type TokenGetter = (installation: number) => Promise<{ token: string; ttl: DateTime }>

/**
 * A class implementing methods that an installation may use to communicate with
 * GitHub API.
 */
export class GitHubEndpoints {
  /**
   * A function that returns a token that may be used to authenticate
   * a given installation until it expires.
   */
  private getInstallationToken: TokenGetter

  /**
   * Cache of clients for different installations.
   */
  private clients: { [installation: number]: { octokit: Octokit; ttl: DateTime } } = {}

  private constructor(tokenizer: TokenGetter) {
    this.getInstallationToken = tokenizer
  }

  /**
   * Utility functions that returns an Octokit instance that may be used
   * to communicate with GitHub API.
   */
  private authenticate(installation: number): Octokit {
    if (installation in this.clients && DateTime.now() < this.clients[installation].ttl) {
      return this.clients[installation].octokit
    }

    const { token, ttl } = this.getInstallationToken(installation)

    const octokit = new Octokit({
      auth: token,
      userAgent: 'labelsyncauth/2.0.0',
    })

    this.clients[installation] = { ttl, octokit }
    return octokit
  }

  // MARK: - Methods

  public async getRepo({ repo, owner, installation }: RepositoryIdentifier): Promise<GitHubRepository | null> {
    try {
      const res = await this.authenticate(installation).request('GET /repos/{owner}/{repo}', {
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
  public async getFile({ installation, owner, repo, ref }: BranchIdentifier, path: string): Promise<string | null> {
    try {
      const res = await this.authenticate(installation).request('GET /repos/{owner}/{repo}/contents/{path}', {
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
   * Returns all labels that are present in the given repository.
   */
  public async getLabels({ repo, owner, installation }: RepositoryIdentifier, _page = 1): Promise<GithubLabel[]> {
    const res = await this.authenticate(installation).request('GET /repos/{owner}/{repo}/labels', {
      owner,
      repo,
      per_page: 100,
      page: _page,
    })

    // Recursively fetch subpages if there my be more labels.
    let subpages: GithubLabel[] = []

    /* istanbul ignore next */
    if (res.data.length === 100) {
      subpages = await this.getLabels({ repo, owner, installation }, _page + 1)
    }

    return [...res.data, ...subpages]
  }

  /**
   * Creates a new label in a given repository.
   */
  public async createLabel(
    { repo, owner, installation }: RepositoryIdentifier,
    label: Pick<GithubLabel, 'name' | 'color' | 'description'>,
  ): Promise<GithubLabel | null> {
    try {
      const res = await this.authenticate(installation).request('POST /repos/{owner}/{repo}/labels', {
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
  public async updateLabel(
    { repo, owner, installation }: RepositoryIdentifier,
    label: GithubLabel,
  ): Promise<GithubLabel | null> {
    try {
      const res = await this.authenticate(installation).request('PATCH /repos/{owner}/{repo}/labels/{name}', {
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
  public async removeLabel(
    { repo, owner, installation }: RepositoryIdentifier,
    label: Pick<GithubLabel, 'name'>,
  ): Promise<void> {
    try {
      await this.authenticate(installation).request('DELETE /repos/{owner}/{repo}/labels/{name}', {
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
    { repo, owner, installation }: RepositoryIdentifier,
    params: {
      issue: number
      labels: Pick<GithubLabel, 'name'>[]
    },
  ): Promise<GithubLabel[]> {
    const res = await this.authenticate(installation).request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/labels',
      {
        repo,
        owner,
        issue_number: params.issue,
        labels: params.labels,
      },
    )
    return res.data
  }

  /**
   * Aliases labels in a repository by going through issues and
   * adding a label with the new name to each issue that has a label with
   * the old name of the aliased label.
   */
  public async aliasLabels({ repo, owner, installation }: RepositoryIdentifier, labels: GithubLabel[]) {
    const issues = await this.getRepositoryIssues({ repo, owner, installation })

    for (const issue of issues) {
      // Filter labels that should be in this issue but are not.
      const missingLabels = labels.filter((label) => {
        // issue.labels.some((issueLabel) => issueLabel.name === label.old_name)
        return false
      })

      if (missingLabels.length === 0) continue

      /* Add all the missing labels. */
      await this.addLabelsToIssue({ repo, owner, installation }, { labels: missingLabels, issue: issue.id })
    }
  }

  /**
   * Gets all issues in a given repository.
   */
  public async getRepositoryIssues(
    { repo, owner, installation }: RepositoryIdentifier,
    _page = 1,
  ): Promise<GitHubIssue[]> {
    const issues: GitHubIssue[] = await this.authenticate(installation)
      .request('GET /repos/{owner}/{repo}/issues', {
        owner: owner,
        repo: repo,
        per_page: 100,
        page: _page,
      })
      .then((res) => res.data)
      .then((issues) => issues.map((issue) => select(issue, ['id', 'labels'])))

    // Recursively fetch subpages if there may be more issues.
    let subpages: GitHubIssue[] = []

    /* istanbul ignore next */
    if (issues.length === 100) {
      subpages = await this.getRepositoryIssues({ repo, owner, installation }, _page + 1)
    }

    return [...issues, ...subpages]
  }

  /**
   * Tells whether two labels are equal.
   */
  public static equals(a: GithubLabel, b: GithubLabel) {
    return a.name === b.name && a.color === b.color && a.description === b.description
  }

  /**
   * Determines whether the two configurations configure the same label.
   */
  public static definition(local: GithubLabel, remote: GithubLabel): boolean {
    return local.name === remote.name
  }

  /**
   * Opens a new GitHub issue with given title and body.
   */
  public async openIssue(
    { repo, owner, installation }: RepositoryIdentifier,
    params: {
      title: string
      body: string
    },
  ): Promise<GitHubIssue> {
    const res = await this.authenticate(installation).request('POST /repos/{owner}/{repo}/issues', {
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
    { repo, owner, installation }: RepositoryIdentifier,
    params: { comment: string; issue: number },
  ): Promise<void> {
    const res = await this.authenticate(installation).request(
      'POST /repos/{owner}/{repo}/issues/{issue_number}/comments',
      {
        owner,
        repo,
        issue_number: params.issue,
        body: params.comment,
      },
    )
  }

  /**
   * Recursively creates a tree commit by creating blobs and generating
   * trees on folders.
   */
  public async createFileTree(repo: RepositoryIdentifier, tree: GitHubTree): Promise<{ sha: string }> {
    const blobs = await mapEntriesAsync(getTreeFiles(tree), (content) => this.createBlob(repo, content))
    const trees = await mapEntriesAsync(getTreeSubTrees(tree), (subTree) => this.createFileTree(repo, subTree))

    const res = await this.authenticate(repo.installation).request('POST /repos/{owner}/{repo}/git/trees', {
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
  public async createBlob({ owner, repo, installation }: RepositoryIdentifier, content: string) {
    const res = await this.authenticate(installation).request('POST /repos/{owner}/{repo}/git/blobs', {
      owner,
      repo,
      content,
    })
    return res.data
  }

  /**
   * Creates a new repository in a given organisation.
   */
  public async createRepository({ owner, repo, installation }: RepositoryIdentifier, params: { description: string }) {
    const res = await this.authenticate(installation).request('POST /orgs/{org}/repos', {
      org: owner,
      name: repo,
      description: params.description,
      auto_init: true,
    })

    return res.data
  }

  /**
   * Creates a new commit on a given repository.
   */
  public async createCommit(
    { repo, owner, installation }: RepositoryIdentifier,
    params: { sha: string; message: string; parent: string },
  ) {
    const res = await this.authenticate(installation).request('POST /repos/{owner}/{repo}/git/commits', {
      owner,
      repo,
      message: params.message,
      tree: params.sha,
      parents: [params.parent],
    })

    return res.data
  }

  /**
   * Fetches a repository reference for a given repository.
   */
  public async getRef({ repo, owner, installation }: RepositoryIdentifier, ref: string) {
    const res = await this.authenticate(installation).request('GET /repos/{owner}/{repo}/git/refs/{ref}', {
      owner,
      repo,
      ref,
    })

    return res.data
  }

  /**
   * Updates a reference to a given SHA on a given repository.
   */
  public async updateRef({ repo, owner, installation }: RepositoryIdentifier, params: { ref: string; sha: string }) {
    const res = await this.authenticate(installation).request('PATCH /repos/{owner}/{repo}/git/refs/{ref}', {
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
  public async bootstrapConfigRepository(repo: RepositoryIdentifier, tree: GitHubTree) {
    await this.createRepository(repo, {
      description: 'LabelSync configuration repository.',
    })

    const ghtree = await this.createFileTree(repo, tree)
    const master = await this.getRef(repo, 'heads/master')

    const commit = await this.createCommit(repo, {
      sha: ghtree.sha,
      message: ':sparkles: Scaffold configuration',
      parent: master.object.sha,
    })

    const ref = await this.updateRef(repo, { ref: 'heads/master', sha: commit.sha })

    return ref
  }

  /**
   * Tells whether this installation can access all required repositories.
   */
  public async checkInstallationAccess({
    installation,
    owner,
    repos,
  }: {
    installation: number
    owner: string
    repos: string[]
  }): Promise<{ status: 'Sufficient' } | { status: 'Insufficient'; missing: string[]; accessible: string[] }> {
    /* istanbul ignore if */
    if (repos.length === 0) return { status: 'Sufficient' }

    const available: string[] = await this.getInstallationRepos({ owner, installation })
      .then((repos) => repos.map((repo) => repo.name))
      .catch(() => [])

    const missing = repos.filter((repo) => !available.includes(repo))

    if (missing.length === 0) {
      return { status: 'Sufficient' }
    }
    return { status: 'Insufficient', missing: missing, accessible: available }
  }

  /**
   * Returns a list of repositories that this installation may access.
   */
  public async getInstallationRepos(
    { installation, owner }: { installation: number; owner: string },
    _page = 1,
  ): Promise<GitHubRepository[]> {
    const res = await this.authenticate(installation).request('GET /installation/repositories', {
      per_page: 50,
      page: _page,
    })

    let subpages: GitHubRepository[] = []
    if (res.data.repositories.length === 50) {
      subpages = await this.getInstallationRepos({ installation, owner }, _page + 1)
    }

    return [...res.data.repositories, ...subpages]
  }
}

export interface GitHubIssue {
  id: number
  labels: (
    | string
    | {
        id?: number
        name?: string
        description?: string | null
      }
  )[]
}

export interface GithubLabel {
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
}

/**
 * Represents a Github file and folder structure where
 * files are represented as UTF-8 encoded strings keyed by the their relative
 * path to the repository root.
 */
export type GitHubTree = { [path: string]: string }

/**
 * Returns the files that are not nested.
 */
function getTreeFiles(tree: GitHubTree): Dict<string> {
  return Object.fromEntries(
    Object.keys(tree)
      .filter(isFileInThisFolder)
      .map((name) => [name, tree[name]]),
  )
}

/**
 * Returns a dictionary of remaining subtrees.
 */
function getTreeSubTrees(tree: GitHubTree): Dict<GitHubTree> {
  return Object.keys(tree)
    .filter((file) => !isFileInThisFolder(file))
    .reduce<Dict<GitHubTree>>((acc, filepath) => {
      const [subTree, newFilepath] = shiftPath(filepath)
      if (!acc.hasOwnProperty(subTree)) {
        acc[subTree] = {}
      }
      acc[subTree][newFilepath] = tree[filepath]
      return acc
    }, {})
}

/**
 * Shifts path by one.
 * Returns the shifted part as first argument and remaining part as second.
 */
function shiftPath(filepath: string): [string, string] {
  const [dir, ...dirs] = filepath.split('/').filter(Boolean)
  return [dir, dirs.join('/')]
}

/**
 * Determines whether a path references a direct file
 * or a file in the nested folder.
 *
 * "/src/index.ts" -> false
 * "/index.ts" -> true
 * "index.ts" -> true
 */
function isFileInThisFolder(filePath: string): boolean {
  return ['.', '/'].includes(path.dirname(filePath))
}
