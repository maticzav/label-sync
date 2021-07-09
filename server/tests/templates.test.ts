import fs from 'fs'
import path from 'path'

import { populate } from '../src/templates'
import { loadTreeFromPath } from '../src/utils'

const templatesPath = path.resolve(__dirname, '../../templates')
const templates = fs.readdirSync(templatesPath).map((template) => ({
  name: template,
  path: path.resolve(templatesPath, template),
}))

describe('templates:', () => {
  const data = {
    repository: 'maticzav-labelsync',
    repositories: [
      {
        name: 'changed',
      },
      {
        name: 'label-sync',
      },
      {
        name: 'resk',
      },
    ],
  }

  for (const template of templates) {
    test(`populates ${template.name} tempalate`, () => {
      const tree = loadTreeFromPath(template.path, [
        'dist',
        'node_modules',
        '.DS_Store',
        /.*\.log.*/,
        /.*\.lock.*/,
      ])

      expect(populate(tree, data)).toMatchSnapshot()
    })
  }
})
