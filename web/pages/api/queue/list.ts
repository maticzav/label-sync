import type { NextApiRequest, NextApiResponse } from 'next'
import { withAuth, WithAuthProp, users } from '@clerk/nextjs/api'

import * as tasks from 'lib/tasks'

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

  const list = await tasks.shared.list()

  res.status(200).json({ list })
})
