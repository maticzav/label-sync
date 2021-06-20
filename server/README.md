# server

Server only talks to the database. We keep an internal saved state that changes only when a valid new configuration is pushed to the main branch.

```bash
# dev and prod
export POSTGRESQL_URL="postgresql://prisma:prisma@localhost:5433/labelsync"
# only production
export DATADOG_APIKEY=""
export STRIPE_ENDPOINT_SECRET="secret"
```

## Architecture

We keep an internal copy of the configuration that changes whenever end user pushes changes to the main branch of the configuration repository. We validate that configuration and report errors if needed. Once the user pushes a valid configuration, we override the internal one.

All other event handlers, besides push and installation events, should rely on the internal configuration and not on the one in GitHub.

Each configuration is internally stored as active while active and becomes legacy when a newer one is pushed. An asterisk field serves as a default configuration that we store under `default` field. No end configuration should have a `default` configuration. Instead, we replicate the `default` configuration for every end repository.
