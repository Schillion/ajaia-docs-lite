import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { updateDocumentSchema } from "@/lib/validation";
import { deleteOwnedDocument, getDocumentForUser, updateDocumentForUser } from "@/lib/documents";
import { handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const { document, role } = await getDocumentForUser(userId, id);
    return NextResponse.json({ document, role });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const body = await request.json();
    const { title, content, baseUpdatedAt } = updateDocumentSchema.parse(body);

    if (baseUpdatedAt) {
      const { document: current } = await getDocumentForUser(userId, id);
      if (new Date(current.updatedAt).getTime() > new Date(baseUpdatedAt).getTime()) {
        return NextResponse.json(
          {
            error: {
              message: "This document changed elsewhere. Reload to see the latest version.",
              code: "stale_save",
            },
            document: current,
          },
          { status: 409 }
        );
      }
    }

    const document = await updateDocumentForUser(userId, id, { title, content });
    return NextResponse.json({ document });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    await deleteOwnedDocument(userId, id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
