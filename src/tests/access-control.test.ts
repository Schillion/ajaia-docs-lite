import { describe, expect, it } from "vitest";
import {
  assertCanEdit,
  assertCanRead,
  assertCanShare,
  canEditContent,
  canReadDocument,
  canRenameDocument,
  canShareDocument,
  ForbiddenError,
  getDocumentRole,
  NotFoundError,
  type DocumentAccessInput,
} from "@/lib/access-control";

const OWNER = "owner-1";
const EDITOR = "editor-1";
const STRANGER = "stranger-1";

function makeDoc(overrides: Partial<DocumentAccessInput> = {}): DocumentAccessInput {
  return {
    ownerId: OWNER,
    shares: [{ userId: EDITOR, permission: "editor" }],
    ...overrides,
  };
}

describe("access-control", () => {
  it("lets the owner read, edit, rename, and share", () => {
    const doc = makeDoc();
    expect(getDocumentRole(OWNER, doc)).toBe("owner");
    expect(canReadDocument(OWNER, doc)).toBe(true);
    expect(canEditContent(OWNER, doc)).toBe(true);
    expect(canRenameDocument(OWNER, doc)).toBe(true);
    expect(canShareDocument(OWNER, doc)).toBe(true);
  });

  it("lets a shared editor read, edit, and rename but not share", () => {
    const doc = makeDoc();
    expect(getDocumentRole(EDITOR, doc)).toBe("editor");
    expect(canReadDocument(EDITOR, doc)).toBe(true);
    expect(canEditContent(EDITOR, doc)).toBe(true);
    expect(canRenameDocument(EDITOR, doc)).toBe(true);
    expect(canShareDocument(EDITOR, doc)).toBe(false);
  });

  it("blocks an unrelated user from reading or editing", () => {
    const doc = makeDoc();
    expect(getDocumentRole(STRANGER, doc)).toBe("none");
    expect(canReadDocument(STRANGER, doc)).toBe(false);
    expect(canEditContent(STRANGER, doc)).toBe(false);
    expect(canShareDocument(STRANGER, doc)).toBe(false);
  });

  it("only allows the owner to grant access (share)", () => {
    const doc = makeDoc();
    expect(canShareDocument(OWNER, doc)).toBe(true);
    expect(canShareDocument(EDITOR, doc)).toBe(false);
    expect(canShareDocument(STRANGER, doc)).toBe(false);
  });

  describe("assertCanRead", () => {
    it("throws NotFoundError for a missing document", () => {
      expect(() => assertCanRead(STRANGER, null)).toThrow(NotFoundError);
    });

    it("throws ForbiddenError for an unrelated user", () => {
      expect(() => assertCanRead(STRANGER, makeDoc())).toThrow(ForbiddenError);
    });

    it("does not throw for the owner or a shared editor", () => {
      expect(() => assertCanRead(OWNER, makeDoc())).not.toThrow();
      expect(() => assertCanRead(EDITOR, makeDoc())).not.toThrow();
    });
  });

  describe("assertCanEdit", () => {
    it("allows owner and shared editor, blocks stranger", () => {
      expect(() => assertCanEdit(OWNER, makeDoc())).not.toThrow();
      expect(() => assertCanEdit(EDITOR, makeDoc())).not.toThrow();
      expect(() => assertCanEdit(STRANGER, makeDoc())).toThrow(ForbiddenError);
    });
  });

  describe("assertCanShare", () => {
    it("allows only the owner", () => {
      expect(() => assertCanShare(OWNER, makeDoc())).not.toThrow();
      expect(() => assertCanShare(EDITOR, makeDoc())).toThrow(ForbiddenError);
      expect(() => assertCanShare(STRANGER, makeDoc())).toThrow(ForbiddenError);
    });

    it("throws NotFoundError before checking permission when document is missing", () => {
      expect(() => assertCanShare(OWNER, null)).toThrow(NotFoundError);
    });
  });
});
