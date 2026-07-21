"use client";

import { Button } from "@/components/ui/Button";

export type SaveState = "saved" | "unsaved" | "saving" | "error";

export function SaveStatus({ state, onRetry }: { state: SaveState; onRetry: () => void }) {
  const label = {
    saved: "Saved",
    unsaved: "Unsaved changes",
    saving: "Saving…",
    error: "Save failed",
  }[state];

  const dotClass = {
    saved: "bg-emerald-500",
    unsaved: "bg-amber-400",
    saving: "bg-indigo-500 animate-pulse",
    error: "bg-red-500",
  }[state];

  return (
    <div className="flex items-center gap-2 text-sm" role="status" aria-live="polite">
      <span className={`h-2 w-2 rounded-full ${dotClass}`} aria-hidden="true" />
      <span className={state === "error" ? "text-red-600" : "text-slate-500"}>{label}</span>
      {state === "error" && (
        <Button variant="secondary" onClick={onRetry} className="px-2 py-1 text-xs">
          Retry
        </Button>
      )}
    </div>
  );
}
