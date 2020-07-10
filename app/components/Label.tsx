import React from 'react'
import { TwitterPicker } from 'react-color'
import Select from 'react-select'

import { Label, Repository, LabelGroup } from '../lib/models'
import { nameableToOptions } from '../lib/react-select'

export type LabelProps = {
  label: Label
  /* Meta information */
  options: { repositories: Repository[]; groups: LabelGroup[] }
  /* Events */
  onNameChange?: (name: string) => void
  onColorChange?: (color: string) => void
  onDescriptionChange?: (description: string) => void
  onRepositoriesChange?: (repos: Repository[]) => void
  onGroupsChange?: (groups: LabelGroup[]) => void
}

/* View method of the label. */
export default function LabelView(props: LabelProps) {
  return (
    <div className="p-3 bg-white shadow-sm rounded-md">
      {/* Preview */}
      <div className="py-2 px-3">
        <h2
          className="inline-block rounded-full px-3 text-sm"
          style={{ backgroundColor: props.label.color }}
        >
          {props.label.name}
        </h2>
      </div>
      {/* Name and Color */}
      <div className="p-2 flex flex-row">
        <div className="p-1">
          <label
            htmlFor="label-name"
            className="block text-sm font-medium leading-5 text-gray-700"
          >
            Name
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              id="label-name"
              type="text"
              className="form-input block w-full sm:text-sm sm:leading-5"
              placeholder="kind/features"
              value={props.label.name}
              onChange={(e) => props.onNameChange?.(e.target.value)}
            />
          </div>
        </div>
        <div className="p-1">
          <label
            className="block uppercase tracking-wide text-gray-700 text-xs font-bold mb-2"
            htmlFor="label-color"
          >
            Color
          </label>
          <button
            className="inline-block rounded-full"
            style={{ backgroundColor: props.label.color }}
          ></button>
          {/* <TwitterPicker
            className="absolute inset-x-3 inset-y-1"
            triangle="top-right"
            color={props.label.color}
            onChange={(e) => props.onColorChange?.(e.hex)}
          ></TwitterPicker> */}
        </div>
      </div>
      {/* Description */}
      <div className="p-2">
        <label
          htmlFor="label-description"
          className="block text-sm font-medium leading-5 text-gray-700"
        >
          Description
        </label>
        <div className="mt-1 relative rounded-md shadow-sm">
          <textarea
            id="label-description"
            className="form-input block w-full sm:text-sm sm:leading-5"
            placeholder="Issues related to features."
            value={props.label.description}
            onChange={(e) => props.onDescriptionChange?.(e.target.value)}
          />
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
            options={props.options.groups.map(nameableToOptions)}
            isMulti
          ></Select>
        </div>
      </div>
    </div>
  )
}
