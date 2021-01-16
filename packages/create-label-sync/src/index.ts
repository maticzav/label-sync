#!/usr/bin/env node

import * as creato from 'creato'
import * as fs from 'fs'
import * as handlebars from 'handlebars'
import * as inquirer from 'inquirer'
import meow from 'meow'
import { ml } from 'multilines'
import ora from 'ora'
import * as os from 'os'
import * as path from 'path'
import * as prettier from 'prettier'
import { promisify } from 'util'

import { loadTreeFromPath, mapEntries, writeTreeToPath } from './utils'

/* Utility FS functions */

const mkdir = promisify(fs.mkdir)
const rmdir = promisify(fs.rmdir)
const status = promisify(fs.stat)
const access = promisify(fs.access)

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

  /**
   * If user has provided a template flag,
   * we check if we have it in the list of templates and load that one if it's there.
   */
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

  /* Scaffold the template. */

  /**
   * We use tmp dir to load the whole repository there
   * and then extract only relevant template to a desired destination.
   * tmpdir should be empty yet exist.
   *
   * We try removing the directory and handle the error if needed.
   */
  let tmpDist = path.resolve(os.tmpdir(), `./labelsync`)

  // let tmpDirFound = false

  // while (!tmpDirFound) {

  // }
  try {
    await rmdir(tmpDist, { recursive: true })
  } catch (err) {}

  try {
    await mkdir(tmpDist, { recursive: true })
  } catch (err) {}

  /**
   * Setup destination directory.
   */
  try {
    await mkdir(dist, { recursive: true })
  } catch (err) {
    if (err.code != 'EEXIST') {
      console.error(`Couldn't create destination folder ${dist}`)
      console.error(err)
      process.exit(1)
    }
  }

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
