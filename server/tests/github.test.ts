import fixtures from '@octokit/fixtures'

import { getFile } from '../src/github'

describe('github', () => {
  beforeAll(() => {
    process.env.FIXTURES_USER_A_TOKEN_FULL_ACCESS = 'gh-token'
  })
  test.todo('getFile fetches the perscrbied file', async () => {
    /* Mock Github endpoint */
    fixtures.mock('api.github.com/get-contents')

    const file = await getFile()
  })
})
