import { Application } from 'probot'

import * as e from 'fp-ts/lib/Either'
import { pipe } from 'fp-ts/lib/pipeable'

import * as consts from './data/constants'
import {
  loadYAMLConfigFile,
  validateConfigurationShape,
  validateConfigurationContents,
} from './data/labelsync/configuration'
import { identity } from 'fp-ts/lib/function'
import { handleLabelSync } from './handlers/labels'
import { handleSiblingSync } from './handlers/siblings'

export default (app: Application) => {
  app.on('push', async ({ payload, github }) => {
    const owner = payload.repository.owner.login
    const repo = payload.repository.name
    const ref = payload.ref
    const masterRef = `refs/heads/${payload.repository.master_branch}`

    const configurationRepo = consts.labelSyncConfigurationRepository(owner)

    /* Ignore changes in non-configuration repositories. */
    if (configurationRepo === repo) return

    /* Ignore changes made to non master refs. */
    if (ref !== masterRef) return

    /**
     * Changes made to non-master branches should result in check runs.
     * Changes made on the master branch, however, should resolve with
     * labels sync.
     */

    const yamlConfig = await loadYAMLConfigFile(github, { owner, repo, ref })()

    const config = pipe(
      yamlConfig,
      e.chain(validateConfigurationShape),
      e.chain(validateConfigurationContents),
    )

    /* Process configuration file. */
    if (e.isRight(config)) {
      /**
       * Perform a label sync across repositories.
       */
      const { right: conf } = config
      const labelSyncStatus = await handleLabelSync(github, owner, conf)
      const siblingSyncStatus = await handleSiblingSync(github, owner, conf)
      const labelRenamesStatus = await handleLabelRename(github, owner, {})

      /* Log changes. */
    } else {
      /**
       * Open up an issue explaining the encountered error.
       */
    }
  })
}
