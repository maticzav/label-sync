import { loadLabelSyncTemplate } from '../loader'

describe('bin', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  test('loadLabelSyncTemplate loads template correctly', async () => {
    /**
     * Mocks
     */

    /**
     * Execution
     */

    const res = await loadLabelSyncTemplate(
      {
        name: 'test-template',
        description: 'test-description',
        repo: {
          branch: 'test-branch',
          uri: 'test-uri',
          path: 'test-path',
        },
      },
      'path',
    )

    /**
     * Tests
     */
  })
})
