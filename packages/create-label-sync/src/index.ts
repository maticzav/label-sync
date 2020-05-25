#!/usr/bin/env node

import * as creato from 'creato'
import * as fs from 'fs'
import * as handlebars from 'handlebars'
import * as inquirer from 'inquirer'
import meow from 'meow'
import * as mkdirp from 'mkdirp'
import { ml } from 'multilines'
import ora from 'ora'
import * as os from 'os'
import * as path from 'path'
import * as prettier from 'prettier'

import { loadTreeFromPath, mapEntries, writeTreeToPath } from './utils'

/* Templates */

export const templates: (creato.Template & { identifier: string })[] = [
  {
    identifier: 'yaml',
    name: 'YAML configuraiton',
    description: '',
    repo: {
      branch: 'master',
      path: '/templates/yaml',
      uri: 'https://github.com/maticzav/label-sync',
    },
  },
  {
    identifier: 'typescript',
    name: 'TypeScript configuration',
    description: '',
    repo: {
      branch: 'master',
      path: '/templates/typescript',
      uri: 'https://github.com/maticzav/label-sync',
    },
  },
]

/* Main */

async function main(
  cli: meow.Result<{
    force: {
      alias: string
      type: 'boolean'
      default: false
    }
    template: {
      alias: string
      type: 'string'
    }
    path: {
      alias: string
      type: 'string'
    }
  }>,
) {
  /* Owner information and repository. */

  let owner: string | undefined = undefined

  /* Set a default if we are alrady in repo. */
  if (process.cwd().endsWith('labelsync')) {
    const repository = path.basename(process.cwd())
    owner = repository.replace('-labelsync', '')
  }

  owner = await inquirer
    .prompt<{ owner: string }>([
      {
        name: 'owner',
        message: "What's your personal or organisation GitHub name?",
        type: 'input',
        default: owner,
        validate: (account) => account.trim() !== '',
      },
    ])
    .then((res) => res.owner)

  const repository = `${owner}-labelsync`

  /* Personalised repositories */

  const { repositoriesRaw } = await inquirer.prompt<{
    repositoriesRaw: string
  }>([
    {
      name: 'repositoriesRaw',
      message:
        'Type in repositories that LabelSync should include in configuration (comma-split):',
      type: 'input',
    },
  ])

  const repositories = repositoriesRaw
    .split(',')
    .map((repo) => repo.trim())
    .filter(Boolean)
    .map((name) => ({ name }))

  /* Template */

  let template

  /* Process user input */
  if (cli.flags.template) {
    const matchingTemplate = templates.find(
      (temp) => temp.identifier === cli.flags.template,
    )

    if (!matchingTemplate) {
      const availableTemplates = templates
        .map((temp) => `"${temp.identifier}"`)
        .join(', ')

      console.warn(
        /* prettier-ignore */
        `Couldn't find a template ${cli.flags.template}. You may choose among ${availableTemplates}`,
      )

      process.exit(1)
    }

    template = matchingTemplate
  }

  /* Prompt for templte */
  if (!template) {
    template = await inquirer
      .prompt<{ template: creato.Template }>([
        {
          name: 'template',
          message: 'Choose a LabelSync configuraiton template:',
          type: 'list',
          choices: templates.map((template) => ({
            name: template.name,
            value: template,
          })),
        },
      ])
      .then((res) => res.template)
  }

  /* Check whether we already are in configuration repository. */

  let dist = repository

  if (process.cwd().endsWith('labelsync')) {
    dist = '.'
  }

  if (cli.flags.path) {
    dist = cli.flags.path
  }

  // make dist absolute
  dist = path.resolve(process.cwd(), dist)

  /* Scaffold */
  let approve = cli.flags.force

  /* Prompt for approval if not forced. */
  if (!approve) {
    approve = await inquirer
      .prompt<{ approve: boolean }>([
        {
          name: 'approve',
          message: `We'll scaffold configuration to ${dist}`,
          type: 'confirm',
        },
      ])
      .then((res) => res.approve)
  }

  if (!approve) {
    console.log(`OK! Not scaffolding.`)
    process.exit(0)
  }

  /**
   * Scaffold the template.
   */

  /* Setup tmpdir */
  const tmpDist = path.resolve(os.tmpdir(), `./labelsync`)
  fs.rmdirSync(tmpDist, { recursive: true })
  fs.mkdirSync(tmpDist, { recursive: true })

  if (!fs.existsSync(dist)) mkdirp.sync(dist)

  /* Load template */

  const templateSpinner = ora({
    text: `Downloading ${template.name} template.`,
  }).start()

  const res = await creato.loadTemplate(template, tmpDist)

  if (res.status === 'ok') {
    templateSpinner.succeed()
  } else {
    templateSpinner.fail()
    console.warn(res.message)
    process.exit(1)
  }

  /* Populate */

  const populateSpinner = ora({
    text: `Personalising configuration for you`,
  }).start()

  const tree = loadTreeFromPath(tmpDist, [])

  const populatedTree = mapEntries(tree, (file, name) => {
    try {
      /* Personalise files */
      const populatedFile = handlebars.compile(file)({
        repository,
        repositories,
      })

      /* Format it */
      switch (path.extname(name)) {
        case '.ts': {
          return prettier.format(populatedFile, { parser: 'typescript' })
        }
        case '.yml': {
          return prettier.format(populatedFile, { parser: 'yaml' })
        }
        case '.md': {
          return prettier.format(populatedFile, { parser: 'markdown' })
        }
        case '.json': {
          return prettier.format(populatedFile, { parser: 'json' })
        }
        default: {
          return populatedFile
        }
      }
    } catch (err) {
      templateSpinner.fail()
      console.error(`Error in ${name}`, err.message)
      process.exit(1)
    }
  })
  await writeTreeToPath(dist, populatedTree)

  populateSpinner.succeed(`Template loaded inside ${dist}!`)
}

/* CLI */

const cli = meow(
  ml`
  | create-label-sync
  |
  | > Scaffolds the configuration repostiory for Github Labels manager.
  |
  | Flags:
  |    - force (f): force creates the repository
  |    - template (t): ${templates
    .map((temp) => `"${temp.identifier}"`)
    .join(', ')}
  |    - path (p): folder to scaffold the configuration to 
`,
  {
    flags: {
      force: {
        alias: 'f',
        type: 'boolean',
        default: false,
      },
      template: {
        alias: 't',
        type: 'string',
      },
      path: {
        alias: 'p',
        type: 'string',
      },
    },
  },
)

/* istanbul ignore next */
if (require.main?.filename === __filename) {
  main(cli)
}
