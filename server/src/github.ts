import { Octokit } from 'probot'

import { Maybe } from './data/maybe'

/**
 * Loads a file from Github.
 *
 * @param octokit
 * @param path
 */
export async function getFile(
  octokit: Octokit,
  { owner, repo, ref }: { owner: string; repo: string; ref: string },
  path: string,
): Promise<Maybe<string>> {
  try {
    const res = await octokit.repos.getContents({
      owner: owner,
      path: path,
      repo: repo,
      ref: ref,
    })

    switch (res.status) {
      case 200: {
        // expect a single file
        if (Array.isArray(res.data) || !res.data.content) return null

        return Buffer.from(res.data.content, 'base64').toString()
      }
      default: {
        return null
      }
    }
  } catch (err) {
    return null
  }
}

export interface GithubLabel {
  name: string
  description?: string
  color: string
  default?: boolean
}

// export interface GithubLabelDiff extends GithubLabel {
//   old: Partial<GithubLabel>
// }

/**
 * Fetches labels in a repository.
 */
export async function getRepositoryLabels(
  octokit: Octokit,
  { repo, owner }: { repo: string; owner: string },
): Promise<Maybe<Octokit.IssuesListLabelsForRepoResponseItem[]>> {
  try {
    const labels = octokit.issues.listLabelsForRepo.endpoint.merge({
      repo,
      owner,
    })

    return octokit.paginate(labels)
  } catch (err) {
    return null
  }
}

/**
 *
 * Compares two labels by comparing all of their keys.
 *
 * @param label
 */
export function isLabel(local: GithubLabel): (remote: GithubLabel) => boolean {
  return remote =>
    local.name === remote.name &&
    local.description === remote.description &&
    local.color === remote.color
}

/**
 * Determines whether the two configurations configure the same label.
 *
 * @param local
 */
export function isLabelDefinition(
  local: GithubLabel,
): (remote: GithubLabel) => boolean {
  return remote => local.name === remote.name
}
