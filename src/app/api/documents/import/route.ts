import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { assertImportableFile, parseImportedFile, ImportError } from "@/lib/file-import";
import { createImportedDocument } from "@/lib/documents";
import { handleApiError } from "@/lib/api-response";

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUserId();

    const formData = await request.formData();
    const file = formData.get("file");

    if (!file || !(file instanceof File)) {
      throw new ImportError("no_file", "Choose a .txt or .md file to import.");
    }

    assertImportableFile({ name: file.name, size: file.size });

    let text: string;
    try {
      text = await file.text();
    } catch {
      throw new ImportError("read_failure", "Could not read the selected file.");
    }

    const { title, content } = parseImportedFile(file.name, text);
    const document = await createImportedDocument(userId, title, content);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
