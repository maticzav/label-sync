import { Redirect } from 'components/Redirect'
import React from 'react'

import { NOTION_PRIVACY_TOS_URL } from '../constants'

export default class Privacy extends React.Component {
  componentDidMount() {
    if (window) {
      window.location.href = NOTION_PRIVACY_TOS_URL
    }
  }
  render() {
    return <Redirect title="GitHub LabelSync - Privacy Policy" />
  }
}
