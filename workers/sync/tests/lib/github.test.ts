import { GitHubEndpoints } from '../../src/lib/github'

describe('github', () => {
  test("correctly tells if label hasn't changed", () => {
    expect(
      GitHubEndpoints.equals(
        { name: 'bug', color: 'ff', description: 'desc' },
        { name: 'bug', description: 'desc', color: 'ff' },
      ),
    ).toBeTruthy()

    expect(
      GitHubEndpoints.equals(
        { name: 'bug', color: '00', description: 'desc' },
        { name: 'bug', description: 'desc', color: 'ff' },
      ),
    ).toBeFalsy()

    expect(
      GitHubEndpoints.equals(
        { name: 'bug', color: '00', description: 'desc' },
        { name: 'bug/0', description: 'this is a bug', color: 'ff' },
      ),
    ).toBeFalsy()
  })

  test('correctly tells if two definitions define the same label', () => {
    expect(
      GitHubEndpoints.definition(
        { name: 'bug', color: '00', description: 'desc' },
        { name: 'bug', description: 'this is a bug', color: 'ff' },
      ),
    ).toBeTruthy()

    expect(
      GitHubEndpoints.definition(
        { name: 'bug', color: '00', description: 'desc' },
        { name: 'bug/0', description: 'this is a bug', color: 'ff' },
      ),
    ).toBeFalsy()
  })
})
