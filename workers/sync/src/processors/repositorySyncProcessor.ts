import { parseConfig } from '@labelsync/config'

import { calculateConfigurationDiff } from '../lib/config'
import { Processor } from '../lib/processor'
import { famap } from '../lib/utils'

type ProcessorData = {
  owner: string
  repo: string
}

/**
 * A processor that syncs the configuration with the labels configured in a repository.
 */
export class RepositorySyncProcessor extends Processor<ProcessorData> {
  /**
   * Syncs configuration of a repository with its labels.
   */
  public async perform({ owner, repo }: ProcessorData): Promise<void> {
    this.log.info(`Syncing repository ${owner}/${repo}...`)

    const rawConfig = await this.endpoints.getConfig({ owner })
    if (rawConfig === null) {
      this.log.info(`No configuration, skipping siblings sync.`)
      return
    }
    const parsedConfig = parseConfig({
      input: rawConfig,
      isPro: this.installation.isPaidPlan,
    })
    if (!parsedConfig.ok) {
      this.log.info(`Invalid configuration file in organization ${owner}...`)
      return
    }

    const config = parsedConfig.config.repos
    const repoconfig = config[repo.toLowerCase()] ?? config['*']
    if (repoconfig == null) {
      this.log.info(`No configuration for repository ${owner}/${repo}, skipping sync.`)
      return
    }

    const removeUnconfiguredLabels = repoconfig.config?.removeUnconfiguredLabels === true

    const remoteLabels = await this.endpoints.getLabels({ repo, owner })
    if (remoteLabels == null) {
      throw new Error(`Couldn't fetch current labels for repository ${owner}/${repo}.`)
    }

    const { added, changed, aliased, removed } = calculateConfigurationDiff({
      config: repoconfig.labels,
      currentLabels: remoteLabels,
    })

    try {
      await famap(added, (label) => this.endpoints.createLabel({ owner, repo }, label))
      await famap(changed, (label) => this.endpoints.updateLabel({ owner, repo }, label))
      await this.endpoints.aliasLabels({ owner, repo }, aliased)

      if (removeUnconfiguredLabels) {
        await famap(removed, (label) => this.endpoints.removeLabel({ owner, repo }, label))
      }

      this.log.info(`Sync of ${owner}/${repo} completed.`)
    } catch (err: any) /* istanbul ignore next */ {
      this.log.error(err, `Something went wrong during the sync of ${owner}/${repo}`)
    }

    return
  }
}
