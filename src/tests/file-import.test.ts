import { describe, expect, it } from "vitest";
import {
  assertImportableFile,
  deriveTitleFromFilename,
  ImportError,
  parseImportedFile,
} from "@/lib/file-import";
import { MAX_IMPORT_FILE_BYTES } from "@/lib/validation";

describe("assertImportableFile", () => {
  it("rejects when no file is provided", () => {
    expect(() => assertImportableFile(null)).toThrow(ImportError);
    try {
      assertImportableFile(null);
    } catch (error) {
      expect((error as ImportError).code).toBe("no_file");
    }
  });

  it("rejects unsupported file types", () => {
    expect(() => assertImportableFile({ name: "resume.docx", size: 100 })).toThrow(ImportError);
    try {
      assertImportableFile({ name: "resume.docx", size: 100 });
    } catch (error) {
      expect((error as ImportError).code).toBe("unsupported_type");
    }
  });

  it("rejects files larger than 1MB", () => {
    try {
      assertImportableFile({ name: "notes.txt", size: MAX_IMPORT_FILE_BYTES + 1 });
      throw new Error("expected assertImportableFile to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect((error as ImportError).code).toBe("too_large");
    }
  });

  it("rejects empty files", () => {
    try {
      assertImportableFile({ name: "notes.txt", size: 0 });
      throw new Error("expected assertImportableFile to throw");
    } catch (error) {
      expect(error).toBeInstanceOf(ImportError);
      expect((error as ImportError).code).toBe("empty_file");
    }
  });

  it("accepts a valid .txt file", () => {
    expect(() => assertImportableFile({ name: "notes.txt", size: 100 })).not.toThrow();
  });

  it("accepts a valid .md file", () => {
    expect(() => assertImportableFile({ name: "notes.md", size: 100 })).not.toThrow();
  });
});

describe("deriveTitleFromFilename", () => {
  it("strips the extension", () => {
    expect(deriveTitleFromFilename("project-plan.md")).toBe("project-plan");
    expect(deriveTitleFromFilename("notes.txt")).toBe("notes");
  });

  it("falls back to a default title when the name is empty", () => {
    expect(deriveTitleFromFilename(".txt")).toBe("Imported document");
  });
});

describe("parseImportedFile", () => {
  it("converts plain text into paragraph nodes", () => {
    const { title, content } = parseImportedFile("notes.txt", "Hello world\n\nSecond paragraph");
    expect(title).toBe("notes");
    expect(content.type).toBe("doc");
    expect(content.content).toHaveLength(2);
    expect(content.content[0]).toMatchObject({
      type: "paragraph",
      content: [{ type: "text", text: "Hello world" }],
    });
  });

  it("converts markdown headings, bold/italic, and lists", () => {
    const markdown = [
      "# Title",
      "",
      "Some **bold** and *italic* text.",
      "",
      "- one",
      "- two",
      "",
      "1. first",
      "2. second",
    ].join("\n");

    const { content } = parseImportedFile("doc.md", markdown);
    const [heading, paragraph, bulletList, orderedList] = content.content;

    expect(heading).toMatchObject({ type: "heading", attrs: { level: 1 } });
    expect(paragraph.type).toBe("paragraph");
    expect(paragraph.content?.some((n) => n.marks?.[0]?.type === "bold")).toBe(true);
    expect(paragraph.content?.some((n) => n.marks?.[0]?.type === "italic")).toBe(true);
    expect(bulletList).toMatchObject({ type: "bulletList" });
    expect(bulletList.content).toHaveLength(2);
    expect(orderedList).toMatchObject({ type: "orderedList" });
    expect(orderedList.content).toHaveLength(2);
  });

  it("rejects an effectively empty file", () => {
    expect(() => parseImportedFile("empty.txt", "   \n  \n ")).toThrow(ImportError);
  });
});
