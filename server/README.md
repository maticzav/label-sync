# server

> Pricing: we only care about configured repositories. Depending on the number of configured repositories you have in the labelsync.yml, you have to subscribe to a matching plan. (This way, we don't have to store any information about the installed repositories.)

## Milestones

### Version 0.1 (31.10.2019)

> LabelSyncing, Configuration verification.

- [ ] `CLI`
- [ ] `push` event
- [ ] `checks_run`

### Version 0.2

- [ ] `issues.labeled` event
- [ ] `label.created` event

### Version 0.3

- [ ] `siblings`
- [ ] `hooks`

!TODO: Figure out how a Github app can check which repositories it can access.

https://developer.github.com/v3/apps/installations/#list-repositories

## CLI

> LabelSync will come with a CLI tool and library, which will help organisations sync their labels across repositories.

### Features

- `typesafe configuration`

## Events we'll be listening to:

#### `push`

>

Push on `master` should trigger a complete sync of the labels accross all configured repositories.

_*Uses:*_

1. `configurationValidation` (correct configuration should trigger a sync, incorrect should (eventually) open an issue with an explanation of the encountered problem.)
2. `handleLabelSync` which sync labels in a repository
3. `handleSiblingsSync` which handles siblings sync in a repository.
4. `handleRenameLabels` which would rename labels.

#### `check_run`, `check_run.rerequested`

> Triggered when a check run is created, rerequested, completed, or has a requested_action.

It would be great if we'd eventually support checks. What I have in mind is making a check pass when the configuration is valid, and invalidating it when it's no longer valid.

_*Uses:*_

1. `configurationValidation` to determine whether a configuraiton is valid or not
2. `createCheckRun` to provide feedback to changes.

_*Useful links:*_

- https://help.github.com/en/articles/about-status-checks#checks
- https://developer.github.com/v3/checks/runs/#create-a-check-run

#### `check_suite.requested`, `check_suite.rerequested`

> Triggered when a check suite is completed, requested, or rerequested.

Same as `check_run` event. We'll eventually create check runs to indicate whether the configuration is valid or not.

Check `check_run` event above for _*Useful links*_ and _*Uses*_.

#### `commit_comment`

> Triggered when a commit comment is created.

We could eventually support rich user integrations. An example of this would be label renames.

```md
I have renamed these labels:

- bug:kind/bug
- old:new
```

_*Uses:*_

1. `renameLabels` which would handle label renaming.

#### `issues.labeled`

> Triggered when an issue is opened, edited, deleted, transferred, pinned, unpinned, closed, reopened, assigned, unassigned, labeled, unlabeled, locked, unlocked, milestoned, or demilestoned.

When an issue is labeled we should trigger all hooks that are assigned to a particular label,
and add all siblings that a particular label has.

_*Uses:*_

1. `validateConfiguration` to load configuration from master repository. (Should skip any action if the configuration is invalid.)
2. `handleSiblingsSync` to sync siblings of a particular label.

#### `label.created`, `label.deleted`, `label.edited`

> Triggered when a repository's label is created, edited, or deleted.

We should make sure no new label is created in `strict` repositories, and that no label
specified in the `labelsync.yml` is missing from a repository.

TODO: What should we do if a label is deleted? Should we eventually have evidence of
all labels internally and reassign a particular label to all issues it was removed from?

#### `marketplace_purchase`

> Triggered when someone purchases a GitHub Marketplace plan, cancels their plan, upgrades their plan (effective immediately), downgrades a plan that remains pending until the end of the billing cycle, or cancels a pending plan change.

We should store information about the plan of each particular subscribed organisation.
This information would come in play when validating a configuration.

_*Useful links:*_

- https://developer.github.com/marketplace/integrating-with-the-github-marketplace-api/github-marketplace-webhook-events/

#### `membership`

> Triggered when a user is added or removed from a team. Organization hooks only.

Eventually, we should differentiate plans depending on the number of members a particular organization has. When membership event is triggered we should determine whether the current plan still matches
the requirements of the organisation and create issues accordingly.

#### `organization`

> Triggered when an organization is deleted and renamed, and when a user is added, removed, or invited to an organization. Organization hooks only.

Related to `membership` event.

#### `pull_request.opened`, `pull_request.labeled`

>     Triggered when a pull request is assigned, unassigned, labeled, unlabeled, opened, edited, closed, reopened, synchronize, ready_for_review, locked, unlocked or when a pull request review is requested or removed.

We should check configuration and create a message indicating whether a pull request brings valid changes to existing configuration, and what these changes are.

_*Uses:*_

1. `configurationValidation` to determine the validity of a configuration.
2. `createCheckRun`/`createComment` to provide feedback.

#### `github_app_authorization`

> Triggered when someone revokes their authorization of a GitHub App.

>
