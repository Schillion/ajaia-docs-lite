"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { UserSwitcher } from "@/components/dashboard/UserSwitcher";
import { DocumentCard } from "@/components/dashboard/DocumentCard";
import { ImportDialog } from "@/components/import/ImportDialog";
import { Button } from "@/components/ui/Button";
import { apiFetch } from "@/lib/api-client";
import type { DemoUser, DocumentWithMeta } from "@/types";

interface DashboardProps {
  users: DemoUser[];
  currentUser: DemoUser | null;
  initialDocuments: DocumentWithMeta[];
  loadError: string | null;
}

export function Dashboard({ users, currentUser, initialDocuments, loadError }: DashboardProps) {
  const router = useRouter();
  const [isCreating, setIsCreating] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const { owned, shared } = useMemo(() => {
    const sorted = [...initialDocuments].sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    return {
      owned: sorted.filter((doc) => doc.role === "owner"),
      shared: sorted.filter((doc) => doc.role === "editor"),
    };
  }, [initialDocuments]);

  async function handleCreate() {
    setActionError(null);
    setIsCreating(true);
    try {
      const { document } = await apiFetch<{ document: { id: string } }>("/api/documents", {
        method: "POST",
        body: JSON.stringify({ title: "Untitled document" }),
      });
      router.push(`/documents/${document.id}`);
    } catch {
      setActionError("Could not create a new document. Please try again.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-6 border-b border-slate-200 pb-6 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Ajaia Docs Lite</h1>
          <p className="mt-1 max-w-xl text-sm text-slate-500">
            Demo user selector — authentication is intentionally simulated for this
            assessment.
          </p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <UserSwitcher users={users} currentUser={currentUser} />
          <div className="flex gap-2">
            <Button
              variant="secondary"
              onClick={() => setIsImportOpen(true)}
              disabled={!currentUser}
            >
              Import file
            </Button>
            <Button onClick={handleCreate} disabled={!currentUser || isCreating}>
              {isCreating ? "Creating…" : "New document"}
            </Button>
          </div>
        </div>
      </header>

      {actionError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </p>
      )}

      {loadError && (
        <p role="alert" className="rounded-md bg-red-50 px-4 py-3 text-sm text-red-700">
          {loadError}
        </p>
      )}

      {!currentUser && !loadError && (
        <div className="rounded-lg border border-dashed border-slate-300 bg-white px-6 py-12 text-center">
          <h2 className="text-lg font-medium text-slate-900">Select a demo user to begin</h2>
          <p className="mt-2 text-sm text-slate-500">
            Choose Alex, Jordan, or Sam from the dropdown above to view and create documents.
          </p>
        </div>
      )}

      {currentUser && !loadError && (
        <div className="flex flex-col gap-10">
          <DocumentSection
            title="My Documents"
            emptyMessage="You haven't created any documents yet. Use “New document” or “Import file” to get started."
            documents={owned}
          />
          <DocumentSection
            title="Shared With Me"
            emptyMessage="No one has shared a document with you yet."
            documents={shared}
          />
        </div>
      )}

      {isImportOpen && <ImportDialog onClose={() => setIsImportOpen(false)} />}
    </div>
  );
}

function DocumentSection({
  title,
  emptyMessage,
  documents,
}: {
  title: string;
  emptyMessage: string;
  documents: DocumentWithMeta[];
}) {
  return (
    <section aria-labelledby={`${title}-heading`}>
      <h2 id={`${title}-heading`} className="text-sm font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      {documents.length === 0 ? (
        <p className="mt-3 rounded-lg border border-slate-200 bg-white px-4 py-6 text-sm text-slate-500">
          {emptyMessage}
        </p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} />
          ))}
        </div>
      )}
    </section>
  );
}
