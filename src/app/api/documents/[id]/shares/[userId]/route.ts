import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { removeDocumentShare } from "@/lib/documents";
import { handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string; userId: string }>;
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  try {
    const currentUserId = await requireCurrentUserId();
    const { id, userId } = await params;
    await removeDocumentShare(currentUserId, id, userId);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return handleApiError(error);
  }
}
