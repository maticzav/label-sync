import path from 'path'

import { findUp, findFolderUp, findFileUp } from '../src/fs'

describe('fs', () => {
  test('findUp finds prettier.config.js', async () => {
    const rdmPth = await findUp(
      __dirname,
      p => path.basename(p) === 'prettier.config.js',
    )

    expect(rdmPth).toEqual(path.resolve(__dirname, '../../../'))
  })

  test('findDirUp finds scripts', async () => {
    const rdmPth = await findFolderUp(__dirname, 'scripts')

    expect(rdmPth).toEqual(path.resolve(__dirname, '../../../'))
  })

  test('findFileUp finds prettier.config.js', async () => {
    const rdmPth = await findFileUp(__dirname, 'prettier.config.js')

    expect(rdmPth).toEqual(path.resolve(__dirname, '../../../'))
  })
})
