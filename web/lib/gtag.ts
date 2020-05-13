import ReactGA from 'react-ga'

export const GA_TRACKING_ID = 'UA-104411218-2'

export function init() {
  ReactGA.initialize(GA_TRACKING_ID)
  ReactGA.pageview('/')
}

export const pageview = (url: string) => {
  ReactGA.set({ page: url })
  ReactGA.pageview(url)
}

export interface GAEvent {
  action: string
  category: string
  label: string
  value: number
}

export const event = ({ action, category, label, value }: GAEvent) => {
  ReactGA.event({
    action,
    category,
    value,
    label,
  })
}
