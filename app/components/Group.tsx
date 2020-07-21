import React from 'react'
import Select from 'react-select'

import { Label, Repository, LabelGroup } from '../lib/models'
import { nameableToOptions } from '../lib/react-select'
import LabelPicker from './LabelPicker'

export type LabelGroupProps = {
  group: LabelGroup
  /* Linking Options */
  options: {
    labels: Label[]
    repositories: Repository[]
  }
  /* Events */
  onNameChange?: (name: string) => void
  onColorChange?: (color: string) => void
  onDescriptionChange?: (description: string) => void
  onRepositoriesChange?: (repos: Repository[]) => void
  onGroupsChange?: (groups: LabelGroup[]) => void
}

/* View method of the label. */
export default function LabelView(props: LabelGroupProps) {
  return (
    <div className="p-3 bg-white shadow-sm rounded-md">
      {/* Name */}
      <div className="p-2 flex flex-row">
        <h4 id="repo-name" className="inline-block">
          {props.group.name}
        </h4>
      </div>
      {/* Labels */}
      <div className="p-2">
        <label
          htmlFor="group-labels"
          className="block text-sm font-medium leading-5 text-gray-700"
        >
          Labels
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <LabelPicker
            id="group-labels"
            options={props.options.labels}
            selected={[]}
          ></LabelPicker>
        </div>
      </div>
      {/* Repositories */}
      <div className="p-2">
        <label
          htmlFor="label-repositories"
          className="block text-sm font-medium leading-5 text-gray-700"
        >
          Repositories
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <Select
            id="label-repositories"
            options={props.options.repositories.map(nameableToOptions)}
            isMulti
          ></Select>
        </div>
      </div>
    </div>
  )
}
