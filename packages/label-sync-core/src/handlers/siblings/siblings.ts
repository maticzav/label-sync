import * as Octokit from '@octokit/rest'

import {
  GithubLabel,
  GithubRepository,
  GithubIssue,
  isLabel,
} from '../../github'
import { RepositoryManifest } from '../../manifest'
import { Sibling } from '../../types'

export type AssignSiblingsToIssueOptions = {
  dryRun: boolean
}

/**
 *
 * Assigns label siblings to an Issue.
 *
 * @param github
 * @param pr
 * @param manifest
 * @param label
 */
export async function assignSiblingsToIssue(
  github: Octokit,
  repository: GithubRepository,
  issue: GithubIssue,
  manifest: RepositoryManifest,
  options: AssignSiblingsToIssueOptions,
): Promise<GithubLabel[]> {
  /* Find all the siblings */
  const siblings = getSiblings(issue.labels, issue.labels)

  /* Only perform calculation on dryRun */
  if (options.dryRun) {
    return siblings
  }

  /* Commit changes on sync */
  const res = await github.issues.addLabels({
    repo: repository.name,
    owner: repository.owner.login,
    number: issue.number,
    labels: siblings.map(label => label.name),
  })

  /* istanbul ignore if */
  if (res.status !== 200) {
    throw new Error(JSON.stringify(res))
  }

  return siblings

  /* Helper functions */

  /**
   *
   * Get siblings recursively finds siblings of labels in a particular Github
   * issue.
   *
   * @param labels
   * @param pool
   */
  function getSiblings(
    labels: GithubLabel[],
    pool: GithubLabel[],
    path: GithubLabel[] = [],
  ): GithubLabel[] {
    /**
     * For each label in the label definitions we try to find its siblings. Each
     * sibling is then checked to be included in the calculation path. If
     * we already came accross a particular label we skip calculation to prevent
     * circular dependencies.
     *
     * Once we find the dependencies we add only the ones missing in the pool
     * to prevent duplication.
     */
    const missingSiblings = labels.reduce<GithubLabel[]>((acc, label) => {
      const combinedPool = [...acc, ...pool]

      /* Skip ciruclar dependencies */
      if (path.some(isLabel(label))) {
        return acc
      }

      /* Find manifest definition */
      const labelManifest = manifest[label.name]

      /* Filter siblings of this label */
      const newLabels = hydrateSiblings(labelManifest.siblings).filter(
        newLabel => !combinedPool.some(isLabel(newLabel)),
      )

      /* Find siblings of this label's siblings */
      const labels = getSiblings(
        hydrateSiblings(labelManifest.siblings),
        [...combinedPool, ...newLabels],
        [...path, label],
      )

      return [...acc, ...newLabels, ...labels]
    }, [])

    return missingSiblings
  }

  /**
   *
   * Hydrates siblings to Github Labels from the manifest.
   *
   * @param siblings
   */
  function hydrateSiblings(siblings: Sibling[]): GithubLabel[] {
    return siblings.map(sibling => manifest[sibling].label)
  }
}
