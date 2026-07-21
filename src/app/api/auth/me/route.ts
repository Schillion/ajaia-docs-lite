import { NextResponse } from "next/server";
import { getCurrentUserId } from "@/lib/current-user";
import { getUserById } from "@/lib/database";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const userId = await getCurrentUserId();
    if (!userId) return NextResponse.json({ user: null });
    const user = await getUserById(userId);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
