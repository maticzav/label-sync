import { getLSConfigRepoName, getPhysicalRepositories, parseConfig } from '@labelsync/config'

import { messages } from '../lib/constants'
import { Processor } from '../lib/processor'

type ProcessorData = {
  owner: string
}

/**
 * A processor that verifies configuration and syncs the configuration with
 * the labels configured in each configured repository.
 */
export class OrganizationSyncProcessor extends Processor<ProcessorData> {
  /**
   * Syncs configuration of a repository with its labels.
   */
  public async perform({ owner }: ProcessorData) {
    const configRepoName = getLSConfigRepoName(owner)
    const rawConfig = await this.endpoints.getConfig({ owner })

    /* No configuration, skip the evaluation. */
    /* istanbul ignore next */
    if (rawConfig === null) {
      this.log.info(`No configuration, skipping sync.`)
      return
    }
    const parsedConfig = parseConfig({ input: rawConfig, isPro: this.installation.isPaidPlan })

    if (!parsedConfig.ok) {
      this.log.info(`Error in configuration, openning issue.`, {
        meta: { config: rawConfig, error: parsedConfig.error },
      })

      const title = 'Configuration Issue'
      const body = messages['onboarding.error.issue'](parsedConfig.error)
      const issue = await this.endpoints.openIssue({ owner, repo: configRepoName }, { title, body })
      if (issue == null) {
        throw new Error(`Couldn't open an issue...`)
      }

      this.log.info(`Opened issue ${issue.id} in ${owner}/${configRepoName}.`)

      return
    }

    // Verify that we can access all configured files.
    const requiredRepositories = getPhysicalRepositories(parsedConfig.config)
    const access = await this.endpoints.checkInstallationAccess({
      owner,
      repos: requiredRepositories,
    })

    if (access == null) {
      throw new Error(`Couldn't check repository access.`)
    }

    if (access.status === 'Sufficient') {
      // Even if there's no wildcard configuration, we try to sync all accessible repositories.
      for (const repo of access.accessible) {
        this.queue.push({
          kind: 'sync_repo',
          repo: repo,
          org: owner,
          dependsOn: [],
          ghInstallationId: this.installation.id,
          isPaidPlan: this.installation.isPaidPlan,
        })
      }
      return
    }

    this.log.info(`Insufficient permissions, skipping sync.`, {
      meta: { access: JSON.stringify(access) },
    })

    const title = 'Insufficient Permissions'
    const body = messages['insufficient.permissions.issue'](access.missing)

    const issue = await this.endpoints.openIssue({ owner, repo: configRepoName }, { title, body })
    if (issue == null) {
      throw new Error(`Couldn't open an issue...`)
    }

    this.log.info(`Opened issue ${issue.id} in ${owner}/${configRepoName}.`)

    return
  }
}
