"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { apiFetch } from "@/lib/api-client";
import type { DemoUser } from "@/types";

export function UserSwitcher({
  users,
  currentUser,
}: {
  users: DemoUser[];
  currentUser: DemoUser | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  async function handleChange(userId: string) {
    setError(null);
    try {
      await apiFetch("/api/auth/switch-user", {
        method: "POST",
        body: JSON.stringify({ userId }),
      });
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setError("Could not switch demo user. Please try again.");
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <label htmlFor="demo-user-select" className="text-xs font-medium text-slate-500">
        Demo user
      </label>
      <select
        id="demo-user-select"
        value={currentUser?.id ?? ""}
        onChange={(event) => handleChange(event.target.value)}
        disabled={isPending}
        className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-900 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600 disabled:opacity-60"
      >
        <option value="" disabled>
          Select a demo user…
        </option>
        {users.map((user) => (
          <option key={user.id} value={user.id}>
            {user.name}
          </option>
        ))}
      </select>
      {error && (
        <p role="alert" className="text-xs text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
