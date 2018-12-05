import * as Octokit from '@octokit/rest'

export interface GithubRepository {
  id: number
  node_id: string
  name: string
  full_name: string
}

/**
 * Fetches all repositories under authenticated user.
 */
export async function getRepositories(
  client: Octokit,
): Promise<GithubRepository[]> {
  return client.repos.list({}).then(res => res.data)
}
