import { mapEntries, mapEntriesAsync, Dict, mapKeys } from '../../src/data/map'

describe('map', () => {
  test('mapEntries', () => {
    const map = objectToMap({
      apple: 300,
      microsoft: 200,
      'label-sync': 10,
    })

    const expected = objectToMap({
      apple: 310,
      microsoft: 210,
      'label-sync': 20,
    })

    // Test
    expect(mapEntries(map, (val) => val + 10)).toEqual(expected)
  })

  test('mapEntriesAsync', async () => {
    const wait = (ms: number) =>
      new Promise((resolve) => setTimeout(resolve, ms))

    const map = objectToMap({
      apple: 300,
      microsoft: 200,
      'label-sync': 10,
    })

    const expected = objectToMap({
      apple: 310,
      microsoft: 210,
      'label-sync': 20,
    })

    // Test

    const dict = await mapEntriesAsync(map, async (val) =>
      wait(10).then(() => val + 10),
    )

    expect(dict).toEqual(expected)
  })

  test('mapKeys', () => {
    const map = objectToMap({
      apple: 300,
      microsoft: 200,
      'label-sync': 10,
    })

    const expected = objectToMap({
      APPLE: 300,
      MICROSOFT: 200,
      'LABEL-SYNC': 10,
    })

    // Test

    expect(mapKeys(map, (key) => key.toUpperCase())).toEqual(expected)
  })
})

// MARK: - Utils

/**
 * Converts an object to a map.
 */
function objectToMap<V>(o: { [key: string]: V }): Map<string, V> {
  const map = new Map<string, V>()

  for (const key in o) {
    map.set(key, o[key])
  }

  return map
}
