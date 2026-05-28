import { and, asc, eq, isNull } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { note } from '../db/schema'
import { authed } from './context'

const NoteIdInput = z.object({
  id: z.string().min(1),
})

const CreateNoteInput = z.object({
  pageId: z.string().min(1),
  title: z.string().max(255).nullable().optional(),
  content: z.string().optional().default(''),
  isPinned: z.boolean().optional().default(false),
  isFavorite: z.boolean().optional().default(false),
  tags: z.array(z.string()).optional().default([]),
})

const UpdateNoteInput = z.object({
  id: z.string().min(1),
  title: z.string().max(255).nullable().optional(),
  content: z.string().optional(),
  isPinned: z.boolean().optional(),
  isFavorite: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  position: z.number().int().min(0).optional(),
})

export const noteRouter = {
  list: authed
    .input(z.object({ pageId: z.string().min(1) }))
    .handler(async ({ input, context }) => {
      return db
        .select()
        .from(note)
        .where(
          and(
            eq(note.userId, context.userId),
            eq(note.pageId, input.pageId),
            isNull(note.deletedAt)
          )
        )
        .orderBy(asc(note.position), asc(note.createdAt))
    }),

  get: authed.input(NoteIdInput).handler(async ({ input, context }) => {
    const [row] = await db
      .select()
      .from(note)
      .where(
        and(
          eq(note.id, input.id),
          eq(note.userId, context.userId),
          isNull(note.deletedAt)
        )
      )
      .limit(1)

    if (!row) throw new Error('NOT_FOUND: Note not found')

    return row
  }),

  create: authed.input(CreateNoteInput).handler(async ({ input, context }) => {
    const [created] = await db
      .insert(note)
      .values({
        userId: context.userId,
        pageId: input.pageId,
        title: input.title ?? null,
        content: input.content,
        isPinned: input.isPinned,
        isFavorite: input.isFavorite,
        tags: JSON.stringify(input.tags),
      })
      .returning()

    return created
  }),

  update: authed.input(UpdateNoteInput).handler(async ({ input, context }) => {
    const { id, tags, ...fields } = input

    const values = Object.fromEntries(
      Object.entries(fields).filter(([, v]) => v !== undefined)
    )

    if (tags !== undefined) {
      Object.assign(values, { tags: JSON.stringify(tags) })
    }

    const [updated] = await db
      .update(note)
      .set(values)
      .where(
        and(
          eq(note.id, id),
          eq(note.userId, context.userId),
          isNull(note.deletedAt)
        )
      )
      .returning()

    if (!updated)
      throw new Error('NOT_FOUND: Note not found or already deleted')

    return updated
  }),

  pin: authed
    .input(z.object({ id: z.string().min(1), isPinned: z.boolean() }))
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(note)
        .set({ isPinned: input.isPinned })
        .where(
          and(
            eq(note.id, input.id),
            eq(note.userId, context.userId),
            isNull(note.deletedAt)
          )
        )
        .returning()

      if (!updated) throw new Error('NOT_FOUND: Note not found')

      return updated
    }),

  favorite: authed
    .input(z.object({ id: z.string().min(1), isFavorite: z.boolean() }))
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(note)
        .set({ isFavorite: input.isFavorite })
        .where(
          and(
            eq(note.id, input.id),
            eq(note.userId, context.userId),
            isNull(note.deletedAt)
          )
        )
        .returning()

      if (!updated) throw new Error('NOT_FOUND: Note not found')

      return updated
    }),

  reorder: authed
    .input(
      z.object({ id: z.string().min(1), position: z.number().int().min(0) })
    )
    .handler(async ({ input, context }) => {
      const [updated] = await db
        .update(note)
        .set({ position: input.position })
        .where(
          and(
            eq(note.id, input.id),
            eq(note.userId, context.userId),
            isNull(note.deletedAt)
          )
        )
        .returning()

      if (!updated) throw new Error('NOT_FOUND: Note not found')

      return updated
    }),

  delete: authed.input(NoteIdInput).handler(async ({ input, context }) => {
    const [deleted] = await db
      .update(note)
      .set({ deletedAt: new Date() })
      .where(
        and(
          eq(note.id, input.id),
          eq(note.userId, context.userId),
          isNull(note.deletedAt)
        )
      )
      .returning()

    if (!deleted)
      throw new Error('NOT_FOUND: Note not found or already deleted')

    return { success: true, id: deleted.id }
  }),

  restore: authed.input(NoteIdInput).handler(async ({ input, context }) => {
    const [restored] = await db
      .update(note)
      .set({ deletedAt: null })
      .where(and(eq(note.id, input.id), eq(note.userId, context.userId)))
      .returning()

    if (!restored) throw new Error('NOT_FOUND: Note not found')

    return restored
  }),

  purge: authed.input(NoteIdInput).handler(async ({ input, context }) => {
    const [purged] = await db
      .delete(note)
      .where(and(eq(note.id, input.id), eq(note.userId, context.userId)))
      .returning()

    if (!purged) throw new Error('NOT_FOUND: Note not found')

    return { success: true, id: purged.id }
  }),
}
