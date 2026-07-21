import "server-only";
import * as db from "@/lib/database";
import {
  assertCanEdit,
  assertCanRead,
  assertCanShare,
  ForbiddenError,
  NotFoundError,
} from "@/lib/access-control";
import { emptyDoc } from "@/lib/editor-content";
import type { DocumentShareWithUser, DocumentWithMeta, ShareRecipient } from "@/types";

export class DuplicateShareError extends Error {
  constructor() {
    super("This user already has access to the document");
    this.name = "DuplicateShareError";
  }
}

export class InvalidShareRecipientError extends Error {
  constructor() {
    super("Cannot share a document with its own owner or an unknown user");
    this.name = "InvalidShareRecipientError";
  }
}

export async function listAccessibleDocuments(userId: string): Promise<DocumentWithMeta[]> {
  return db.listDocumentsForUser(userId);
}

export async function createNewDocument(userId: string, title: string) {
  return db.createDocument({ title, content: emptyDoc(), ownerId: userId });
}

export async function createImportedDocument(
  userId: string,
  title: string,
  content: unknown
) {
  return db.createDocument({ title, content, ownerId: userId });
}

async function loadDocumentWithShares(documentId: string) {
  const document = await db.getDocumentById(documentId);
  if (!document) return { document: null, shares: [] };
  const shares = await db.getSharesForDocument(documentId);
  return { document, shares };
}

export async function getDocumentForUser(userId: string, documentId: string) {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanRead(userId, document ? { ownerId: document.ownerId, shares } : null);
  return { document: document!, role: document!.ownerId === userId ? ("owner" as const) : ("editor" as const) };
}

export async function updateDocumentForUser(
  userId: string,
  documentId: string,
  patch: { title?: string; content?: unknown }
) {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanEdit(userId, document ? { ownerId: document.ownerId, shares } : null);
  return db.updateDocument(documentId, patch);
}

export async function listShareRecipients(
  userId: string,
  documentId: string
): Promise<ShareRecipient[]> {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanShare(userId, document ? { ownerId: document.ownerId, shares } : null);
  return db.listShareRecipientCandidates(document!.ownerId);
}

export async function listSharesForOwner(
  userId: string,
  documentId: string
): Promise<DocumentShareWithUser[]> {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanShare(userId, document ? { ownerId: document.ownerId, shares } : null);
  return db.listShareDetails(documentId);
}

export async function shareDocument(
  userId: string,
  documentId: string,
  recipientUserId: string
) {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanShare(userId, document ? { ownerId: document.ownerId, shares } : null);

  if (recipientUserId === document!.ownerId) {
    throw new InvalidShareRecipientError();
  }

  const recipient = await db.getUserById(recipientUserId);
  if (!recipient) throw new InvalidShareRecipientError();

  try {
    return await db.createShare({ documentId, userId: recipientUserId });
  } catch (error) {
    if (error instanceof Error && error.message === "DUPLICATE_SHARE") {
      throw new DuplicateShareError();
    }
    throw error;
  }
}

export async function removeDocumentShare(
  userId: string,
  documentId: string,
  targetUserId: string
) {
  const { document, shares } = await loadDocumentWithShares(documentId);
  assertCanShare(userId, document ? { ownerId: document.ownerId, shares } : null);
  await db.removeShare(documentId, targetUserId);
}

export async function deleteOwnedDocument(userId: string, documentId: string) {
  const document = await db.getDocumentById(documentId);
  if (!document) throw new NotFoundError();
  if (document.ownerId !== userId) {
    throw new ForbiddenError("Only the document owner can delete this document");
  }
  await db.deleteDocument(documentId);
}
