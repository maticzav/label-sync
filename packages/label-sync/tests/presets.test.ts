import * as ls from '../src'

describe('presets:', () => {
  test('works', () => {
    const repo = ls.repo({
      config: {
        removeUnconfiguredLabels: true,
      },
      labels: [
        ls.type('bug', '#ff0022'),
        ls.note('bug', '#ff0022'),
        ls.impact('bug', '#ff0022'),
        ls.effort('bug', '#ff0022'),
        ls.needs('bug', '#ff0022'),
        ls.scope('bug', '#ff0022'),
        ls.community('bug', '#ff0022'),
      ],
    })

    expect(repo).toMatchSnapshot()
  })
})
