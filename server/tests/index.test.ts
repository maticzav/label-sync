import nock from 'nock'
import { Probot } from 'probot'

import ls from '../src'

import pushPayload from './__fixtures__/push'

describe('bot:', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  let probot: Probot

  beforeEach(() => {
    probot = new Probot({})
    const app = probot.load(ls)

    app.app = {
      getSignedJsonWebToken: () => 'jwt',
      getInstallationAccessToken: () => Promise.resolve('token'),
    }
  })

  test('push event', async () => {
    await probot.receive({ id: '1', name: 'push', payload: push })
  })
})
