import { Octokit } from 'probot'

/**
 * Opens an issue with a prescribed title and body.
 *
 * @param octokit
 * @param owner
 * @param reports
 */
export async function handleIssue(
  octokit: Octokit,
  owner: string,
  repo: string,
  title: string,
  body: string,
): Promise<Octokit.IssuesCreateResponse> {
  return octokit.issues
    .create({
      repo: repo,
      owner: owner,
      title: title,
      body: body,
    })
    .then(({ data }) => data)
}
