import fs from 'fs'
import path from 'path'

import { populateTemplate, loadTreeFromPath } from '../../src/lib/templates'

const TEMPLATES_PATH = path.resolve(__dirname, '../../../../templates')
const TEMPLATES = fs.readdirSync(TEMPLATES_PATH).map((template) => ({
  root: path.resolve(TEMPLATES_PATH, template),
  name: template,
}))

const DATA = {
  repository: 'maticzav-labelsync',
  repositories: [{ name: 'changed' }, { name: 'label-sync' }, { name: 'resk' }],
}

describe('templates', () => {
  for (const { name, root } of TEMPLATES) {
    test(`correctly populates "${name}" tempalate`, () => {
      const tree = loadTreeFromPath({
        root: root,
        ignore: ['dist', 'node_modules', '.DS_Store', /.*\.log.*/, /.*\.lock.*/],
      })
      const filled = populateTemplate(tree, DATA)

      expect(filled).toMatchSnapshot()
    })
  }

  test('correctly loads tree from path', () => {
    const tree = loadTreeFromPath({
      root: path.resolve(__dirname, '../__fixtures__/template'),
      ignore: ['ignore'],
    })

    expect(tree).toMatchSnapshot()
  })
})
