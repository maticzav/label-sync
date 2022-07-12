import { generateHumanReadablePRReport, generateHumanReadableCommitReport } from '../../src/lib/reports'
import * as reports from '../__fixtures__/reports'

describe('reports', () => {
  for (const report of [reports.strict, reports.failure, reports.nonstrict, reports.unchanged, reports.unconfigured]) {
    test('correcly generates a PR report', () => {
      const message = generateHumanReadablePRReport([report])
      expect(message).toMatchSnapshot()
    })

    test('correctly generates a commit report', () => {
      const message = generateHumanReadableCommitReport([report])
      expect(message).toMatchSnapshot()
    })
  }

  test('correctly combines multiple reports', () => {
    const report = generateHumanReadablePRReport([
      reports.strict,
      reports.nonstrict,
      reports.failure,
      reports.unchanged,
    ])

    expect(report).toMatchSnapshot()
  })
})
