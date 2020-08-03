import React from 'react'

export default class Documentation extends React.Component {
  componentDidMount() {
    if (window) {
      window.location.href =
        'https://www.notion.so/LabelSync-Docs-7c004894c8994ecfbd9fb619d2417210'
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
