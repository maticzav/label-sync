#!/usr/bin/env node

import meow from 'meow'
import { manage } from './manager'

const cli = meow(
  `
Usage
  $ labels

Options
  --config Path to your configuration file.
  --dryrun Simulate sync to get information about potential changes.

Examples
  $ labels --config labels.config.js
`,
  {
    flags: {
      config: {
        type: 'string',
        alias: 'c',
      },
      dryrun: {
        type: 'boolean',
        default: false,
      },
    },
  },
)

/* istanbul ignore next */
if (process.env.NODE_ENV !== 'test') main(cli)

export async function main(cli: meow.Result): Promise<void> {
  manage(cli.flags.config, { dryrun: cli.flags.dryrun }).then(res => {
    if (res.status === 'ok') {
      console.log(res.message)
    } else {
      console.warn(res.message)
    }
  })
}
