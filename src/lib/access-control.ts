import type { DocumentRole } from "@/types";

/**
 * Pure, DB-free authorization core. Every rule in the product brief is
 * expressed here so it can be unit tested without a database, and so
 * every server entry point (route handlers, server actions) shares one
 * source of truth instead of re-deriving permission logic ad hoc.
 */

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export interface ShareLike {
  userId: string;
  permission: "editor";
}

export interface DocumentAccessInput {
  ownerId: string;
  shares: ShareLike[];
}

/** Determines the caller's relationship to a document: owner, shared editor, or none. */
export function getDocumentRole(
  userId: string,
  doc: DocumentAccessInput
): DocumentRole {
  if (doc.ownerId === userId) return "owner";
  if (doc.shares.some((share) => share.userId === userId)) return "editor";
  return "none";
}

export function canReadDocument(userId: string, doc: DocumentAccessInput): boolean {
  return getDocumentRole(userId, doc) !== "none";
}

export function canEditContent(userId: string, doc: DocumentAccessInput): boolean {
  return getDocumentRole(userId, doc) !== "none";
}

export function canRenameDocument(userId: string, doc: DocumentAccessInput): boolean {
  return getDocumentRole(userId, doc) !== "none";
}

/** Only the owner may share a document — shared editors are explicitly excluded. */
export function canShareDocument(userId: string, doc: DocumentAccessInput): boolean {
  return getDocumentRole(userId, doc) === "owner";
}

export function canDeleteDocument(userId: string, doc: DocumentAccessInput): boolean {
  return getDocumentRole(userId, doc) === "owner";
}

/**
 * Throws NotFoundError when the document does not exist, ForbiddenError when
 * it exists but the caller has no role on it. Callers translate these into
 * HTTP 404 / 403 responses at the API boundary.
 */
export function assertCanRead(
  userId: string,
  doc: DocumentAccessInput | null
): asserts doc is DocumentAccessInput {
  if (!doc) throw new NotFoundError("Document not found");
  if (!canReadDocument(userId, doc)) throw new ForbiddenError("You do not have access to this document");
}

export function assertCanEdit(
  userId: string,
  doc: DocumentAccessInput | null
): asserts doc is DocumentAccessInput {
  if (!doc) throw new NotFoundError("Document not found");
  if (!canEditContent(userId, doc)) throw new ForbiddenError("You do not have access to this document");
}

export function assertCanShare(
  userId: string,
  doc: DocumentAccessInput | null
): asserts doc is DocumentAccessInput {
  if (!doc) throw new NotFoundError("Document not found");
  if (!canShareDocument(userId, doc)) {
    throw new ForbiddenError("Only the document owner can manage sharing");
  }
}

export function assertCanDelete(
  userId: string,
  doc: DocumentAccessInput | null
): asserts doc is DocumentAccessInput {
  if (!doc) throw new NotFoundError("Document not found");
  if (!canDeleteDocument(userId, doc)) {
    throw new ForbiddenError("Only the document owner can delete this document");
  }
}
