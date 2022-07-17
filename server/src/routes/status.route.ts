import { Router } from 'express'

import { Sources } from '../lib/sources'

/**
 * Routes associated with Stripe Webhooks.
 */
export const status = (router: Router, sources: Sources) => {
  router.get('/healthz', async (req, res) => {
    res.send('OK')
  })
}
