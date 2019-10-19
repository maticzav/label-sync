import { Application } from 'probot'

import * as e from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

import * as consts from './data/constants'
import {
  loadYAMLConfigFile,
  validateYAMLConfiguration,
} from './data/labelsync/configuration'
import { identity } from 'fp-ts/lib/function'

export default (app: Application) => {
  app.on('push', async context => {
    const owner = context.payload.repository.owner.login
    const repo = context.payload.repository.name
    const ref = context.payload.ref
    const masterRef = `refs/heads/${context.payload.repository.master_branch}`

    const configurationRepo = consts.labelSyncConfigurationRepository(owner)

    /* Ignore changes in non-configuration repositories. */
    if (configurationRepo === repo) return

    /**
     * Changes made to non-master branches should result in check runs.
     * Changes made on the master branch, however, should resolve with
     * labels sync.
     */

    const yamlConfig = await loadYAMLConfigFile(context.github, {
      owner,
      repo,
      ref,
    })()

    if (e.isLeft(yamlConfig)) {
      /* Create an issue informing a user that we couldn't load configuration file. */
      return
    }

    const lsConfig = e.fold(err => {}, validateYAMLConfiguration)(yamlConfig)

    /* Process configuration file. */
  })
}
