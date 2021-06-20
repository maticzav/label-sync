import { Handler } from '../event'

import { handler as installation } from './installation'
import { handler as label } from './label'
import { handler as pullrequest } from './pullrequest'
import { handler as push } from './push'
import { handler as repository } from './repository'

/**
 * Aggregates all the events.
 */
export { handler as installation } from './installation'
export { handler as label } from './label'
export { handler as pullrequest } from './pullrequest'
export { handler as push } from './push'
export { handler as repository } from './repository'

export const handlers: Handler[] = [
  installation,
  label,
  pullrequest,
  push,
  repository,
]
