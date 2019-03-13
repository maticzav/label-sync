import * as probot from 'probot'

export const hooks = (app: probot.Application): void => {
  app.on('team', async () => {
    console.log('hey')
  })
}
