import { NextResponse } from "next/server";
import { listUsers } from "@/lib/database";
import { handleApiError } from "@/lib/api-response";

export async function GET() {
  try {
    const users = await listUsers();
    return NextResponse.json({ users });
  } catch (error) {
    return handleApiError(error);
  }
}
