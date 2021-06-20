/**
 * This file contains utility functions that we use to communicate
 * with GitHub about issues and related content.
 */

import { ProbotOctokit } from 'probot'

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Methods

type OpenIssueParams = {
  owner: string
  repo: string
  title: string
  body: string
}

/**
 * Opens an issue with a prescribed title and body.
 */
export async function openIssue(octokit: Octokit, params: OpenIssueParams) {
  return octokit.issues
    .create({
      repo: params.repo,
      owner: params.owner,
      title: params.title,
      body: params.body,
    })
    .then(({ data }) => data)
}

// /**
//  * Closes the issue openned by the LabelSync configuration.
//  *
//  * @param octokit
//  * @param owner
//  * @param repo
//  * @param title
//  */
// export async function closeIssue(
//   octokit: Octokit,
//   owner: string,
//   repo: string,
//   title: string,
// ) {
//   const issues = await octokit.issues.listForRepo({
//     owner: owner,
//     repo: repo,
//     creator: 'labelsync-manager',
//   })
// }

type CreatePRCommentParams = {
  owner: string
  repo: string
  number: number
  message: string
}

/**
 * Creates a comment on a dedicated pull request.
 */
export async function createPRComment(
  octokit: Octokit,
  params: CreatePRCommentParams,
) {
  return octokit.issues
    .createComment({
      owner: params.owner,
      repo: params.repo,
      body: params.message,
      issue_number: params.number,
    })
    .then(({ data }) => data)
}
