import React from 'react'
import { NOTION_DOCS_URL } from '../constants'

export default class Docs extends React.Component {
  componentDidMount() {
    if (window) {
      window.location.href = NOTION_DOCS_URL
    }
  }
  render() {
    return (
      <div className="w-full h-full flex flex-col justify-center">
        <title>GitHub LabelSync - Documentation</title>
        <img
          className="h-7 block mx-auto"
          src="/img/logos/labelsync.svg"
          alt="LabelSync Logo"
        />
      </div>
    )
  }
}
