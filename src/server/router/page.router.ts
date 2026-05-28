import { and, asc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { page } from '../db/schema'
import { authed } from './context'

const PageIdInput = z.object({
  id: z.string().min(1),
})

const CreatePageInput = z.object({
  title: z.string().min(1).max(255).default('Untitled'),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  isPublic: z.boolean().optional().default(false),
})

const UpdatePageInput = z.object({
  id: z.string().min(1),
  title: z.string().min(1).max(255).optional(),
  parentId: z.string().nullable().optional(),
  icon: z.string().nullable().optional(),
  coverImage: z.string().url().nullable().optional(),
  content: z.string().nullable().optional(),
  status: z.enum(['draft', 'published', 'archived']).optional(),
  isFavorite: z.boolean().optional(),
  isPublic: z.boolean().optional(),
  position: z.number().int().min(0).optional(),
})

export const pageRouter = {
  list: authed
    .input(
      z.object({
        parentId: z.string().nullable().optional(),
      })
    )
    .handler(async ({ input, context }) => {
      const { userId } = context as { userId: string }
      return db
        .select()
        .from(page)
        .where(
          and(
            eq(page.userId, userId),
            isNull(page.deletedAt),
            input.parentId !== undefined
              ? input.parentId === null
                ? isNull(page.parentId)
                : eq(page.parentId, input.parentId)
              : undefined
          )
        )
        .orderBy(asc(page.position), asc(page.createdAt))
    }),

  get: authed.input(PageIdInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }
    const [row] = await db
      .select()
      .from(page)
      .where(
        and(
          eq(page.id, input.id),
          eq(page.userId, userId),
          isNull(page.deletedAt)
        )
      )
      .limit(1)

    if (!row) throw new Error('NOT_FOUND: Page not found')

    return row
  }),
  create: authed.handler(async ({ context }) => {
    const { userId } = context as { userId: string }
    const [created] = await db
      .insert(page)
      .values({
        userId,
        status: 'draft',
      })
      .returning()
    return created
  }),
  update: authed.input(UpdatePageInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }
    const { id, ...fields } = input
    const values = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    )
    const [updated] = await db
      .update(page)
      .set(values)
      .where(
        and(eq(page.id, id), eq(page.userId, userId), isNull(page.deletedAt))
      )
      .returning()
    if (!updated)
      throw new Error('NOT_FOUND: Page not found or already deleted')
    return updated
  }),
  archive: authed.input(PageIdInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }
    const [updated] = await db
      .update(page)
      .set({ status: 'archived' })
      .where(
        and(
          eq(page.id, input.id),
          eq(page.userId, userId),
          isNull(page.deletedAt)
        )
      )
      .returning()

    if (!updated) throw new Error('NOT_FOUND: Page not found')

    return updated
  }),

  favorite: authed
    .input(z.object({ id: z.string().min(1), isFavorite: z.boolean() }))
    .handler(async ({ input, context }) => {
      const { userId } = context as { userId: string }

      const [updated] = await db
        .update(page)
        .set({ isFavorite: input.isFavorite })
        .where(
          and(
            eq(page.id, input.id),
            eq(page.userId, userId),
            isNull(page.deletedAt)
          )
        )
        .returning()

      if (!updated) throw new Error('NOT_FOUND: Page not found')

      return updated
    }),

  reorder: authed
    .input(
      z.object({ id: z.string().min(1), position: z.number().int().min(0) })
    )
    .handler(async ({ input, context }) => {
      const { userId } = context as { userId: string }

      const [updated] = await db
        .update(page)
        .set({ position: input.position })
        .where(
          and(
            eq(page.id, input.id),
            eq(page.userId, userId),
            isNull(page.deletedAt)
          )
        )
        .returning()

      if (!updated) throw new Error('NOT_FOUND: Page not found')

      return updated
    }),

  delete: authed.input(PageIdInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }

    const [deleted] = await db
      .update(page)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(page.id, input.id),
          eq(page.userId, userId),
          isNull(page.deletedAt)
        )
      )
      .returning()

    if (!deleted)
      throw new Error('NOT_FOUND: Page not found or already deleted')

    return { success: true, id: deleted.id }
  }),

  restore: authed.input(PageIdInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }

    const [restored] = await db
      .update(page)
      .set({ deletedAt: null })
      .where(and(eq(page.id, input.id), eq(page.userId, userId)))
      .returning()

    if (!restored) throw new Error('NOT_FOUND: Page not found')

    return restored
  }),

  purge: authed.input(PageIdInput).handler(async ({ input, context }) => {
    const { userId } = context as { userId: string }

    const [purged] = await db
      .delete(page)
      .where(and(eq(page.id, input.id), eq(page.userId, userId)))
      .returning()

    if (!purged) throw new Error('NOT_FOUND: Page not found')

    return { success: true, id: purged.id }
  }),
}
