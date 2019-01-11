import * as probot from 'probot'
import { generateManifest, getGithubBot, Config } from '../'
import * as events from './__fixtures__/webhook'

describe('bot', () => {
  /* bot */

  test('getGithubBot correctly reports manifest error', async () => {
    const config: Config = {
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['undefined-sibling'],
          },
        },
      },
      'prisma/graphqlgen': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
          },
        },
      },
      'prisma/prisma': {
        labels: {
          'test-sibling': {
            description: 'Testing sync.',
            color: '123456',
          },
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-sibling'],
          },
        },
        strict: true,
      },
      'prisma/prisma-binding': {
        labels: {
          'test-sibling': {
            description: 'Testing sync.',
            color: '123456',
          },
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-sibling', 'undefined-sibling', 'another-one'],
          },
        },
        strict: true,
      },
    }

    expect(getGithubBot(config)).toEqual({
      status: 'err',
      message: `Errors in manifest generation:
  prisma/github-labels: undefined-sibling are not defined,
  prisma/prisma-binding: undefined-sibling, another-one are not defined`,
    })
  })

  test('getGithubBot correctly handles unconfigured repository', async () => {
    /* Mocks */
    const config: Config = {
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-1', 'test-2'],
          },
          'test-1': '123456',
          'test-2': '123456',
        },
        strict: true,
      },
    }

    const github = {
      issues: {
        addLabels: jest.fn().mockReturnValue(undefined),
      },
    }

    /* Execution */
    const res = getGithubBot(config) as {
      status: 'ok'
      bot: (app: probot.Application) => void
    }
    const bot = new probot.Probot({})
    const app = bot.load(res.bot)

    app.app = () => 'test'
    app.auth = () => Promise.resolve(github as any)

    app.receive({
      name: 'issues.edited',
      payload: events.unconfiguredRepository,
    })

    /* Tests */
    expect(res.status).toBe('ok')
    expect(github.issues.addLabels).toBeCalledTimes(0)
  })

  test('getGithubBot correctly handles unconfigured label', async () => {
    /* Mocks */
    const config: Config = {
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-1', 'test-2'],
          },
          'test-1': '123456',
          'test-2': '123456',
        },
        strict: true,
      },
    }

    const github = {
      issues: {
        addLabels: jest.fn().mockReturnValue(undefined),
      },
    }

    /* Execution */
    const res = getGithubBot(config) as {
      status: 'ok'
      bot: (app: probot.Application) => void
    }
    const bot = new probot.Probot({})
    const app = bot.load(res.bot)

    app.app = () => 'test'
    app.auth = () => Promise.resolve(github as any)

    app.receive({
      name: 'issues.edited',
      payload: events.unconfiguredLabel,
    })

    /* Tests */
    expect(res.status).toBe('ok')
    expect(github.issues.addLabels).toBeCalledTimes(0)
  })

  test('getGithubBot correctly handles webhook event', async () => {
    /* Mocks */
    const config: Config = {
      'prisma/prisma-binding': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-1', 'test-2'],
          },
          'test-1': '123456',
          'test-2': '123456',
        },
        strict: true,
      },
    }

    const github = {
      issues: {
        addLabels: jest.fn().mockReturnValue(undefined),
      },
    }

    /* Execution */
    const res = getGithubBot(config) as {
      status: 'ok'
      bot: (app: probot.Application) => void
    }
    const bot = new probot.Probot({})
    const app = bot.load(res.bot)

    app.app = () => 'test'
    app.auth = () => Promise.resolve(github as any)

    app.receive({
      name: 'issues.edited',
      payload: events.labeled,
    })

    /* Tests */
    expect(res.status).toBe('ok')
    expect(github.issues.addLabels).toBeCalledTimes(2)
  })

  /* generateManifest */

  test('generateManifest correctly reports undefined sibling', async () => {
    const config: Config = {
      'prisma/github-labels': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['undefined-sibling'],
          },
        },
      },
      'prisma/graphqlgen': {
        labels: {
          test: {
            description: 'Testing sync.',
            color: '123456',
          },
        },
      },
      'prisma/prisma': {
        labels: {
          'test-sibling': {
            description: 'Testing sync.',
            color: '123456',
          },
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-sibling'],
          },
        },
        strict: true,
      },
      'prisma/prisma-binding': {
        labels: {
          'test-sibling': {
            description: 'Testing sync.',
            color: '123456',
          },
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-sibling', 'undefined-sibling', 'another-one'],
          },
        },
        strict: true,
      },
    }

    expect(generateManifest(config)).toEqual({
      status: 'err',
      message: `Errors in manifest generation:
  prisma/github-labels: undefined-sibling are not defined,
  prisma/prisma-binding: undefined-sibling, another-one are not defined`,
    })
  })

  test('generateManifest correctly generates manifest', async () => {
    const config: Config = {
      'prisma/github-labels': {
        labels: {
          color: 'red',
          test: {
            description: 'Testing sync.',
            color: '123456',
          },
        },
      },
      'prisma/prisma-binding': {
        labels: {
          'test-sibling': {
            description: 'Testing sync.',
            color: '123456',
          },
          test: {
            description: 'Testing sync.',
            color: '123456',
            siblings: ['test-sibling'],
          },
        },
        strict: true,
      },
    }

    expect(generateManifest(config)).toEqual({
      status: 'ok',
      manifest: {
        'prisma/github-labels': {
          test: [],
        },
        'prisma/prisma-binding': {
          test: ['test-sibling'],
          'test-sibling': [],
        },
      },
    })
  })
})
