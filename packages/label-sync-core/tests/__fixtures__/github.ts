import { GithubLabel } from '../../src'

export const githubLabels: GithubLabel[] = [
  {
    name: 'bug/no-reproduction',
    color: '333333',
    description: '',
    default: false,
  },
  {
    name: 'basic',
    color: 'f266f4',
    description: '',
    default: false,
  },
  {
    name: 'kind/bug',
    color: '333333',
    description: '',
    default: false,
  },
]

export interface GithubClientMockOptions {
  status?: number
  labels?: GithubLabel[]
}

const defaultClientMock: GithubClientMockOptions = {
  status: 200,
  labels: githubLabels,
}

export const githubClient = (providedOptions?: GithubClientMockOptions) => {
  const options = Object.assign({}, defaultClientMock, providedOptions || {})

  return {
    issues: {
      createLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      updateLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      deleteLabel: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      listLabelsForRepo: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
      addLabels: jest
        .fn()
        .mockResolvedValue({ status: options.status, data: options.labels }),
    },
  }
}
