<p align="center"><img src="media/logo.png" width="300" /></p>

# LabelSync

[![CircleCI](https://circleci.com/gh/maticzav/label-sync/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/label-sync/tree/master)
[![codecov](https://codecov.io/gh/maticzav/label-sync/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/label-sync)
[![npm version](https://badge.fury.io/js/label-sync.svg)](https://badge.fury.io/js/label-sync)

> Managing multiple repositories is hard. LabelSync helps you manage labels across your repository fleet.

## Overview

Label Sync helps you sync Github labels across multiple repositories. Using an intuitive API you'll be able to customize repository configuration across all your projects in no time.

## Installation

Start by installing the LabelSync Manager Github Application. We recommend you install it across your entire fleet - LabelSync won't modify repositories that you haven't configured.

> Install [LabelSync Manager Github Application](https://github.com/apps/labelsync-manager).

LabelSync manager should've created a `<org>-labelsync` repository for you. That's where your configuration resides. We've included the labels and repository configurations that we found most useful and encourage you to use them as your starting point.

## Configuring LabelSync

We configure all repositories managed by LabelSync from a single repository. LabelSync Manager already created it during installation.

LabelSync comes with a utility library `label-sync` that allows you to leverage the power of TypeScript to compose configuration for your fleet. Alternatively, you can write `labelsync.yml` configuration manually.

#### Using TypeScript utility library

`label-sync` library comes pre-packed in your configuration repository. It exposes three main constructors: `configuration`, `repository`, and `label`.

We've already included some of them in your starting template. To add new ones follow these guidelines:

```ts
function configuration({
  /* Repositories represent a repo-name:config dictionary */
  repositories: Dict<Repository>
}): Configuration

function repository({
  /* Strict option determines whether LabelSync should allow additional labels or limit available ones to your configuration */
  strict?: boolean,
  /* Represents dictionary of label-name:config configurations */
  labels: Dict<Label>
})

function label(
  /* Label Color */
  string |
  /* Full blown Label configuration */
  { color: string
  , description: string
  }
)
```

> NOTE: Setting strict to `true` will delete unconfigured labels.

You can reuse `label` and `repository` configurations anywhere in your configuration file.

In the end, LabelSync still relies on `labelsync.yml` file. To generate it, run `make`.

```ts
import { configuration, make } from 'label-sync'
import { standard } from './repositories/standard'

const config = configuration({
  repositories: {
    'label-sync': standard,
  },
})

/* Generates the configuration file. */
make({
  configs: [config],
})
```

#### Manually configuring LabelSync using YAML file

To configure LabelSync using YAML file, create `labelsync.yml` file in the root of your configuration repository.

```yml
repos:
  graphql-shield:
    strict: true
    labels:
      kind/bug:
        color: ff3311
      kind/question:
        color: '#c5def5'
      stale:
        color: ff69b4
        description: Label indicating Stale issue.
```

## License

Matic Zavadlal
