import Octokit from '@octokit/rest'

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
  page: number = 1,
): Promise<GithubRepository[]> {
  const size = 100

  return client.repos
    .list({
      page: page,
      per_page: size,
    })
    .then(async res => {
      if (res.data.length < size) {
        return res.data
      } else {
        const remainingRepositories = await getRepositories(client, page + 1)
        return [...res.data, ...remainingRepositories]
      }
    })
}
