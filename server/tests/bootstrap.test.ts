import fs from 'fs'
import path from 'path'

import { populateTempalte } from '../src/bootstrap'
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
        name: 'graphql-shield',
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

      expect(populateTempalte(tree, data)).toMatchSnapshot()
    })
  }
})
