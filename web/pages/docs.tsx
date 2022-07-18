import { Redirect } from 'components/Redirect'
import React from 'react'

import { NOTION_DOCS_URL } from '../constants'

export default class Docs extends React.Component {
  componentDidMount() {
    if (window) {
      window.location.href = NOTION_DOCS_URL
    }
  }
  render() {
    return <Redirect title="GitHub LabelSync - Documentation" />
  }
}
