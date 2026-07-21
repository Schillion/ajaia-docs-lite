import { MAX_IMPORT_FILE_BYTES, SUPPORTED_IMPORT_EXTENSIONS } from "@/lib/validation";
import { markdownToTiptapDoc, plainTextToTiptapDoc, type TiptapDoc } from "@/lib/editor-content";

export class ImportError extends Error {
  code:
    | "no_file"
    | "unsupported_type"
    | "too_large"
    | "empty_file"
    | "read_failure";

  constructor(code: ImportError["code"], message: string) {
    super(message);
    this.name = "ImportError";
    this.code = code;
  }
}

function getExtension(filename: string): string {
  const idx = filename.lastIndexOf(".");
  return idx === -1 ? "" : filename.slice(idx).toLowerCase();
}

export function deriveTitleFromFilename(filename: string): string {
  const ext = getExtension(filename);
  const base = ext ? filename.slice(0, -ext.length) : filename;
  const trimmed = base.trim();
  return trimmed.length > 0 ? trimmed : "Imported document";
}

export function assertImportableFile(file: { name: string; size: number } | null | undefined): void {
  if (!file) {
    throw new ImportError("no_file", "Choose a .txt or .md file to import.");
  }

  const ext = getExtension(file.name);
  if (!SUPPORTED_IMPORT_EXTENSIONS.includes(ext as (typeof SUPPORTED_IMPORT_EXTENSIONS)[number])) {
    throw new ImportError(
      "unsupported_type",
      "Unsupported file type. Only .txt and .md files can be imported."
    );
  }

  if (file.size > MAX_IMPORT_FILE_BYTES) {
    throw new ImportError("too_large", "File is larger than the 1 MB import limit.");
  }

  if (file.size <= 0) {
    throw new ImportError("empty_file", "File is empty.");
  }
}

export interface ParsedImport {
  title: string;
  content: TiptapDoc;
}

export function parseImportedFile(filename: string, text: string): ParsedImport {
  if (text.trim().length === 0) {
    throw new ImportError("empty_file", "File is empty.");
  }

  const ext = getExtension(filename);
  const content = ext === ".md" ? markdownToTiptapDoc(text) : plainTextToTiptapDoc(text);

  return {
    title: deriveTitleFromFilename(filename),
    content,
  };
}
