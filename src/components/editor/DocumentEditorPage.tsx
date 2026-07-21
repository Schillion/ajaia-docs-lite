"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Toolbar } from "@/components/editor/Toolbar";
import { SaveStatus, type SaveState } from "@/components/editor/SaveStatus";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ShareDialog } from "@/components/sharing/ShareDialog";
import { ApiClientError } from "@/lib/api-client";
import { formatRelativeTime } from "@/lib/format";
import type { DocumentRecord, DocumentRole } from "@/types";

const AUTOSAVE_DELAY_MS = 800;

interface DocumentEditorPageProps {
  document: DocumentRecord;
  role: DocumentRole;
  ownerName: string;
  currentUserId: string;
}

export function DocumentEditorPage({
  document,
  role,
  ownerName,
  currentUserId,
}: DocumentEditorPageProps) {
  const [title, setTitle] = useState(document.title);
  const [updatedAt, setUpdatedAt] = useState(document.updatedAt);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [isShareOpen, setIsShareOpen] = useState(false);

  const baseUpdatedAtRef = useRef(document.updatedAt);
  const titleRef = useRef(title);
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirtyRef = useRef(false);

  useEffect(() => {
    titleRef.current = title;
  }, [title]);

  const editor = useEditor({
    extensions: [StarterKit, Underline],
    content: document.content as object,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class: "tiptap min-h-[60vh] px-8 py-6 sm:px-12 focus:outline-none",
        "aria-label": "Document content",
      },
    },
  });

  const performSave = useCallback(async () => {
    if (!editor) return;
    isDirtyRef.current = false;
    setSaveState("saving");

    try {
      const response = await fetch(`/api/documents/${document.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: titleRef.current,
          content: editor.getJSON(),
          baseUpdatedAt: baseUpdatedAtRef.current,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiClientError(body.error?.message ?? "Save failed.", response.status);
      }

      const { document: saved } = (await response.json()) as { document: DocumentRecord };
      baseUpdatedAtRef.current = saved.updatedAt;
      setUpdatedAt(saved.updatedAt);
      setSaveState(isDirtyRef.current ? "unsaved" : "saved");
    } catch {
      setSaveState("error");
    }
  }, [editor, document.id]);

  const scheduleSave = useCallback(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      void performSave();
    }, AUTOSAVE_DELAY_MS);
  }, [performSave]);

  useEffect(() => {
    if (!editor) return;
    const handleUpdate = () => {
      isDirtyRef.current = true;
      setSaveState("unsaved");
      scheduleSave();
    };
    editor.on("update", handleUpdate);
    return () => {
      editor.off("update", handleUpdate);
    };
  }, [editor, scheduleSave]);

  function handleTitleChange(value: string) {
    setTitle(value);
    isDirtyRef.current = true;
    setSaveState("unsaved");
    scheduleSave();
  }

  function handleRetry() {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    void performSave();
  }

  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, []);

  useEffect(() => {
    function handleBeforeUnload(event: BeforeUnloadEvent) {
      if (saveState === "unsaved" || saveState === "saving" || saveState === "error") {
        event.preventDefault();
      }
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [saveState]);

  const isOwner = role === "owner";

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="border-b border-slate-200 bg-white px-4 py-3 sm:px-6">
        <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <Link
              href="/"
              className="shrink-0 text-sm font-medium text-slate-500 hover:text-indigo-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
            >
              ← Dashboard
            </Link>
            <input
              value={title}
              onChange={(event) => handleTitleChange(event.target.value)}
              aria-label="Document title"
              className="min-w-0 flex-1 truncate rounded-md border border-transparent px-2 py-1 text-lg font-semibold text-slate-900 hover:border-slate-200 focus:border-indigo-400 focus:outline-none"
              placeholder="Untitled document"
            />
            <Badge tone={isOwner ? "owned" : "shared"}>{isOwner ? "Owned" : "Shared"}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <SaveStatus state={saveState} onRetry={handleRetry} />
            {isOwner && (
              <Button variant="secondary" onClick={() => setIsShareOpen(true)}>
                Share
              </Button>
            )}
          </div>
        </div>
        <p className="mx-auto mt-1 max-w-4xl text-xs text-slate-400">
          Owned by {ownerName} · Updated {formatRelativeTime(updatedAt)}
        </p>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 py-8">
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <Toolbar editor={editor} />
          <EditorContent editor={editor} />
        </div>
      </main>

      {isShareOpen && (
        <ShareDialog
          documentId={document.id}
          documentTitle={title}
          currentUserId={currentUserId}
          onClose={() => setIsShareOpen(false)}
        />
      )}
    </div>
  );
}
