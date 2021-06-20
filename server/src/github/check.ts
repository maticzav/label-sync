/**
 * This file contains utility functions that we use to communicate
 * with GitHub about issues and related content.
 */

import { ProbotOctokit } from 'probot'
import * as t from 'luxon'

type Octokit = InstanceType<typeof ProbotOctokit>

// MARK: - Methods

export type CheckResult = {
  success: boolean
  /**
   * The title of the check.
   */
  title: string
  /**
   * A brief summary.
   */
  summary: string
  /**
   * Link to details page.
   */
  details_url?: string
}

type CheckParams = {
  owner: string
  repo: string
  /**
   * Name of the check event.
   */
  name: string
  /**
   * SHA of the head.
   */
  sha: string
}

/**
 * Creates a check and executes a handler function that resolves
 * with a check result.
 */
export async function check(
  github: Octokit,
  params: CheckParams,
  handler: () => Promise<CheckResult>,
) {
  // https://docs.github.com/en/rest/reference/checks#update-a-check-run

  /**
   * This function creates a new check, executes a handler
   * and updates check result with the event output.
   */

  const check = await github.checks
    .create({
      name: 'label-sync/dryrun',
      owner: params.owner,
      repo: params.repo,
      head_sha: params.sha,
      started_at: t.DateTime.now().toISO(),
      status: 'in_progress',
    })
    .then((res) => res.data)

  // Execute
  let result: CheckResult

  try {
    /**
     * Executes the handler in a wrapped environment.
     */
    result = await handler()
  } catch (err) /* instabul ignore next */ {
    const completion = await github.checks.update({
      check_run_id: check.id,
      owner: params.owner,
      repo: params.repo,
      status: 'completed',
      completed_at: t.DateTime.now().toISO(),
      conclusion: 'failure',
    })

    return completion.data
  }

  // Complete

  const completion = await github.checks.update({
    check_run_id: check.id,
    owner: params.owner,
    repo: params.repo,
    status: 'completed',
    completed_at: t.DateTime.now().toISO(),
    conclusion: result.success ? 'succeess' : 'failure',
    details_url: result.details_url,
    output: {
      title: result.title,
      summary: result.summary,
    },
  })

  return completion.data
}
