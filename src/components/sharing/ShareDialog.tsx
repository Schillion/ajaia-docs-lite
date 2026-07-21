"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { apiFetch, ApiClientError } from "@/lib/api-client";
import type { DocumentShareWithUser, ShareRecipient } from "@/types";

interface ShareDialogProps {
  documentId: string;
  documentTitle: string;
  currentUserId: string;
  onClose: () => void;
}

type LoadState = "loading" | "ready" | "error";

export function ShareDialog({ documentId, documentTitle, onClose }: ShareDialogProps) {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [shares, setShares] = useState<DocumentShareWithUser[]>([]);
  const [recipients, setRecipients] = useState<ShareRecipient[]>([]);
  const [selectedUserId, setSelectedUserId] = useState("");
  const [isSharing, setIsSharing] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );

  async function load() {
    setLoadState("loading");
    try {
      const data = await apiFetch<{ shares: DocumentShareWithUser[]; recipients: ShareRecipient[] }>(
        `/api/documents/${documentId}/shares`
      );
      setShares(data.shares);
      setRecipients(data.recipients);
      setLoadState("ready");
    } catch {
      setLoadState("error");
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetch-on-mount
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- load is stable per documentId
  }, [documentId]);

  const availableRecipients = recipients.filter(
    (recipient) => !shares.some((share) => share.userId === recipient.userId)
  );

  async function handleShare(event: React.FormEvent) {
    event.preventDefault();
    if (!selectedUserId) {
      setFeedback({ type: "error", message: "Choose a person to share with." });
      return;
    }

    setIsSharing(true);
    setFeedback(null);
    try {
      await apiFetch(`/api/documents/${documentId}/shares`, {
        method: "POST",
        body: JSON.stringify({ userId: selectedUserId }),
      });
      setSelectedUserId("");
      setFeedback({ type: "success", message: "Document shared." });
      await load();
    } catch (error) {
      const message =
        error instanceof ApiClientError ? error.message : "Could not share the document.";
      setFeedback({ type: "error", message });
    } finally {
      setIsSharing(false);
    }
  }

  async function handleRemove(userId: string) {
    setFeedback(null);
    try {
      await apiFetch(`/api/documents/${documentId}/shares/${userId}`, { method: "DELETE" });
      await load();
    } catch {
      setFeedback({ type: "error", message: "Could not remove access. Please try again." });
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
    >
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 id="share-dialog-title" className="text-lg font-semibold text-slate-900">
          Share &ldquo;{documentTitle || "Untitled document"}&rdquo;
        </h2>

        {loadState === "loading" && <p className="mt-4 text-sm text-slate-500">Loading…</p>}

        {loadState === "error" && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            Could not load sharing details. Please close and try again.
          </p>
        )}

        {loadState === "ready" && (
          <>
            <form onSubmit={handleShare} className="mt-4 flex gap-2">
              <label htmlFor="share-recipient" className="sr-only">
                Person to share with
              </label>
              <select
                id="share-recipient"
                value={selectedUserId}
                onChange={(event) => setSelectedUserId(event.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-indigo-600"
                disabled={availableRecipients.length === 0}
              >
                <option value="">
                  {availableRecipients.length === 0 ? "Everyone already has access" : "Choose a person…"}
                </option>
                {availableRecipients.map((recipient) => (
                  <option key={recipient.userId} value={recipient.userId}>
                    {recipient.name} ({recipient.email})
                  </option>
                ))}
              </select>
              <Button type="submit" disabled={isSharing || availableRecipients.length === 0}>
                {isSharing ? "Sharing…" : "Share"}
              </Button>
            </form>

            {feedback && (
              <p
                role="alert"
                className={`mt-2 text-sm ${feedback.type === "error" ? "text-red-600" : "text-emerald-600"}`}
              >
                {feedback.message}
              </p>
            )}

            <div className="mt-5">
              <h3 className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                People with access
              </h3>
              {shares.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Not shared with anyone yet.</p>
              ) : (
                <ul className="mt-2 flex flex-col gap-2">
                  {shares.map((share) => (
                    <li
                      key={share.id}
                      className="flex items-center justify-between rounded-md border border-slate-200 px-3 py-2 text-sm"
                    >
                      <div>
                        <p className="font-medium text-slate-800">{share.name}</p>
                        <p className="text-xs text-slate-500">{share.email} · editor</p>
                      </div>
                      <Button
                        variant="ghost"
                        className="px-2 py-1 text-xs text-slate-500"
                        onClick={() => handleRemove(share.userId)}
                        aria-label={`Remove ${share.name}'s access`}
                      >
                        Remove
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex justify-end">
          <Button variant="secondary" onClick={onClose}>
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}
