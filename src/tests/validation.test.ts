import { describe, expect, it } from "vitest";
import {
  createDocumentSchema,
  shareDocumentSchema,
  titleSchema,
  updateDocumentSchema,
} from "@/lib/validation";

describe("titleSchema", () => {
  it("rejects empty and whitespace-only titles", () => {
    expect(titleSchema.safeParse("").success).toBe(false);
    expect(titleSchema.safeParse("   ").success).toBe(false);
  });

  it("accepts a reasonable title", () => {
    expect(titleSchema.safeParse("Q3 Roadmap").success).toBe(true);
  });
});

describe("createDocumentSchema", () => {
  it("defaults the title when omitted", () => {
    const result = createDocumentSchema.parse({});
    expect(result.title).toBe("Untitled document");
  });
});

describe("updateDocumentSchema", () => {
  it("requires at least a title or content", () => {
    expect(updateDocumentSchema.safeParse({}).success).toBe(false);
  });

  it("accepts a title-only update", () => {
    expect(updateDocumentSchema.safeParse({ title: "New title" }).success).toBe(true);
  });

  it("accepts a content-only update with a valid doc envelope", () => {
    const result = updateDocumentSchema.safeParse({
      content: { type: "doc", content: [] },
    });
    expect(result.success).toBe(true);
  });
});

describe("shareDocumentSchema", () => {
  it("rejects a non-uuid recipient", () => {
    expect(shareDocumentSchema.safeParse({ userId: "not-a-uuid" }).success).toBe(false);
  });

  it("accepts a valid uuid recipient", () => {
    expect(
      shareDocumentSchema.safeParse({ userId: "11111111-1111-1111-1111-111111111111" }).success
    ).toBe(true);
  });
});
