<div align="center">

<a href="label-sync.com"><img src="assets/logo_large.png" width="400" /></a>

</div>

[![CircleCI](https://circleci.com/gh/maticzav/label-sync/tree/master.svg?style=shield)](https://circleci.com/gh/maticzav/label-sync/tree/master)
[![codecov](https://codecov.io/gh/maticzav/label-sync/branch/master/graph/badge.svg)](https://codecov.io/gh/maticzav/label-sync)
[![npm version](https://badge.fury.io/js/label-sync.svg)](https://badge.fury.io/js/label-sync)

> Managing multiple repositories is hard. LabelSync helps you manage labels across your repository fleet.

## Why LabelSync?

While working at Prisma, I discovered that many companies struggle with repository organisation. In particular, companies struggle with managing labels across multiple repositories in their organisation.

My vision is to develop the best in class software that would help companies triage issues and pull requests, and simplify the use of labels.

## Features and Quirks of LabelSync

Label Sync helps you sync Github labels across multiple repositories:

- 🛰 **Centralised management**: Handle multiple repositories from a central configuration.
- 👮 **Restricts unconfigured labels**: Prevent adding new labels that don't fit into your workflow.
- 🐣 **Aliases**: Quickly rename old labels to a new label.
- 🎢 **Siblings**: Create workflows with labels.

## Getting Starterd

1. Start by installing the [LabelSync Manager Github Application](https://github.com/apps/labelsync-manager). I recommend you install it across your entire fleet - LabelSync won't modify repositories that you haven't configured.
2. LabelSync Manager created a `<org>-labelsync` repository for you, where `<org>` represents the name of your organisation or account.
   That's where your configuration resides. We've included the labels and repository configurations that we found most useful and encourage you to use them as your starting point.

> :construction: NOTE: It seems like scaffolding for personal accounts doesn't work as expected due to some Github Application endpoint limitations. If you can help, please comment in the [issue](https://github.com/maticzav/label-sync/issues/208).

## Configuring LabelSync

We configure all repositories that LabelSync manager from a single repository. LabelSync Manager already created that repository for you during installation. In that repository, there's a file `labelsync.yml`. Whenever you change it, Label Sync is going to try to sync labels across your organisation.

In the end, Label Sync only cares about that `labelsync.yml` file. However, to make configuration more approachable, I've created helper packages that allow you to use the power of your prefered language and generate `labelsync.yml` using a library.

You may configureusing:

- **YAML**
- **TypeScript**
- **Python** (coming soon)
- **Go** (coming soon)

Check the docs below for documentation on how to do it.

### LabelSync configuration libraries

#### YAML

Create a `repos` object at the root of the file and nest names of the repositories inside.

Each repository accepts two properties:

- an optional `config` parameter that tells LabelSync how to sync that particular repository. Set `removeUnconfiguredLabels` to `true` to, well, remove all unconfigured labels.
- an object of labels

Each label accepts:

- `color` property in HEX format (with or without "#"),
- an optional `description`
- an `alias` property that accepts a list of labels that LabelSync should rename to the new label.
- `siblings` that tell LabelSync which labels it should add to the issue or pull request additionally when a particular label is assigned to it. All `siblings`, however, need to be configured - you cannot reference a "third-party" label.

```yml
repos:
  graphql-shield:
    config:
      removeUnconfiguredLabels: true
    labels:
      kind/bug:
        color: ff3311
      bug/0-needs-reproduction:
        color: ff3311
        siblings: ['kind/bug'] # when you add "bug/0-needs-reproduction" to issue LabelSync will add "kind/bug" as well.
      kind/question:
        color: '#c5def5'
        alias: ['question'] # we'll rename "question" label to "kind/question".
      stale:
        color: ff69b4
        description: Label indicating Stale issue.
```

#### TypeScript

> :construction: NOTE: TypeScript library is still under development and subject to change without notice.

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
import { configuration, repository, label, make } from 'label-sync'

const bug = label('#ff32bb')
const question = label('#c5def5')

/* Setup repository configuration */
const labelSync = repository({
  strict: true,
  lablels: {
    'kind/bug': bug,
    'kind/question': question,
  },
})

/* Setup LabelSync configuration */
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

## F.A.Q

#### Is LabelSync free?

LabelSync will remain free while in beta.

#### I have a problem but don't know who to ask.

Please open up an issue describing your problem, or send us an email to <a href="mailto:support@label-sync.com">support@label-sync.com</a>.

#### I have an idea/problem that LabelSync could solve.

Please reach out to <a href="mailto:matic@label-sync.com">matic@label-sync.com</a>. I'd be more than happy to chat about LabelSync with you!

## License

BSD 3-Clause, see the [LICENSE](./LICENSE) file.
