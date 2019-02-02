import * as Octokit from '@octokit/rest'
import { Sibling, RepositoryConfig } from './config'
import {
  GithubLabel,
  getRepositoryLabels,
  GithubRepository,
  GithubIssue,
} from './github'
import { withDefault } from './utils'
import { isLabel } from './labels'

/*
 *
 * Config
 *
 */

export type RepositoryManifest = {
  [name: string]: LabelManifest
}

export type LabelManifest = {
  label: GithubLabel
  siblings: Sibling[]
}

/**
 *
 * Generates repository manifest from repository configuration.
 *
 * @param github
 * @param repository
 * @param config
 */
export async function getRepositorySiblingsManifest(
  github: Octokit,
  repository: GithubRepository,
  config: RepositoryConfig,
): Promise<
  | {
      status: 'ok'
      manifest: RepositoryManifest
    }
  | { status: 'err'; message: string }
> {
  /* Fetch repository */

  const labels = await getRepositoryLabels(github, repository)
  const siblings = getRepositorySiblings(config)

  /* Validate configuration */

  const undefinedSiblings = siblings.filter(
    sibling => !labels.some(label => label.name === sibling),
  )

  if (undefinedSiblings.length !== 0) {
    return {
      status: 'err',
      message: `${undefinedSiblings.join(', ')} are not defined`,
    }
  }

  /* Generate manifest */

  const manifest = generateManifest(config, labels)

  return { status: 'ok', manifest: manifest }

  /* Helper functions */

  /**
   *
   * Returns all siblings in a configuration.
   *
   * @param repository
   */
  function getRepositorySiblings(repository: RepositoryConfig): Sibling[] {
    const siblings = Object.values(repository.labels).reduce<Sibling[]>(
      (acc, label) => {
        switch (typeof label) {
          case 'object': {
            return [...acc, ...withDefault<Sibling[]>([])(label.siblings)]
          }
          default: {
            return acc
          }
        }
      },
      [],
    )

    return siblings
  }

  /**
   *
   * Generates repository manifest from labels and siblings.
   *
   * @param repository
   * @param labels
   */
  function generateManifest(
    repository: RepositoryConfig,
    labels: GithubLabel[],
  ): RepositoryManifest {
    const manifest = labels.reduce((acc, label) => {
      const labelConfig = repository.labels[label.name]

      switch (typeof labelConfig) {
        case 'object': {
          return {
            ...acc,
            [label.name]: {
              label: label,
              siblings: withDefault<string[]>([])(labelConfig.siblings),
            },
          }
        }
        case 'string': {
          return {
            ...acc,
            [label.name]: {
              label: label,
              siblings: [],
            },
          }
        }
        default: {
          return acc
        }
      }
    }, {})

    return manifest
  }
}

/*
 *
 * Sibling Sync
 *
 */

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
): Promise<
  { status: 'ok'; siblings: GithubLabel[] } | { status: 'err'; message: string }
> {
  /* Find all the siblings */
  const siblings = getSiblings(issue.labels, issue.labels)

  try {
    const res = await github.issues.addLabels({
      repo: repository.name,
      owner: repository.owner.login,
      number: issue.number,
      labels: siblings.map(label => label.name),
    })

    if (res.status === 200) {
      return { status: 'ok', siblings: siblings }
    } else {
      return { status: 'err', message: "Couldn't sync siblings." }
    }
  } catch (err) {
    return { status: 'err', message: err.message }
  }

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
