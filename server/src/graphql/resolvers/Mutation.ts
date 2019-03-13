import { mutationType } from 'nexus'

export const Mutation = mutationType({
  definition(t) {
    t.string('requestAuthenticationTicket', {
      resolve: async (parent, args, ctx) => {
        return 'abc'
      },
    })
  },
})
