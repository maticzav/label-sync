import { Octokit } from 'probot'

/**
 * Creates a comment on a dedicated pull request.
 * @param octokit
 * @param owner
 * @param repo
 * @param number
 * @param message
 */
export async function handlePRComment(
  octokit: Octokit,
  owner: string,
  repo: string,
  number: number,
  message: string,
): Promise<Octokit.IssuesCreateCommentResponse> {
  return octokit.issues
    .createComment({
      owner: owner,
      repo: repo,
      body: message,
      number: number,
    })
    .then(({ data }) => data)
}
