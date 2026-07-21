import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { createDocumentSchema } from "@/lib/validation";
import { createNewDocument, listAccessibleDocuments } from "@/lib/documents";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await requireCurrentUserId();
    const documents = await listAccessibleDocuments(userId);
    return NextResponse.json({ documents });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = await requireCurrentUserId();
    const body = await request.json().catch(() => ({}));
    const { title } = createDocumentSchema.parse(body);
    const document = await createNewDocument(userId, title);
    return NextResponse.json({ document }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
