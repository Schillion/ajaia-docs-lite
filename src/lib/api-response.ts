import "server-only";
import { NextResponse } from "next/server";
import { ForbiddenError, NotFoundError } from "@/lib/access-control";
import { DuplicateShareError, InvalidShareRecipientError } from "@/lib/documents";
import { ImportError } from "@/lib/file-import";
import { ZodError } from "zod";

export function jsonError(status: number, message: string, code?: string) {
  return NextResponse.json({ error: { message, code } }, { status });
}

/**
 * Centralizes error → HTTP status translation so every route handler gets
 * consistent 404/403/400/500 behavior without re-implementing the mapping.
 * Server errors are logged with detail but never echoed to the client.
 */
export function handleApiError(error: unknown): NextResponse {
  if (error instanceof NotFoundError) return jsonError(404, error.message, "not_found");
  if (error instanceof ForbiddenError) return jsonError(403, error.message, "forbidden");
  if (error instanceof DuplicateShareError) return jsonError(409, error.message, "duplicate_share");
  if (error instanceof InvalidShareRecipientError) return jsonError(400, error.message, "invalid_recipient");
  if (error instanceof ImportError) return jsonError(400, error.message, error.code);
  if (error instanceof ZodError) {
    const first = error.issues[0];
    return jsonError(400, first?.message ?? "Invalid request", "validation_error");
  }
  if (error instanceof Error && error.message === "NO_ACTIVE_USER") {
    return jsonError(401, "No active demo user. Select a demo user to continue.", "no_active_user");
  }

  console.error("Unhandled API error:", error);
  return jsonError(500, "Something went wrong. Please try again.", "internal_error");
}
