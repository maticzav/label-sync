/**
 * Makes a type check that is only valid when all cases of a switch
 * statement have been convered.
 */
export class ExhaustiveSwitchCheck extends Error {
  constructor(val: never) {
    super(`Unreachable case: ${JSON.stringify(val)}`)
  }
}
