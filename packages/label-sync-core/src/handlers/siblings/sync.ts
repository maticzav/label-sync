import Octokit from '@octokit/rest'
import { SiblingSyncIssueReport, SiblingSyncReport } from './reporter'
import { assignSiblingsToIssue } from './siblings'
import {
  GithubRepository,
  getRepositoryIssues,
  GithubIssue,
} from '../../github'
import { RepositoryManifest } from '../../manifest'

export interface SiblingSyncOptions {}

/**
 *
 * Handles Sibling Sync in a repository.
 *
 * @param client
 * @param repository
 * @param config
 * @param options
 */
export async function handleSiblingSync(
  client: Octokit,
  repository: GithubRepository,
  manifest: RepositoryManifest,
  options: SiblingSyncOptions,
): Promise<SiblingSyncReport> {
  /**
   * Queries all pull requests and issues and applies siblings to existing
   * labels according to the manifest.
   */

  const issues = await getRepositoryIssues(client, repository)
  const issuesSync = await Promise.all(issues.map(handleIssue))

  return {
    repository: repository,
    manifest: manifest,
    options: options,
    issues: issuesSync,
  }

  /**
   *
   * Handles sibling sync in each issue of particular repository.
   *
   * @param issue
   */
  async function handleIssue(
    issue: GithubIssue,
  ): Promise<SiblingSyncIssueReport> {
    const siblings = await assignSiblingsToIssue(
      client,
      repository,
      issue,
      manifest,
    )

    return {
      issue: issue,
      siblings: siblings,
    }
  }
}
