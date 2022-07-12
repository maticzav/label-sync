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

export class MockGitHubEndpoints implements IGitHubEndpoints {
  private _stack: { method: string; params: any }[] = []

  /**
   * Returns the callstack of functions since the beginning of class creation.
   */
  get stack() {
    return this._stack
  }

  getRepo(id: { owner: string; repo: string }): Promise<GitHubRepository | null> {
    throw new Error('Method not implemented.')
  }
  getFile(id: { owner: string; repo: string } & { ref: string }, path: string): Promise<string | null> {
    throw new Error('Method not implemented.')
  }
  getConfig(id: { owner: string }): Promise<string | null> {
    throw new Error('Method not implemented.')
  }
  getLabels(
    { repo, owner }: { owner: string; repo: string },
    page?: number | undefined,
  ): Promise<GitHubLabel[] | null> {
    throw new Error('Method not implemented.')
  }
  createLabel(
    id: { owner: string; repo: string },
    label: Pick<GitHubLabel, 'color' | 'description' | 'name'>,
  ): Promise<GitHubLabel | null> {
    throw new Error('Method not implemented.')
  }
  updateLabel(id: { owner: string; repo: string }, label: GitHubLabel): Promise<GitHubLabel | null> {
    throw new Error('Method not implemented.')
  }
  removeLabel(id: { owner: string; repo: string }, label: Pick<GitHubLabel, 'name'>): Promise<void> {
    throw new Error('Method not implemented.')
  }
  addLabelsToIssue(
    id: { owner: string; repo: string },
    params: { issue_number: number; labels: Pick<GitHubLabel, 'name'>[] },
  ): Promise<GitHubLabel[] | null> {
    throw new Error('Method not implemented.')
  }
  aliasLabels(id: { owner: string; repo: string }, labels: GitHubLabel[]): Promise<void> {
    throw new Error('Method not implemented.')
  }
  getRepositoryIssues(
    { repo, owner }: { owner: string; repo: string },
    page?: number | undefined,
  ): Promise<GitHubIssue[] | null> {
    throw new Error('Method not implemented.')
  }
  openIssue(id: { owner: string; repo: string }, params: { title: string; body: string }): Promise<GitHubIssue | null> {
    throw new Error('Method not implemented.')
  }
  comment(id: { owner: string; repo: string }, params: { comment: string; issue: number }): Promise<void> {
    throw new Error('Method not implemented.')
  }
  createFileTree(repo: { owner: string; repo: string }, tree: FileTree.Type): Promise<{ sha: string } | null> {
    throw new Error('Method not implemented.')
  }
  createBlob({ owner, repo }: { owner: string; repo: string }, content: string): Promise<GitHubBlob | null> {
    throw new Error('Method not implemented.')
  }
  createRepository(
    { owner, repo }: { owner: string; repo: string },
    params: { description: string },
  ): Promise<GitHubRepository | null> {
    throw new Error('Method not implemented.')
  }
  createCommit(
    id: { owner: string; repo: string },
    params: { sha: string; message: string; parent: string },
  ): Promise<GitHubCommit | null> {
    throw new Error('Method not implemented.')
  }
  getRef({ repo, owner }: { owner: string; repo: string }, ref: string): Promise<GitHubRef | null> {
    throw new Error('Method not implemented.')
  }
  updateRef(
    { repo, owner }: { owner: string; repo: string },
    params: { ref: string; sha: string },
  ): Promise<GitHubRef | null> {
    throw new Error('Method not implemented.')
  }
  bootstrapConfigRepository(repo: { owner: string; repo: string }, tree: FileTree.Type): Promise<GitHubRef | null> {
    throw new Error('Method not implemented.')
  }
  checkInstallationAccess(id: {
    owner: string
    repos: string[]
  }): Promise<
    | { status: 'Sufficient'; accessible: string[] }
    | { status: 'Insufficient'; missing: string[]; accessible: string[] }
    | null
  > {
    throw new Error('Method not implemented.')
  }
  getInstallationRepos(id: { owner: string }, page?: number | undefined): Promise<GitHubRepository[] | null> {
    throw new Error('Method not implemented.')
  }
  getPullRequest(id: { owner: string; repo: string }, params: { number: number }): Promise<GitHubPullRequest | null> {
    throw new Error('Method not implemented.')
  }
  createPRCheckRun(
    id: { owner: string; repo: string },
    params: { pr_number: number; name: string },
  ): Promise<GitHubCheckRun | null> {
    throw new Error('Method not implemented.')
  }
  completePRCheckRun(
    id: { owner: string; repo: string },
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
      output?: { title: string; summary: string; text?: string | undefined } | undefined
    },
  ): Promise<GitHubCheckRun | null> {
    throw new Error('Method not implemented.')
  }
  mergePR(id: { owner: string; repo: string }, params: { pr_number: number }): Promise<GitHubMergeCommit | null> {
    throw new Error('Method not implemented.')
  }
}
