import { mapEntries, mapEntriesAsync, Dict, mapKeys } from '../../src/data/dict'

describe('dict:', () => {
  test('mapEntries', () => {
    expect(
      mapEntries(
        {
          apple: 300,
          microsoft: 200,
          'label-sync': 10,
        },
        val => val + 10,
      ),
    ).toEqual({
      apple: 310,
      microsoft: 210,
      'label-sync': 20,
    })
  })

  test('mapEntriesAsync', async () => {
    const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

    const dict: Dict<number> = await mapEntriesAsync(
      {
        apple: 300,
        microsoft: 200,
        'label-sync': 10,
      },
      async val => wait(10).then(() => val + 10),
    )

    expect(dict).toEqual({
      apple: 310,
      microsoft: 210,
      'label-sync': 20,
    })
  })

  test('mapKeys', () => {
    expect(
      mapKeys(
        {
          apple: 300,
          microsoft: 200,
          'label-sync': 10,
        },
        key => key.toUpperCase(),
      ),
    ).toEqual({
      APPLE: 300,
      MICROSOFT: 200,
      'LABEL-SYNC': 10,
    })
  })
})
