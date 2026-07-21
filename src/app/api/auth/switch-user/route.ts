import { NextRequest, NextResponse } from "next/server";
import { switchUserSchema } from "@/lib/validation";
import { setCurrentUserId } from "@/lib/current-user";
import { getUserById } from "@/lib/database";
import { handleApiError, jsonError } from "@/lib/api-response";
import { isSeedUserId } from "@/lib/seed-users";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = switchUserSchema.parse(body);

    if (!isSeedUserId(userId)) {
      return jsonError(400, "Unknown demo user", "invalid_user");
    }

    const user = await getUserById(userId);
    if (!user) return jsonError(400, "Unknown demo user", "invalid_user");

    await setCurrentUserId(userId);
    return NextResponse.json({ user });
  } catch (error) {
    return handleApiError(error);
  }
}
