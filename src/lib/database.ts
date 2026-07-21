import "server-only";
import { getSupabaseClient } from "@/lib/supabase-server";
import type {
  DemoUser,
  DocumentRecord,
  DocumentShareRecord,
  DocumentShareWithUser,
  DocumentWithMeta,
  ShareRecipient,
} from "@/types";

interface UserRow {
  id: string;
  name: string;
  email: string;
  created_at: string;
}

interface DocumentRow {
  id: string;
  title: string;
  content: unknown;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

interface ShareRow {
  id: string;
  document_id: string;
  user_id: string;
  permission: "editor";
  created_at: string;
}

function toUser(row: UserRow): DemoUser {
  return { id: row.id, name: row.name, email: row.email, createdAt: row.created_at };
}

function toDocument(row: DocumentRow): DocumentRecord {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    ownerId: row.owner_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function toShare(row: ShareRow): DocumentShareRecord {
  return {
    id: row.id,
    documentId: row.document_id,
    userId: row.user_id,
    permission: row.permission,
    createdAt: row.created_at,
  };
}

export async function getUserById(userId: string): Promise<DemoUser | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load user: ${error.message}`);
  return data ? toUser(data) : null;
}

export async function listUsers(): Promise<DemoUser[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .order("name", { ascending: true });

  if (error) throw new Error(`Failed to load users: ${error.message}`);
  return (data ?? []).map(toUser);
}

export async function getDocumentById(documentId: string): Promise<DocumentRecord | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .select("id, title, content, owner_id, created_at, updated_at")
    .eq("id", documentId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load document: ${error.message}`);
  return data ? toDocument(data) : null;
}

export async function getSharesForDocument(documentId: string): Promise<DocumentShareRecord[]> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("document_shares")
    .select("id, document_id, user_id, permission, created_at")
    .eq("document_id", documentId);

  if (error) throw new Error(`Failed to load document shares: ${error.message}`);
  return (data ?? []).map(toShare);
}

/** Documents owned by, or shared with, the given user — annotated with owner name and role. */
export async function listDocumentsForUser(userId: string): Promise<DocumentWithMeta[]> {
  const supabase = getSupabaseClient();

  const { data: sharedRows, error: sharesError } = await supabase
    .from("document_shares")
    .select("document_id")
    .eq("user_id", userId);
  if (sharesError) throw new Error(`Failed to load shares: ${sharesError.message}`);

  const sharedDocumentIds = (sharedRows ?? []).map((row) => row.document_id as string);
  const ownerFilter = `owner_id.eq.${userId}`;
  const idsFilter = sharedDocumentIds.length > 0 ? `,id.in.(${sharedDocumentIds.join(",")})` : "";

  const { data: docRows, error: docsError } = await supabase
    .from("documents")
    .select("id, title, content, owner_id, created_at, updated_at")
    .or(`${ownerFilter}${idsFilter}`)
    .order("updated_at", { ascending: false });
  if (docsError) throw new Error(`Failed to load documents: ${docsError.message}`);

  const documents = (docRows ?? []).map(toDocument);
  if (documents.length === 0) return [];

  const ownerIds = Array.from(new Set(documents.map((doc) => doc.ownerId)));
  const { data: ownerRows, error: ownerError } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .in("id", ownerIds);
  if (ownerError) throw new Error(`Failed to load owners: ${ownerError.message}`);

  const ownerNameById = new Map((ownerRows ?? []).map((row) => [row.id, row.name as string]));

  return documents.map((doc) => ({
    ...doc,
    ownerName: ownerNameById.get(doc.ownerId) ?? "Unknown",
    role: doc.ownerId === userId ? "owner" : "editor",
  }));
}

export async function createDocument(params: {
  title: string;
  content: unknown;
  ownerId: string;
}): Promise<DocumentRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("documents")
    .insert({ title: params.title, content: params.content, owner_id: params.ownerId })
    .select("id, title, content, owner_id, created_at, updated_at")
    .single();

  if (error) throw new Error(`Failed to create document: ${error.message}`);
  return toDocument(data);
}

export async function updateDocument(
  documentId: string,
  patch: { title?: string; content?: unknown }
): Promise<DocumentRecord> {
  const supabase = getSupabaseClient();
  const updatePayload: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (patch.title !== undefined) updatePayload.title = patch.title;
  if (patch.content !== undefined) updatePayload.content = patch.content;

  const { data, error } = await supabase
    .from("documents")
    .update(updatePayload)
    .eq("id", documentId)
    .select("id, title, content, owner_id, created_at, updated_at")
    .single();

  if (error) throw new Error(`Failed to update document: ${error.message}`);
  return toDocument(data);
}

export async function deleteDocument(documentId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase.from("documents").delete().eq("id", documentId);
  if (error) throw new Error(`Failed to delete document: ${error.message}`);
}

export async function createShare(params: {
  documentId: string;
  userId: string;
}): Promise<DocumentShareRecord> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("document_shares")
    .insert({ document_id: params.documentId, user_id: params.userId, permission: "editor" })
    .select("id, document_id, user_id, permission, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new Error("DUPLICATE_SHARE");
    }
    throw new Error(`Failed to share document: ${error.message}`);
  }
  return toShare(data);
}

export async function removeShare(documentId: string, userId: string): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("document_shares")
    .delete()
    .eq("document_id", documentId)
    .eq("user_id", userId);
  if (error) throw new Error(`Failed to remove share: ${error.message}`);
}

export async function listShareDetails(documentId: string): Promise<DocumentShareWithUser[]> {
  const shares = await getSharesForDocument(documentId);
  if (shares.length === 0) return [];

  const supabase = getSupabaseClient();
  const { data: userRows, error } = await supabase
    .from("users")
    .select("id, name, email, created_at")
    .in(
      "id",
      shares.map((share) => share.userId)
    );
  if (error) throw new Error(`Failed to load share recipients: ${error.message}`);

  const userById = new Map((userRows ?? []).map((row) => [row.id, toUser(row)]));

  return shares.map((share) => {
    const user = userById.get(share.userId);
    return {
      id: share.id,
      userId: share.userId,
      name: user?.name ?? "Unknown user",
      email: user?.email ?? "",
      permission: share.permission,
      createdAt: share.createdAt,
    };
  });
}

/** Seeded users who are not the document owner — candidates the owner can share with. */
export async function listShareRecipientCandidates(ownerId: string): Promise<ShareRecipient[]> {
  const users = await listUsers();
  return users
    .filter((user) => user.id !== ownerId)
    .map((user) => ({ userId: user.id, name: user.name, email: user.email }));
}
