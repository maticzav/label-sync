import path from 'path'
import { not, loadTreeFromPath } from '../src/utils'

describe('utils:', () => {
  test('not', () => {
    expect(not(() => true)()).toBeFalsy()
    expect(not(() => false)()).toBeTruthy()
  })

  test('loadTreeFromPath', () => {
    const tree = loadTreeFromPath(
      path.resolve(__dirname, './__fixtures__/template'),
      ['ignore'],
    )

    expect(tree).toMatchSnapshot()
  })
})
