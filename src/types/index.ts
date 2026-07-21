export type Permission = "editor";

export interface DemoUser {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface DocumentRecord {
  id: string;
  title: string;
  content: unknown;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

export interface DocumentShareRecord {
  id: string;
  documentId: string;
  userId: string;
  permission: Permission;
  createdAt: string;
}

export type DocumentRole = "owner" | "editor" | "none";

export interface DocumentWithMeta extends DocumentRecord {
  ownerName: string;
  role: DocumentRole;
}

export interface ShareRecipient {
  userId: string;
  name: string;
  email: string;
}

export interface DocumentShareWithUser {
  id: string;
  userId: string;
  name: string;
  email: string;
  permission: Permission;
  createdAt: string;
}
