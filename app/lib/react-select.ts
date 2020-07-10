/**
 * Converts object with name property into react-select option.
 */
export function nameableToOptions<T extends { name: string }>(
  val: T,
): { value: T; label: string } {
  return {
    value: val,
    label: val.name,
  }
}
