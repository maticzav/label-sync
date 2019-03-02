import * as github from '../src/github'

describe('getRepositoryFromName', () => {
  test('getRepositoryFromName correctly extracts repository', async () => {
    expect(github.getRepositoryFromName('maticzav/github-labels')).toEqual({
      owner: { login: 'maticzav' },
      name: 'github-labels',
      full_name: 'maticzav/github-labels',
    })
  })

  test('getRepositoryFromName returns null when malformed name', async () => {
    expect(github.getRepositoryFromName('prisma')).toBeNull()
  })
})

describe('getRepositoryLabels', () => {
  test('obtains correct repository labels', async () => {
    const client = {
      issues: {
        listLabelsForRepo: jest
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            data: Array(50).map(() => 'pass'),
          })
          .mockResolvedValueOnce({
            status: 200,
            data: Array(30).map(() => 'pass'),
          }),
      },
    }

    const repository = github.getRepositoryFromName('maticzav/github-labels')!
    const res = await github.getRepositoryLabels(client as any, repository)

    expect(res).toEqual(Array(80).map(() => 'pass'))
    expect(client.issues.listLabelsForRepo).toHaveBeenNthCalledWith(1, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 1,
      per_page: 50,
    })
    expect(client.issues.listLabelsForRepo).toHaveBeenNthCalledWith(2, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 2,
      per_page: 50,
    })
  })

  test('rejects on error', async () => {
    const client = {
      issues: {
        listLabelsForRepo: jest
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            data: Array(50).map(() => 'pass'),
          })
          .mockResolvedValueOnce({
            status: 400,
            data: Array(30).map(() => 'pass'),
          }),
      },
    }

    const repository = github.getRepositoryFromName('maticzav/github-labels')!
    const res = github.getRepositoryLabels(client as any, repository)

    await expect(res).rejects.toThrow("Couldn't load data from Github.")
    expect(client.issues.listLabelsForRepo).toHaveBeenNthCalledWith(1, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 1,
      per_page: 50,
    })
    expect(client.issues.listLabelsForRepo).toHaveBeenNthCalledWith(2, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 2,
      per_page: 50,
    })
  })
})

describe('getRepositoryIssues', () => {
  test('obtains correct repository labels', async () => {
    const client = {
      issues: {
        listForRepo: jest
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            data: Array(50).map(() => 'pass'),
          })
          .mockResolvedValueOnce({
            status: 200,
            data: Array(30).map(() => 'pass'),
          }),
      },
    }

    const repository = github.getRepositoryFromName('maticzav/github-labels')!
    const res = await github.getRepositoryIssues(client as any, repository)

    expect(res).toEqual(Array(80).map(() => 'pass'))
    expect(client.issues.listForRepo).toHaveBeenNthCalledWith(1, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 1,
      per_page: 50,
    })
    expect(client.issues.listForRepo).toHaveBeenNthCalledWith(2, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 2,
      per_page: 50,
    })
  })

  test('rejects on error', async () => {
    const client = {
      issues: {
        listForRepo: jest
          .fn()
          .mockResolvedValueOnce({
            status: 200,
            data: Array(50).map(() => 'pass'),
          })
          .mockResolvedValueOnce({
            status: 400,
            data: Array(30).map(() => 'pass'),
          }),
      },
    }

    const repository = github.getRepositoryFromName('maticzav/github-labels')!
    const res = github.getRepositoryIssues(client as any, repository)

    await expect(res).rejects.toThrow("Couldn't load data from Github.")
    expect(client.issues.listForRepo).toHaveBeenNthCalledWith(1, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 1,
      per_page: 50,
    })
    expect(client.issues.listForRepo).toHaveBeenNthCalledWith(2, {
      repo: repository.name,
      owner: repository.owner.login,
      page: 2,
      per_page: 50,
    })
  })
})

describe('isLabel', () => {
  test('evalutes true on equal labels', async () => {
    expect(
      github.isLabel({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      })({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      }),
    ).toBe(true)
  })

  test('evalutes false on different labels', async () => {
    expect(
      github.isLabel({
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: false,
      })({
        name: 'test-',
        description: 'test-description',
        color: 'test-',
        default: true,
      }),
    ).toBe(false)
  })
  test('ignores unimportant keys', async () => {
    expect(
      github.isLabel({
        node_id: '2',
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: true,
      })({
        node_id: '3',
        name: 'test-name',
        description: 'test-description',
        color: 'test-color',
        default: true,
      }),
    ).toBe(true)
  })
})
