<p align="center"><img src="media/logo.png" width="300" /></p>

# label-sync

[![CircleCI](https://circleci.com/gh/maticzav/label-sync/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/label-sync/tree/master)
[![Coverage Status](https://coveralls.io/repos/github/maticzav/label-sync/badge.svg?branch=master)](https://coveralls.io/github/maticzav/label-sync?branch=master)
[![npm version](https://badge.fury.io/js/label-sync.svg)](https://badge.fury.io/js/label-sync)

> A delightful companion to manage Github Labels across multiple repositories.

## Overview

Label Sync helps you sync Github labels across multiple repositories. Using an intuitive API you'll be able to customize repository configuration across all your projects in no time. Besides that, it also features a core package module which can be used to build highly customized workflows.

## Features

- ✂️ **Flexible:** Compatible with JS, TS and JSON configuration.
- 🌈 **Easy to use:** Simply use one of the templates to start!
- 🐶 **Friendly error messages:** Guides you through installation and sync, no magic involved!
- 🌳 **Perfect test coverage:** Maintaining 100% test coverage.
- 💪 **Used by giants:** Used in production by companies like [@prisma](https://prisma.io) or [@graphcms](https://graphcms.com)

## Installation

```bash
npm init label-sync
```

I suggest you use one of the prebuilt configurations as a starting point of your project. You can find more about the templates in the [/examples](https://github.com/maticzav/label-sync/tree/master/examples) folder.

## Configuration

Besides using the core package and building the workflow on your own, you can use a set of perused builders which support JS, JSON and TS configuration options.

### `JSON`

> `json` template

JSON is the most opinionated option and the quickest option to setup Label Sync.
Every value can be configured `globaly` or later changed in each repository scope.

```json
{
  "strict": true,
  "labels": {
    "FAQ": {
      "color": "purple",
      "description": "Frequently asked questions"
    }
  },
  "repositories": [
    "maticzav/*",
    {
      "paths": "maticzav/graphql-*",
      "labels": {
        "extra": "red"
      },
      "strict": false
    }
  ],
  "publish": {
    "branch": "master"
  }
}
```

##### `labels.config.json`

| Parameter      | Type                    | Default | Required |
| -------------- | ----------------------- | ------- | -------- |
| `strict`       | boolean                 | false   | false    |
| `labels`       | Map<name, string/label> | /       | true     |
| `repositories` | Array<glob/repository>  | /       | true     |
| `publish`      | { branch: string}       | /       | false    |

##### `repository`

| Parameter | Type             | Default | Required |
| --------- | ---------------- | ------- | -------- |
| `paths`   | glob string      | /       | true     |
| `strict`  | boolean          | global  | false    |
| `labels`  | Map<name, label> | /       | true     |

##### `label`

| Parameter     | Type   | Default | Required |
| ------------- | ------ | ------- | -------- |
| `color`       | string | /       | true     |
| `description` | string | ""      | false    |

> NOTE: Globs should always include organization name before repository definition, and global definitions can always be overwritten using repository specific configuration.

---

### `JavaScript`

> `javascript` template

JavaScript configuration allows you to employ more complex file structure and perform calculations during setup.

Compared to `JSON`, `JavaScript` doesn't feature globs. Instead, each repository has
to be explicitly added to the sync.

```js
const shield = require('./config/graphql-shield.js')

module.exports = {
  'maticzav/graphql-shield': shield,
  'maticzav/label-sync': {
    labels: {
      bug: 'blue',
      'kind/kudos': {
        description: 'Issues which simply thank for the project.',
        color: 'red',
      },
    },
    strict: true,
  },
}
```

#### Types

```ts
type LabelConfiguration =
  | {
      description?: string
      color: string
    }
  | string

export interface RepositoryConfig {
  labels: { [name: string]: LabelConfiguration }
  strict?: boolean
}

export interface Config {
  [repository: string]: RepositoryConfig
}
```

---

### `TypeScript`

> `typescript` template

TypeScript configuration is very similar to JavaScript one. Atop of gaining complete control over repositories, you also gain type annotations and smart suggestions.

> NOTE: TypeScript configuration relies on `tsconfig.json` and requires a full-blown configuration or repository to run correctly.

```ts
import { Config } from 'label-sync-core'
import { prismaBinding } from './repositories/prisma-binding'
import { graphqlYoga } from './repositories/graphql-yoga'

const config: Config = {
  'prisma/prisma-binding': prismaBinding,
  'prisma/graphql-yoga': {
    labels: {
      bug: 'blue',
      'kind/kudos': {
        description: 'Issues which simply thank for the project.',
        color: 'red',
      },
    },
    strict: false,
  },
}

export default config
```

#### Types

```ts
type LabelConfiguration =
  | {
      description?: string
      color: string
    }
  | string

export interface RepositoryConfig {
  labels: { [name: string]: LabelConfiguration }
  strict?: boolean
}

export interface Config {
  [repository: string]: RepositoryConfig
}
```

## Advanced

Besides providing a delightful syncing tool, Label Sync also features a core package named `label-sync-core`. `label-sync-core` module is extensively used in `typescript`. It exposes two functions, `handleSync` and `generateSyncReport` which can help you build amazing syncing utilities from ground up.

You can read more about them in the [`label-sync-core`](https://github.com/maticzav/label-sync/tree/master/packages/label-sync-core) package README.

## License

MIT @ Matic Zavadlal

```

```
