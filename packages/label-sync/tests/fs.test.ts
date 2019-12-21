import path from 'path'

import { findUp } from '../src/fs'

describe('fs', () => {
  test('findUp finds prettier.config.js', async () => {
    const rdmPth = await findUp(
      __dirname,
      p => path.basename(p) === 'prettier.config.js',
    )

    expect(rdmPth).toEqual(path.resolve(__dirname, '../../../'))
  })
})
