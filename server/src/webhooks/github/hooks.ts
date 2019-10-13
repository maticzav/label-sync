import * as probot from 'probot'
import * as foo from '@label-sync/core'

export const hooks = (app: probot.Application): void => {
  app.on('team', async () => {
    console.log('hey')
  })
}
