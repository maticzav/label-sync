import ReactGA, { EventArgs } from 'react-ga'

export const GA_TRACKING_ID: string = process.env.GA_ID!

export function init() {
  ReactGA.initialize(GA_TRACKING_ID)
}

export const pageview = (url: string) => {
  if (url === '/') {
    ReactGA.set({ page_title: 'home', page_path: url })
    ReactGA.pageview(url)
    return
  } else if (url.startsWith('/subscribe')) {
    ReactGA.set({ page_title: 'subscribe', page_path: url })
    ReactGA.pageview(url)
    return
  } else {
    ReactGA.set({ page_title: 'other', page_path: url })
    ReactGA.pageview(url)
    return
  }
}

export const sectionreached = ({ name }: { name: string }) => {
  // trigger event
  ReactGA.event({
    action: name,
    category: 'section',
    label: 'web',
    value: 1,
  })
}

export interface GAEvent {
  action: string
  category: string
  label: string
  value: number
}

export const event = (args: EventArgs) => {
  ReactGA.event(args)
}
