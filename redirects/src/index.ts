import { NowRequest, NowResponse } from '@now/node'

import { Dict, withDefault } from './utils'

type Redirect = { code: number; target: string }
type Redirects = { '*': Redirect } & Dict<Redirect>

/**
 * A collection of hostnames and their redirects.
 */
/* istanbul ignore next */
const redirects: Redirects = {
  '*': {
    code: 302,
    target: 'https://github.com/maticzav/label-sync',
  },
  install: {
    code: 302,
    target: 'https://github.com/apps/labelsync-manager',
  },
}

/**
 * Performs a redirection.
 *
 * @param hostaname
 * @param res
 */
function redirect(hostaname: keyof Redirects, res: NowResponse): NowResponse {
  const { target, code } = withDefault(redirects['*'], redirects[hostaname])

  console.log(`Redirecting ${hostaname} to ${target}`)

  res.setHeader('Location', target)
  res.status(code)
  return res.send('Redirecting...')
}

/**
 * Serverless function.
 */
export default (req: NowRequest, res: NowResponse) => {
  const hostname = req.headers.host

  /* istanbul ignore next */
  if (!hostname) {
    return redirect('*', res)
  }

  return redirect(hostname, res)
}
