import { withAuth, WithAuthProp, users } from '@clerk/nextjs/api'
import type { NextApiRequest, NextApiResponse } from 'next'
import * as z from 'zod'

import * as tasks from 'lib/tasks'

const schema = z.discriminatedUnion('kind', [
  z.object({
    kind: z.literal('onboard_org'),
    ghInstallationId: z.number(),
    org: z.string(),
    accountType: z.string(),
  }),
  z.object({
    kind: z.literal('sync_org'),
    ghInstallationId: z.number(),
    isPaidPlan: z.boolean(),

    org: z.string(),
  }),
  z.object({
    kind: z.literal('sync_repo'),
    ghInstallationId: z.number(),
    isPaidPlan: z.boolean(),

    repo: z.string(),
    org: z.string(),
  }),
  z.object({
    kind: z.literal('dryrun_config'),
    ghInstallationId: z.number(),
    isPaidPlan: z.boolean(),

    org: z.string(),
    pr_number: z.number(),
  }),
  z.object({
    kind: z.literal('add_siblings'),
    ghInstallationId: z.number(),
    isPaidPlan: z.boolean(),

    repo: z.string(),
    org: z.string(),

    issue_number: z.number(),
    label: z.string(),
  }),
  z.object({
    kind: z.literal('check_unconfigured_labels'),
    ghInstallationId: z.number(),
    isPaidPlan: z.boolean(),

    repo: z.string(),
    org: z.string(),

    label: z.string(),
  }),
])

export default withAuth(async (req: WithAuthProp<NextApiRequest>, res: NextApiResponse) => {
  if (!req.auth.userId) {
    res.status(403).json({ message: 'Unauthorized' })
    return
  }

  const user = await users.getUser(req.auth.userId)
  if (!user.publicMetadata['is_admin']) {
    res.status(403).json({ message: 'Unauthorized' })
    return
  }

  const parsed = schema.safeParse(JSON.parse(req.body))

  if (!parsed.success) {
    res.status(400).json({ message: parsed.error.message })
    return
  }

  const id = await tasks.shared.push({
    ...parsed.data,
    dependsOn: [],
  })

  res.status(200).json({ id })
})
