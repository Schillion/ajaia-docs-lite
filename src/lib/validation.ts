import { z } from "zod";

export const MAX_IMPORT_FILE_BYTES = 1024 * 1024; // 1 MB
export const SUPPORTED_IMPORT_EXTENSIONS = [".txt", ".md"] as const;

// Seed user/document IDs use simple hex UUID-shaped strings (e.g.
// 11111111-1111-1111-1111-111111111111) that are not RFC-variant-strict, so
// we validate shape only rather than using Zod's stricter `.uuid()`.
const uuidLikeSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "Invalid id");

export const titleSchema = z
  .string()
  .trim()
  .min(1, "Title cannot be empty")
  .max(200, "Title must be 200 characters or fewer");

/** Tiptap documents are always a JSON object with type "doc". Deep shape is
 * intentionally left to Tiptap/ProseMirror — we only guard the envelope. */
export const editorContentSchema = z
  .object({
    type: z.literal("doc"),
    content: z.array(z.record(z.string(), z.unknown())).optional().default([]),
  })
  .loose();

export const createDocumentSchema = z.object({
  title: titleSchema.default("Untitled document"),
});

export const updateDocumentSchema = z
  .object({
    title: titleSchema.optional(),
    content: editorContentSchema.optional(),
    baseUpdatedAt: z.string().optional(),
  })
  .refine((data) => data.title !== undefined || data.content !== undefined, {
    message: "Provide a title or content to update",
  });

export const shareDocumentSchema = z.object({
  userId: uuidLikeSchema,
});

export const removeShareSchema = z.object({
  userId: uuidLikeSchema,
});

export const switchUserSchema = z.object({
  userId: uuidLikeSchema,
});

export const importFileMetaSchema = z.object({
  filename: z.string().min(1, "File name is required"),
  size: z
    .number()
    .int()
    .positive("File is empty")
    .max(MAX_IMPORT_FILE_BYTES, "File exceeds the 1 MB import limit"),
});

export type CreateDocumentInput = z.infer<typeof createDocumentSchema>;
export type UpdateDocumentInput = z.infer<typeof updateDocumentSchema>;
export type ShareDocumentInput = z.infer<typeof shareDocumentSchema>;
