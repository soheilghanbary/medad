import { ORPCError, os } from '@orpc/server'
import { getSession } from 'shared/helpers'

export const authed = os.use(async ({ context, next }) => {
  const session = await getSession()
  if (!session)
    throw new ORPCError('UNAUTHORIZED', {
      message: 'Unauthorized',
    })
  return next({ context: { ...context, userId: session.user.id } })
})
