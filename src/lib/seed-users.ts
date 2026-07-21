import type { DemoUser } from "@/types";

/**
 * Stable IDs shared with supabase/seed.sql so the app and the seeded
 * database always agree on which row is "Alex", "Jordan", and "Sam".
 */
export const SEED_USER_IDS = {
  alex: "11111111-1111-1111-1111-111111111111",
  jordan: "22222222-2222-2222-2222-222222222222",
  sam: "33333333-3333-3333-3333-333333333333",
} as const;

export const SEED_USERS: DemoUser[] = [
  {
    id: SEED_USER_IDS.alex,
    name: "Alex Morgan",
    email: "alex@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: SEED_USER_IDS.jordan,
    name: "Jordan Lee",
    email: "jordan@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
  {
    id: SEED_USER_IDS.sam,
    name: "Sam Rivera",
    email: "sam@example.com",
    createdAt: "2024-01-01T00:00:00.000Z",
  },
];

export function isSeedUserId(id: string): boolean {
  return SEED_USERS.some((user) => user.id === id);
}
