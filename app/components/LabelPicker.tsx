import React from 'react'
import Select from 'react-select'

import { Label } from '../lib/models'
import { nameableToOptions } from '../lib/react-select'

export type LabelPickerProps = {
  /*  */
  options: Label[]
  selected: string[]
  /* Pass through */
  id?: string
  className?: string
}

export default function LabelPicker(props: LabelPickerProps) {
  return (
    <Select
      id={props.id}
      className={props.className}
      value={props.selected}
      options={props.options.map(nameableToOptions)}
      isMulti
    ></Select>
  )
}
