import { FileTree } from 'workers/sync/src/lib/filetree'
import {
  GitHubBlob,
  GitHubCheckRun,
  GitHubCommit,
  GitHubIssue,
  GitHubLabel,
  GitHubMergeCommit,
  GitHubPullRequest,
  GitHubRef,
  GitHubRepository,
  IGitHubEndpoints,
} from 'workers/sync/src/lib/github'

interface MockGitHubEndpointsData {
  repos?: { [owner: string]: { [repo: string]: { id: number; default_branch: string } | null } }

  configs?: { [owner: string]: string }

  files?: { [path: string]: string }

  installations?: { [owner: string]: string[] }
}

export class MockGitHubEndpoints implements IGitHubEndpoints {
  private _stack: { method: string; params: any }[] = []

  /**
   * Returns the callstack of functions since the beginning of class creation.
   */
  get stack() {
    return this._stack
  }

  private push(method: string, params: any) {
    this._stack.push({ method, params })
  }

  constructor(data: MockGitHubEndpointsData = {}) {
    this.repos = data.repos ?? {}
    this.files = data.files ?? {}
    this.configs = data.configs ?? {}
    this.installations = data.installations ?? {}
  }

  // METHODS

  private repos: { [owner: string]: { [repo: string]: { id: number; default_branch: string } | null } }

  async getRepo(id: { owner: string; repo: string }): Promise<GitHubRepository | null> {
    this.push('get_repo', id)
    const repo = this.repos?.[id.owner]?.[id.repo]
    if (repo) {
      return {
        id: repo.id,
        name: id.repo,
        default_branch: repo.default_branch,
      }
    }

    return null
  }

  private files: { [path: string]: string }

  async getFile(id: { owner: string; repo: string } & { ref: string }, path: string): Promise<string | null> {
    this.push('get_file', { id, path })
    return this.files[path] ?? null
  }

  private configs: { [owner: string]: string }

  async getConfig(id: { owner: string }): Promise<string | null> {
    this.push('get_config', id)
    return this.configs[id.owner] ?? null
  }

  async getLabels(
    { repo, owner }: { owner: string; repo: string },
    page?: number | undefined,
  ): Promise<GitHubLabel[] | null> {
    this.push('get_labels', { repo, owner, page })
    return []
  }

  async createLabel(
    id: { owner: string; repo: string },
    label: Pick<GitHubLabel, 'color' | 'description' | 'name'>,
  ): Promise<GitHubLabel | null> {
    this.push('create_label', { id, label })
    return label
  }

  async updateLabel(id: { owner: string; repo: string }, label: GitHubLabel): Promise<GitHubLabel | null> {
    this.push('update_label', { id, label })
    return label
  }

  async removeLabel(id: { owner: string; repo: string }, label: Pick<GitHubLabel, 'name'>): Promise<void> {
    this.push('remove_label', { id, label })
  }

  async addLabelsToIssue(
    id: { owner: string; repo: string },
    params: { issue_number: number; labels: Pick<GitHubLabel, 'name'>[] },
  ): Promise<GitHubLabel[] | null> {
    this.push('add_labels_to_issue', { id, params })

    const labels = params.labels.map((label) => ({ ...label, id: 42, color: '#000fff' }))
    return labels
  }

  async aliasLabels(id: { owner: string; repo: string }, labels: GitHubLabel[]): Promise<void> {
    this.push('alias_labels', { id, labels })
  }

  async getRepositoryIssues(
    { repo, owner }: { owner: string; repo: string },
    page?: number | undefined,
  ): Promise<GitHubIssue[] | null> {
    this.push('get_repository_issues', { repo, owner, page })
    return []
  }

  async openIssue(
    id: { owner: string; repo: string },
    params: { title: string; body: string },
  ): Promise<GitHubIssue | null> {
    this.push('open_issue', { id, params })
    return { id: 42, number: 1, labels: [] }
  }

  async comment(id: { owner: string; repo: string }, params: { comment: string; issue: number }): Promise<void> {
    this.push('comment', { id, params })
  }

  async createFileTree(repo: { owner: string; repo: string }, tree: FileTree.Type): Promise<{ sha: string } | null> {
    this.push('create_file_tree', { repo, tree })
    return { sha: 'sha' }
  }

  async createBlob({ owner, repo }: { owner: string; repo: string }, content: string): Promise<GitHubBlob | null> {
    this.push('create_blob', { owner, repo, content })
    return { sha: 'sha' }
  }

  async createRepository(
    { owner, repo }: { owner: string; repo: string },
    params: { description: string },
  ): Promise<GitHubRepository | null> {
    this.push('create_repository', { owner, repo, params })
    return { id: 42, name: 'repository', default_branch: 'main' }
  }

  async createCommit(
    id: { owner: string; repo: string },
    params: { sha: string; message: string; parent: string },
  ): Promise<GitHubCommit | null> {
    this.push('create_commit', { id, params })

    return {
      sha: 'sha',
      author: {
        date: '2020-01-01T00:00:00.000Z',
        email: 'user@labels.com',
        name: 'User',
      },
      message: 'Sample commit message',
      tree: { sha: 'tree_sha' },
    }
  }

  async getRef({ repo, owner }: { owner: string; repo: string }, ref: string): Promise<GitHubRef | null> {
    this.push('get_ref', { repo, owner, ref })
    return {
      ref: 'ref',
      object: { type: 'commit', sha: 'sha' },
    }
  }

  async updateRef(
    { repo, owner }: { owner: string; repo: string },
    params: { ref: string; sha: string },
  ): Promise<GitHubRef | null> {
    this.push('update_ref', { repo, owner, params })
    return { ref: params.ref, object: { type: 'commit', sha: params.sha } }
  }

  async bootstrapConfigRepository(
    repo: { owner: string; repo: string },
    tree: FileTree.Type,
  ): Promise<GitHubRef | null> {
    this.push('bootstrap_config_repository', { repo, tree })
    return { ref: 'main', object: { type: 'commit', sha: 'sha' } }
  }

  private installations: { [owner: string]: string[] }

  async checkInstallationAccess(id: {
    owner: string
    repos: string[]
  }): Promise<
    | { status: 'Sufficient'; accessible: string[] }
    | { status: 'Insufficient'; missing: string[]; accessible: string[] }
    | null
  > {
    this.push('check_installation_access', id)

    const accessible = this.installations[id.owner] ?? []
    const missing = id.repos.filter((r) => !accessible.includes(r))

    if (missing.length > 0) {
      return { status: 'Insufficient', missing, accessible }
    }

    return { status: 'Sufficient', accessible }
  }

  async getInstallationRepos(id: { owner: string }, page?: number | undefined): Promise<GitHubRepository[] | null> {
    this.push('get_installation_repos', { id, page })
    return []
  }

  async getPullRequest(
    id: { owner: string; repo: string },
    params: { number: number },
  ): Promise<GitHubPullRequest | null> {
    this.push('get_pull_request', { id, params })
    return {
      id: 42,
      /** Number uniquely identifying the pull request within its repository. */
      number: 4,
      /** State of this Pull Request. Either `open` or `closed`. */
      state: 'open',
      locked: false,
      /** The title of the pull request. */
      title: 'Sample PR',
      body: 'Sample PR body used to test LabelSync',
      labels: [],
      merge_commit_sha: null,
      head: {
        label: 'canary',
        ref: 'canary',
        sha: 'canary_sha',
      },
      base: {
        label: 'main',
        ref: 'main',
        sha: 'main_sha',
      },
      /** Indicates whether or not the pull request is a draft. */
      draft: false,
      merged: false,
      mergeable: true,
    }
  }

  async createPRCheckRun(
    id: { owner: string; repo: string },
    params: { pr_number: number; name: string },
  ): Promise<GitHubCheckRun | null> {
    this.push('create_pr_check_run', { id, params })
    return {
      id: 1,
      head_sha: 'head_sha',
      status: 'in_progress',
      conclusion: null,
      output: {
        title: params.name,
        summary: null,
        text: null,
      },
      name: params.name,
      check_suite: null,
    }
  }

  async completePRCheckRun(
    id: { owner: string; repo: string },
    params: {
      check_run: number
      conclusion: 'action_required' | 'cancelled' | 'failure' | 'neutral' | 'success' | 'skipped' | 'timed_out'
      output?: { title: string; summary: string; text?: string | undefined } | undefined
    },
  ): Promise<GitHubCheckRun | null> {
    this.push('complete_pr_check_run', { id, params })
    return {
      id: params.check_run,
      head_sha: 'head_sha',
      status: 'in_progress',
      conclusion: params.conclusion,
      output: {
        title: params.output?.title ?? null,
        summary: params.output?.summary ?? null,
        text: params.output?.text ?? null,
      },
      name: 'Existing PR Run!',
      check_suite: null,
    }
  }

  async mergePR(id: { owner: string; repo: string }, params: { pr_number: number }): Promise<GitHubMergeCommit | null> {
    this.push('merge_pr', { id, params })
    return { sha: 'merge_sha' }
  }
}
