import { getLSConfigRepoName, getPhysicalRepositories, parseConfig } from '@labelsync/config'
import { calculateConfigurationDiff } from '../lib/config'

import { messages } from '../lib/constants'
import { Processor } from '../lib/processor'
import { generateHumanReadablePRReport, LabelSyncReport } from '../lib/reports'

type ProcessorData = {
  owner: string
  pr_number: number
  isPro: boolean
}

/**
 * A processor that performs a dryrun of the new configuration and comments
 * results on the PR.
 */
export class DryRunProcessor extends Processor<ProcessorData> {
  public async perform({ owner, pr_number, isPro }: ProcessorData) {
    this.log.info(`Performing dryrun for ${owner}/${pr_number}`)

    const configRepoName = getLSConfigRepoName(owner)

    const check = await this.endpoints.createPRCheckRun(
      { repo: configRepoName, owner },
      {
        name: 'LabelSync Configuration Check',
        pr_number: pr_number,
      },
    )

    const result = await this.dryrun({
      owner,
      repo: configRepoName,
      isPro,
      pull_number: pr_number,
    })

    if (!check) {
      return
    }

    // Complete the check with status if it was created successfully.
    await this.endpoints.completePRCheckRun(
      { owner, repo: configRepoName },
      {
        check_run: check.id,
        conclusion: result.ok ? 'success' : 'failure',
        output: {
          title: 'LabelSync Configuration Check',
          summary: result.message,
          text: result.message,
        },
      },
    )
  }

  /**
   * Performs configuration validation and returns result.
   */
  private async dryrun({
    owner,
    repo,
    isPro,
    pull_number,
  }: {
    repo: string
    owner: string
    isPro: boolean
    pull_number: number
  }) {
    const rawConfig = await this.endpoints.getConfig({ owner })

    // No configuration, skip the evaluation.
    if (rawConfig === null) {
      this.log.info(`No configuration, skipping dryrun.`)
      return { ok: false, message: 'No configuration found.' }
    }

    const parsedConfig = parseConfig({ input: rawConfig, isPro })

    if (!parsedConfig.ok) {
      this.log.info(`Error in configuration, openning issue.`, {
        meta: { config: rawConfig, error: parsedConfig.error },
      })

      const comment = messages['invalid.config.comment'](parsedConfig.error)
      await this.endpoints.comment({ owner, repo }, { issue: pull_number, comment })

      this.log.info({ comment }, `Commented on the issue ${pull_number} in ${owner}/${repo}.`)

      return { ok: false, message: parsedConfig.error }
    }

    // Verify that we can access all configured files.
    const repositories = getPhysicalRepositories(parsedConfig.config)
    const access = await this.endpoints.checkInstallationAccess({ owner, repos: repositories })
    if (access == null) {
      throw new Error(`Couldn't check repository access.`)
    }

    if (access.status === 'Insufficient') {
      this.log.info(`Insufficient permissions, skipping sync.`, {
        meta: { access: JSON.stringify(access) },
      })

      const comment = messages['insufficient.permissions.comment'](access.missing)
      await this.endpoints.comment({ owner, repo }, { issue: pull_number, comment })
      this.log.info({ comment }, `Commented on the issue ${pull_number} in ${owner}/${repo}.`)

      return { ok: false, message: comment }
    }

    // Perform the dryrun on each repository.
    const reports: LabelSyncReport[] = []
    for (const repo of access.accessible) {
      const config = parsedConfig.config.repos[repo.toLowerCase()] ?? parsedConfig.config.repos['*']
      if (config == null) {
        continue
      }

      const labels = await this.endpoints.getLabels({ owner, repo })
      if (labels == null) {
        throw new Error(`Couldn't fetch labels for ${owner}/${repo}.`)
      }

      const dryrun = calculateConfigurationDiff({
        config: config.labels,
        currentLabels: labels,
      })

      reports.push({
        status: 'Success',
        additions: dryrun.added,
        updates: dryrun.changed,
        aliases: dryrun.aliased,
        removals: dryrun.removed,
        repo,
        owner,
        config: {
          labels: config.labels,
          config: {
            removeUnconfiguredLabels: config.config?.removeUnconfiguredLabels === true,
          },
        },
      })
    }

    const report = generateHumanReadablePRReport(reports)
    return { ok: true, message: report }
  }
}
