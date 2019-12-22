import { isLabel, isLabelDefinition } from '../src/github'

describe('github:', () => {
  test('isLabel', () => {
    expect(
      isLabel({
        name: 'bug',
        color: 'ff',
        description: 'desc',
      })({
        name: 'bug',
        description: 'desc',
        color: 'ff',
      }),
    ).toBeTruthy()

    expect(
      isLabel({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug',
        description: 'desc',
        color: 'ff',
      }),
    ).toBeFalsy()

    expect(
      isLabel({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug/0',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeFalsy()
  })

  test('isLabelDefinition', () => {
    expect(
      isLabelDefinition({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeTruthy()

    expect(
      isLabelDefinition({
        name: 'bug',
        color: '00',
        description: 'desc',
      })({
        name: 'bug/0',
        description: 'this is a bug',
        color: 'ff',
      }),
    ).toBeFalsy()
  })
})
