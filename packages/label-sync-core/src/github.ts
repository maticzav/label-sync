import * as assert from 'assert'
import Octokit from '@octokit/rest'

/**
 *
 * Github functions
 *
 */

export interface GithubRepository {
  id?: number
  owner: {
    id?: number
    login: string
  }
  name: string
  full_name: string
}

/**
 *
 * Converts Github repository name to GithubRepository
 *
 * @param name
 */
export function getRepositoryFromName(name: string): GithubRepository | null {
  try {
    const [owner, repo] = name.split('/')

    assert.ok(typeof owner === 'string')
    assert.ok(typeof repo === 'string')

    return {
      owner: { login: owner },
      name: repo,
      full_name: name,
    }
  } catch (err) {
    return null
  }
}

export interface GithubIssue {
  id: number
  number: number
  state: string
  title: string
  body: string
  labels: GithubLabel[]
}

/**
 *
 * Obtains all issues in a particular repository.
 *
 * @param github
 * @param repository
 */
export const getRepositoryIssues = paginate<GithubIssue>(
  (github, repository, page) =>
    github.issues.listForRepo({
      repo: repository.name,
      owner: repository.owner.login,
      page: page,
      per_page: 100,
    }),
  100,
)

// export interface GithubPullRequest {
//   id: number
//   number: number
//   base: { repo: GithubRepository }
//   state: string
//   title: string
//   body: string
//   labels: GithubLabel[]
// }

// /**
//  *
//  * Obtains all pull requests in a repository.
//  *
//  * @param github
//  * @param repository
//  */
// export const getRepositoryPullRequests = paginate<GithubPullRequest>(
//   (github, repository, page) =>
//     github.pulls.list({
//       repo: repository.name,
//       owner: repository.owner.login,
//       page: page,
//       per_page: 100,
//     }),
//   100,
// )

export interface GithubLabel {
  id?: number
  node_id?: string
  url?: string
  name: string
  description: string
  color: string
  default: boolean
}

/**
 *
 * Obtains all labels used in particular repository.
 *
 * @param github
 * @param repository
 */
export const getRepositoryLabels = paginate<GithubLabel>(
  (github, repository, page) =>
    github.issues.listLabelsForRepo({
      repo: repository.name,
      owner: repository.owner.login,
      page: page,
      per_page: 100,
    }),
  100,
)

/* Helper functions */

/**
 *
 * Paginates a Github function.
 *
 * @param fn
 * @param size
 */
function paginate<T>(
  fn: (
    github: Octokit,
    repository: GithubRepository,
    page: number,
  ) => Promise<Octokit.Response<T[]>>,
  size: number,
  page: number = 1,
): (github: Octokit, repository: GithubRepository) => Promise<T[]> {
  return (github: Octokit, repository: GithubRepository) =>
    fn(github, repository, page).then(async res => {
      /* Handle error case */
      if (res.status !== 200) {
        return Promise.reject()
      }

      /**
       * Return data if its size is less than treshold.
       * Paginate further otherwise.
       */
      if (res.data.length < size) {
        return res.data
      } else {
        return paginate(fn, size, page + 1)(github, repository).then(
          remainings => [...res.data, ...remainings],
        )
      }
    })
}
