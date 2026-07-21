import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getCurrentUserId } from "@/lib/current-user";
import { getDocumentForUser } from "@/lib/documents";
import { getUserById } from "@/lib/database";
import { ForbiddenError, NotFoundError } from "@/lib/access-control";
import { DocumentEditorPage } from "@/components/editor/DocumentEditorPage";
import type { DocumentRecord, DocumentRole } from "@/types";

interface PageProps {
  params: Promise<{ id: string }>;
}

type LoadResult =
  | { status: "ok"; document: DocumentRecord; role: DocumentRole; ownerName: string }
  | { status: "not_found" }
  | { status: "forbidden" }
  | { status: "error" };

async function loadDocument(userId: string, id: string): Promise<LoadResult> {
  try {
    const { document, role } = await getDocumentForUser(userId, id);
    const owner = await getUserById(document.ownerId);
    return { status: "ok", document, role, ownerName: owner?.name ?? "Unknown" };
  } catch (error) {
    if (error instanceof NotFoundError) return { status: "not_found" };
    if (error instanceof ForbiddenError) return { status: "forbidden" };
    return { status: "error" };
  }
}

export default async function DocumentPage({ params }: PageProps) {
  const { id } = await params;
  const userId = await getCurrentUserId();

  if (!userId) {
    redirect("/");
  }

  const result = await loadDocument(userId, id);

  if (result.status === "not_found") {
    notFound();
  }

  if (result.status === "forbidden") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Access denied</h1>
        <p className="text-sm text-slate-500">
          You do not have access to this document. Ask the owner to share it with you.
        </p>
        <Link href="/" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  if (result.status === "error") {
    return (
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
        <p className="text-sm text-slate-500">
          Could not load this document. Confirm the database is configured and try again.
        </p>
        <Link href="/" className="mt-2 text-sm font-medium text-indigo-600 hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  return (
    <DocumentEditorPage
      document={result.document}
      role={result.role}
      ownerName={result.ownerName}
      currentUserId={userId}
    />
  );
}
