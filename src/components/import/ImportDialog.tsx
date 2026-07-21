"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { ApiClientError } from "@/lib/api-client";

interface ImportDialogProps {
  onClose: () => void;
}

export function ImportDialog({ onClose }: ImportDialogProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    const file = fileInputRef.current?.files?.[0];
    if (!file) {
      setError("Choose a .txt or .md file to import.");
      return;
    }

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/documents/import", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiClientError(
          body.error?.message ?? "Import failed. Please try again.",
          response.status
        );
      }

      const { document } = (await response.json()) as { document: { id: string } };
      onClose();
      router.push(`/documents/${document.id}`);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="import-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 id="import-dialog-title" className="text-lg font-semibold text-slate-900">
          Import a file
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Supported types: .txt, .md. Maximum size: 1 MB. The file becomes a new
          document you own.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 flex flex-col gap-4">
          <label
            htmlFor="import-file-input"
            className="flex cursor-pointer flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-500 hover:border-indigo-400 hover:text-indigo-600"
          >
            <span>{selectedFileName ?? "Click to choose a .txt or .md file"}</span>
            <input
              ref={fileInputRef}
              id="import-file-input"
              type="file"
              accept=".txt,.md,text/plain,text/markdown"
              className="sr-only"
              onChange={(event) => {
                setSelectedFileName(event.target.files?.[0]?.name ?? null);
                setError(null);
              }}
            />
          </label>

          {error && (
            <p role="alert" className="text-sm text-red-600">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Importing…" : "Import"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
