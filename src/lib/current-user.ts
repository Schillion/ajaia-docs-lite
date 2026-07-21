import "server-only";
import { cookies } from "next/headers";
import { isSeedUserId } from "@/lib/seed-users";

export const DEMO_USER_COOKIE = "ajaia_demo_user";

/**
 * Reads the active demo user id from an HTTP-only cookie. This is the only
 * source of truth for "who is calling" on the server — client code may
 * display a selected user, but every server route re-derives the id from
 * this cookie rather than trusting anything the client sends.
 */
export async function getCurrentUserId(): Promise<string | null> {
  const store = await cookies();
  const value = store.get(DEMO_USER_COOKIE)?.value;
  if (!value || !isSeedUserId(value)) return null;
  return value;
}

export async function requireCurrentUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("NO_ACTIVE_USER");
  return userId;
}

export async function setCurrentUserId(userId: string): Promise<void> {
  const store = await cookies();
  store.set(DEMO_USER_COOKIE, userId, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
