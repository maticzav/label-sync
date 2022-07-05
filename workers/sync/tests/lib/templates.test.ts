import fs from 'fs'
import path from 'path'

import { populateTemplate } from '../src/lib/bootstrap'
import { loadTreeFromPath } from '../../../server/src/lib/utils'

const templatesPath = path.resolve(__dirname, '../../templates')
const templates = fs.readdirSync(templatesPath).map((template) => ({
  name: template,
  path: path.resolve(templatesPath, template),
}))

describe('templates:', () => {
  const data = {
    repository: 'maticzav-labelsync',
    repositories: [{ name: 'changed' }, { name: 'label-sync' }, { name: 'resk' }],
  }

  for (const template of templates) {
    test(`populates ${template.name} tempalate`, () => {
      const tree = loadTreeFromPath(template.path, ['dist', 'node_modules', '.DS_Store', /.*\.log.*/, /.*\.lock.*/])

      expect(populateTemplate(tree, data)).toMatchSnapshot()
    })
  }
})
