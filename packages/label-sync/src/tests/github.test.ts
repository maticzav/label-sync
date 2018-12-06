import { getRepositories } from '../github'

describe('Github function', () => {
  test('getRepositories works as expected', async () => {
    const client = {
      repos: {
        list: jest
          .fn()
          .mockResolvedValueOnce({
            data: Array(100).map(() => 'pass'),
          })
          .mockResolvedValueOnce({
            data: Array(50).map(() => 'pass'),
          }),
      },
    }

    const res = await getRepositories(client as any)

    expect(res).toEqual(Array(150).map(() => 'pass'))
    expect(client.repos.list).toHaveBeenNthCalledWith(1, {
      page: 1,
      per_page: 100,
    })
    expect(client.repos.list).toHaveBeenNthCalledWith(2, {
      page: 2,
      per_page: 100,
    })
  })
})
