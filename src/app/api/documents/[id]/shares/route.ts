import { NextRequest, NextResponse } from "next/server";
import { requireCurrentUserId } from "@/lib/current-user";
import { shareDocumentSchema } from "@/lib/validation";
import { listShareRecipients, listSharesForOwner, shareDocument } from "@/lib/documents";
import { handleApiError } from "@/lib/api-response";

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function GET(_request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const [shares, recipients] = await Promise.all([
      listSharesForOwner(userId, id),
      listShareRecipients(userId, id),
    ]);
    return NextResponse.json({ shares, recipients });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const userId = await requireCurrentUserId();
    const { id } = await params;
    const body = await request.json();
    const { userId: recipientId } = shareDocumentSchema.parse(body);
    const share = await shareDocument(userId, id, recipientId);
    return NextResponse.json({ share }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}
