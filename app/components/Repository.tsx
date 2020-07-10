import React from 'react'
import Select from 'react-select'

import { Label, Repository, LabelGroup } from '../lib/models'

export type RepositoryProps = {
  repository: Repository
  /* Linking Options */
  options: {
    labels: Label[]
    groups: LabelGroup[]
  }
  /* Events */
  onNameChange?: (name: string) => void
  onColorChange?: (color: string) => void
  onDescriptionChange?: (description: string) => void
  onRepositoriesChange?: (repos: Repository[]) => void
  onGroupsChange?: (groups: LabelGroup[]) => void
}

/* View method of the label. */
export default function LabelView(props: RepositoryProps) {
  /* Calculate react-select options */
  const labelOptions = props.options.labels.map((label) => ({
    value: label,
    label: label.name,
  }))
  const groupOptions = props.options.groups.map((group) => ({
    value: group,
    label: group.name,
  }))

  return (
    <div className="p-3 bg-white shadow-sm rounded-md">
      {/* Name */}
      <div className="p-2 flex flex-row">
        <h4 id="repo-name" className="inline-block">
          {props.repository.name}
        </h4>
      </div>
      {/* Labels */}
      <div className="p-2">
        <label
          htmlFor="label-repositories"
          className="block text-sm font-medium leading-5 text-gray-700"
        >
          Labels
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <Select
            id="label-repositories"
            options={labelOptions}
            isMulti
          ></Select>
        </div>
      </div>
      {/* Groups */}
      <div className="p-2">
        <label
          htmlFor="label-repositories"
          className="block text-sm font-medium leading-5 text-gray-700"
        >
          Groups
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <Select
            id="label-repositories"
            options={groupOptions}
            isMulti
          ></Select>
        </div>
      </div>
    </div>
  )
}
