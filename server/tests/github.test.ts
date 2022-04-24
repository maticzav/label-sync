import nock from 'nock'
import path from 'path'
import { ProbotOctokit } from 'probot'

import { isLabel, isLabelDefinition, bootstrapConfigRepository } from '../src/lib/github'
import { populateTemplate } from '../src/lib/bootstrap'
import { loadTreeFromPath } from '../src/lib/utils'
import { Octokit } from 'server/src/lib/context'

/* Fixtures */
const TEMPLATE_PATH = path.resolve(__dirname, '../../templates/typescript/')
const TEMPLATE = populateTemplate(
  loadTreeFromPath(TEMPLATE_PATH, ['dist', 'node_modules', '.DS_Store', /.*\.log.*/, /.*\.lock.*/]),
  {
    repository: 'config-labelsync',
    repositories: [{ name: 'labelsync' }],
  },
)

describe('github integration:', () => {
  beforeAll(() => {
    nock.disableNetConnect()
  })

  afterAll(() => {
    nock.enableNetConnect()
  })

  let github: Octokit

  beforeEach(() => {
    github = new ProbotOctokit()
  })

  afterEach(() => {
    nock.cleanAll()
  })

  test(
    'bootstraps configuraiton',
    async () => {
      expect.assertions(6)

      // const repoEndpoint = jest.fn().mockReturnValue({})
      const createRepoEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body).toEqual({
          name: 'maticzav-labelsync',
          description: 'LabelSync configuration repository.',
          auto_init: true,
        })
        return
      })

      let blobs: { [sha: number]: string } = {}

      const createBlobEndpoint = jest.fn().mockImplementation((uri, body) => {
        const sha = Object.keys(blobs).length
        blobs[sha] = body.content
        return { url: 'url', sha }
      })

      let trees: { [sha: number]: string } = {}

      const createTreeEndpoint = jest.fn().mockImplementation((uri, body) => {
        const sha = Object.keys(trees).length
        trees[sha] = body.tree
        return { sha: sha, url: 'url', tree: body.tree }
      })

      const parentSha = Math.floor(Math.random() * 1000).toString()

      const getRefEndpoint = jest.fn().mockImplementation((uri, body) => {
        return { object: { sha: parentSha } }
      })

      const commitSha = Math.floor(Math.random() * 1000).toString()

      const createCommitEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body.parents).toEqual([parentSha])
        return { sha: commitSha }
      })

      const updateRefEndpoint = jest.fn().mockImplementation((uri, body) => {
        expect(body.sha).toBe(commitSha)
        return { object: { sha: '' } }
      })

      /* Mocks */

      // nock('https://api.github.com')
      //   .post('/app/installations/13055/access_tokens')
      //   .reply(200, { token: 'test' })

      // nock('https://api.github.com')
      //   .get('/repos/maticzav/maticzav-labelsync')
      //   .reply(404, repoEndpoint)

      nock('https://api.github.com').post('/orgs/maticzav/repos').reply(200, createRepoEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/blobs')
        .reply(200, createBlobEndpoint)
        .persist()

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/trees')
        .reply(200, createTreeEndpoint)
        .persist()

      nock('https://api.github.com')
        .get('/repos/maticzav/maticzav-labelsync/git/ref/heads%2Fmaster')
        .reply(200, getRefEndpoint)

      nock('https://api.github.com')
        .post('/repos/maticzav/maticzav-labelsync/git/commits')
        .reply(200, createCommitEndpoint)

      nock('https://api.github.com')
        .patch('/repos/maticzav/maticzav-labelsync/git/refs/heads%2Fmaster')
        .reply(200, updateRefEndpoint)

      /* Bootstrap. */

      await bootstrapConfigRepository(github, { owner: 'maticzav', repo: 'maticzav-labelsync' }, TEMPLATE)

      /* Tests */

      expect(createRepoEndpoint).toBeCalledTimes(1)
      expect(blobs).toMatchSnapshot()
      expect(trees).toMatchSnapshot()
    },
    5 * 60 * 1000,
  )
})

describe('github:', () => {
  test('isLabel', () => {
    expect(
      isLabel({
        name: 'bug',
        color: 'ff',
        description: 'desc',
      })({
        name: 'bug',
        description: 'desc',
        color: 'ff',
      }),
    ).toBeTruthy()

    expect(
      isLabel({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug',
        description: 'desc',
        color: 'ff',
      }),
    ).toBeFalsy()

    expect(
      isLabel({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug/0',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeFalsy()
  })

  test('isLabelDefinition', () => {
    expect(
      isLabelDefinition({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeTruthy()

    expect(
      isLabelDefinition({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug/0',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeFalsy()
  })
})
