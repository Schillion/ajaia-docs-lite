import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatRelativeTime } from "@/lib/format";
import type { DocumentWithMeta } from "@/types";

export function DocumentCard({ document }: { document: DocumentWithMeta }) {
  return (
    <Link
      href={`/documents/${document.id}`}
      className="group flex flex-col gap-3 rounded-lg border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
      aria-label={`Open ${document.title}`}
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-2 font-medium text-slate-900 group-hover:text-indigo-700">
          {document.title || "Untitled document"}
        </h3>
        <Badge tone={document.role === "owner" ? "owned" : "shared"}>
          {document.role === "owner" ? "Owned" : "Shared"}
        </Badge>
      </div>
      <div className="mt-auto flex items-center justify-between text-xs text-slate-500">
        <span>{document.ownerName}</span>
        <span>Updated {formatRelativeTime(document.updatedAt)}</span>
      </div>
    </Link>
  );
}
