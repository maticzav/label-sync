import { DateTime } from 'luxon'

import { Source } from '../lib/source'

type Key = {
  id: string
}
type Value = {
  ttl: DateTime
}

/**
 * Lets you offload tasks to a separate service.
 */
export class TasksSource extends Source<Key, Value> {
  async fetch(key: Key): Promise<Value | null> {
    return { ttl: DateTime.now().plus({ days: 1 }) }
  }

  identify(key: Key): string {
    return key.id
  }
}
