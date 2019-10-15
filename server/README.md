# server

> Pricing: we only care about configured repositories. Depending on the number of configured repositories you have in the labelsync.yml, you have to subscribe to a matching plan. (This way, we don't have to store any information about the installed repositories.)

!TODO: Figure out how a Github app can check which repositories it can access.

### Events we'll be listening to:

#### `push`

> push on `master` should trigger a complete sync of the labels accross all configured repositories.

_*Uses:*_

1. `configurationValidation` (correct configuration should trigger a sync, incorrect should (eventually) open an issue with an explanation of the encountered problem.)
2. `handleLabelSync` which sync labels in a repository
3. `handleSiblingsSync` which handles siblings sync in a repository.
4. `handleRenameLabels` which would rename labels.

#### `check_suite`, `check_run`

#### `github_app_authorization`

> Triggered when someone revokes their authorization of a GitHub App.

>
