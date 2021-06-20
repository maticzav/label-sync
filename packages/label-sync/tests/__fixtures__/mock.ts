import * as t from '../../../../server/src/config/types'

/**
 * Populates the label with empty values.
 */
export function label(label: Partial<t.LSCLabel>): t.LSCLabel {
  return {
    color: label.color!,
    description: undefined,
    siblings: [],
    alias: [],
  }
}
