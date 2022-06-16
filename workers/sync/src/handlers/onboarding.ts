import { getPhysicalRepositories, parseConfig } from '@labelsync/config'

import { messages } from '../lib/constants'
import { TEMPLATES } from '../lib/templates'
import { handleLabelSync } from './labels'

export async function onboard() {
  /* See if config repository exists. */
  const repo = await getRepo(ctx.octokit, owner, configRepo)

  switch (repo.status) {
    case 'Exists': {
      /* Perform sync. */

      app.log.info(`User has existing repository in ${configRepo}, performing sync.`)

      const ref = `refs/heads/${repo.repo.default_branch}`

      /* Load configuration */
      const rawConfig = await getFile(ctx.octokit, { owner, repo: configRepo, ref }, LS_CONFIG_PATH)

      /* No configuration, skip the evaluation. */
      /* istanbul ignore next */
      if (rawConfig === null) {
        app.log.info(`No configuration, skipping sync.`)
        return
      }

      const parsedConfig = parseConfig({
        input: rawConfig,
        isPro: installation.plan === 'PAID',
      })

      /* Wrong configuration, open the issue. */
      if (!parsedConfig.ok) {
        app.log.info(`Error in config, skipping sync.`, {
          meta: { config: rawConfig, error: parsedConfig.error },
        })

        /* Open an issue about invalid configuration. */
        const title = 'LabelSync - Onboarding configuration'
        const body = messages['onboarding.error'](parsedConfig.error)

        const issue = await openIssue(ctx.octokit, owner, configRepo, title, body)

        app.log.info(`Opened issue ${issue.number}.`)
        return
      }

      /* Verify that we can access all configured files. */
      const access = await checkInstallationAccess(ctx.octokit, getPhysicalRepositories(parsedConfig.config))

      switch (access.status) {
        case 'Sufficient': {
          app.log.info(`Performing sync.`)

          /* Performs sync. */
          for (const repo of getPhysicalRepositories(parsedConfig.config)) {
            await handleLabelSync(ctx.octokit, owner, repo, parsedConfig.config.repos[repo], true)
          }

          return
        }
        case 'Insufficient': {
          app.log.info(`Insufficient permissions, skipping sync.`, {
            meta: { access: JSON.stringify(access) },
          })

          /* Opens up an issue about insufficient permissions. */
          const title = 'LabelSync - Insufficient permissions'
          const body = messages['insufficient.permissions'](access.missing)

          const issue = await openIssue(ctx.octokit, owner, configRepo, title, body)

          app.log.info(`Opened issue ${issue.number}.`)
          return
        }
      }
    }

    case 'Unknown': {
      app.log.info(`No existing repository for ${owner}, start onboarding.`)

      /**
       * Bootstrap the configuration depending on the
       * type of the installation account.
       */
      const accountType = ctx.payload.installation.account.type
      switch (accountType) {
        /* istanbul ignore next */
        case 'User': {
          // TODO: Allow personal account scaffolding once Github provides support.
          app.log.info(`User account ${owner}, skip onboarding.`)
          return
        }
        case 'Organization': {
          /**
           * Tempalte using for onboarding new customers.
           */

          app.log.info(`Bootstraping config repo for ${owner}.`)

          /* Bootstrap a configuration repository in organisation. */
          const personalisedTemplate = populateTemplate(TEMPLATES.yaml, {
            repository: configRepo,
            repositories: ctx.payload.repositories ?? [],
          })

          await bootstrapConfigRepository(ctx.octokit, { owner, repo: configRepo }, personalisedTemplate)

          app.log.info(`Onboarding complete for ${owner}.`)

          return
        }
        /* istanbul ignore next */
        default: {
          app.log.warn(`Unsupported account type: ${accountType}`)
          return
        }
      }
    }
  }
}
