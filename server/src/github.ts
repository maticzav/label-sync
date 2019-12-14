import { Octokit } from 'probot'

import { Maybe } from './utils'

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
