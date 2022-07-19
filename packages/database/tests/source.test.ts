import { DateTime } from 'luxon'
import { Source } from '../src/lib/source'
import { sleep } from './__fixtures__/utils'

class MockSource extends Source<string, { ttl: DateTime; time: DateTime; value: string }> {
  private data: { [key: string]: string } = {}

  constructor(data: { [key: string]: string }) {
    super(5, 5)
    this.data = data
  }

  public async fetch(
    key: string,
  ): Promise<{ ttl: DateTime; time: DateTime; value: string } | null> {
    if (key in this.data) {
      return {
        ttl: DateTime.now().plus({ milliseconds: 5 }),
        value: key,
        time: DateTime.now(),
      }
    }

    return null
  }

  public identify(key: string): string {
    return key
  }

  public invalidate(key: string): void {
    super.invalidate(key)
  }

  public enqueue(
    fn: (self: Source<string, { ttl: DateTime; time: DateTime; value: string }>) => Promise<void>,
  ): void {
    super.enqueue(fn)
  }
}

describe('source', () => {
  test('fetches the data with a key', async () => {
    const source = new MockSource({
      foo: 'bar',
    })

    expect(await source.get('foo')).not.toBeNull()
    expect(await source.get('qux')).toBeNull()

    source.dispose()
  })

  test('looksup data in the cache', async () => {
    const source = new MockSource({ foo: 'bar' })

    expect(source.lookup('foo')).toBeNull()
    await source.get('foo')
    expect(source.lookup('foo')).not.toBeNull()

    source.dispose()
  })

  test('clears the cache', async () => {
    const source = new MockSource({
      foo: 'bar',
    })

    const firstLookup = await source.get('foo')
    const start = DateTime.now()

    expect(firstLookup?.time! <= start).toBeTruthy()

    await sleep(10)

    const secondLookup = await source.get('foo')
    expect(secondLookup?.time! > start).toBeTruthy()

    source.dispose()
  })

  test('invalidates the item with a key', async () => {
    const source = new MockSource({
      foo: 'bar',
    })

    const lookup = await source.get('foo')
    expect(lookup).not.toBeNull()

    const time = DateTime.now()

    expect(lookup?.time! <= time).toBeTruthy()

    source.invalidate('foo')
    const refetched = await source.get('foo')

    expect(refetched?.time! >= time).toBeTruthy()

    source.dispose()
  })

  test('enqueues tasks and processes them concurrently', async () => {
    const source = new MockSource({})

    const ref: { concurrent: number } = { concurrent: 0 }
    const trace: number[] = []

    for (let index = 0; index < 7; index++) {
      source.enqueue(async () => {
        trace.push(ref.concurrent)
        ref.concurrent++
        await sleep(30)
        ref.concurrent--
      })
    }

    await sleep(100)

    source.dispose()

    // NOTE: Tasks are first completed (i.e. concurrency decreases)
    //       and after that we start the next one.
    expect(trace).toEqual([0, 1, 2, 3, 4, 4, 4])
  })
})
