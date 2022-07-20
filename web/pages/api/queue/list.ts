import type { NextApiRequest, NextApiResponse } from 'next'
import { users, requireAuth, RequireAuthProp } from '@clerk/nextjs/api'

import * as tasks from 'lib/tasks'

export default requireAuth(async (req: RequireAuthProp<NextApiRequest>, res: NextApiResponse) => {
  const user = await users.getUser(req.auth.userId)
  console.log(user)

  if (!user.publicMetadata['is_admin']) {
    res.status(403).json({ message: 'Unauthorized, You Need Admin Privliges!' })
    return
  }

  const list = await tasks.shared.list()

  res.status(200).json({ list })
})
