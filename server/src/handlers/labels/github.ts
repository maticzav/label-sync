import * as e from 'fp-ts/lib/Either'
import * as t from 'fp-ts/lib/Task'
import { Octokit } from 'probot'

/**
 * Fetches labels in a repository.
 */
export function getRepositoryLabels(
  octokit: Octokit,
  { repo, owner }: { repo: string; owner: string },
): t.Task<e.Either<Error, Octokit.IssuesListLabelsForRepoResponseItem[]>> {
  return async () => {
    try {
      const labels = octokit.issues.listLabelsForRepo.endpoint.merge({
        repo,
        owner,
      })
      const res = await octokit.paginate(labels)

      return e.right(res)
    } catch (err) {
      return e.left(err)
    }
  }
}

/**
 * Find issues in a repository.
 */
export function getRepositoryIssues(
  octokit: Octokit,
  { repo, owner }: { repo: string; owner: string },
): t.Task<e.Either<Error, Octokit.IssuesListForRepoResponseItem[]>> {
  return async () => {
    try {
      const issues = octokit.issues.listForRepo.endpoint.merge({
        repo: repo,
        owner: owner,
      })
      const res = await octokit.paginate(issues)
      return e.right(res)
    } catch (err) {
      return e.left(err)
    }
  }
}
