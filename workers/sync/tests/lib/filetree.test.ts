import { FileTree } from '../../src/lib/filetree'

describe('filetree', () => {
  test('correctly returns files in the root dir', () => {
    const files = FileTree.getRootFiles({
      '/lib/models.ts': 'nested file',
      '/lib/utils.ts': 'nested file',
      '/index.ts': 'root file',
      '/main.ts': 'root file',
    })

    expect(files).toEqual({
      '/index.ts': 'root file',
      '/main.ts': 'root file',
    })
  })

  test('correctly returns subtrees of a filetree', () => {
    const subtrees = FileTree.getSubtrees({
      '/a/models.ts': 'nested file A',
      '/a/utils.ts': 'nested file A',
      '/a/deep/utils.ts': 'deeply nested file A',
      '/b/models.ts': 'nested file B',
      '/b/utils.ts': 'nested file B',
      '/b/deep/utils.ts': 'deeply nested file B',
      '/index.ts': 'root file',
      '/main.ts': 'root file',
    })

    expect(subtrees).toEqual({
      a: {
        'models.ts': 'nested file A',
        'utils.ts': 'nested file A',
        'deep/utils.ts': 'deeply nested file A',
      },
      b: {
        'models.ts': 'nested file B',
        'utils.ts': 'nested file B',
        'deep/utils.ts': 'deeply nested file B',
      },
    })
  })
})
