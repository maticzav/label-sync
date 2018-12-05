import { getRepositories } from '../github'

describe('Github function', () => {
  test('getRepositories works as expected', async () => {
    const client = {
      repos: {
        list: jest.fn().mockResolvedValue({
          data: 'pass',
        }),
      },
    }

    const res = await getRepositories(client as any)

    expect(res).toEqual('pass')
  })
})
