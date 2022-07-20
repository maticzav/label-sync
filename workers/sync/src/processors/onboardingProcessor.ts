import { getLSConfigRepoName } from '@labelsync/config'

import { Processor } from '../lib/processor'
import { populateTemplate, TEMPLATES } from '../lib/templates'

type ProcessorData = {
  owner: string
  /**
   * The type of the account ("organization", "personal").
   */
  accountType: string
}

/**
 * Processor that onboards an organization to the platform.
 */
export class OnboardingProcessor extends Processor<ProcessorData> {
  async perform({ owner, accountType }: ProcessorData): Promise<void> {
    this.log.info(`Onboarding "${owner}"!`)

    const configRepoName = getLSConfigRepoName(owner)

    const accessibleRepos = await this.endpoints.checkInstallationAccess({
      owner,
      repos: [],
    })
    if (accessibleRepos == null) {
      throw new Error(`Couldn't check repository access.`)
    }

    // If configuration repository already exists, there's no need to bootstrap anything.
    const repo = await this.endpoints.getRepo({ owner, repo: configRepoName })
    if (repo != null) {
      this.log.info(`Configuration repository already exists, skipping onboarding.`)
      return
    }

    this.log.info(`No existing repository for ${owner}, start onboarding!`)

    switch (accountType) {
      case 'Organization': {
        this.log.info(`Bootstraping config repo for ${owner}.`)

        // Bootstrap a configuration repository in organisation.
        const repositories = accessibleRepos.accessible.map((name) => ({ name }))
        const personalisedTemplate = populateTemplate(TEMPLATES.yaml, {
          repository: configRepoName,
          repositories,
        })
        await this.endpoints.bootstrapConfigRepository({ owner, repo: configRepoName }, personalisedTemplate)

        this.log.info(`Onboarding complete for ${owner}.`)
        return
      }

      /* istanbul ignore next */
      case 'User': {
        // TODO: Allow personal account scaffolding once Github provides support.
        this.log.info(`User account ${owner}, skip onboarding.`)
        return
      }

      /* istanbul ignore next */
      default: {
        this.log.warn(`Unsupported account type: ${accountType}`)
        return
      }
    }
  }
}
