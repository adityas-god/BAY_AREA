import { useState } from "react";
import { ArrowUpRight, FileText } from "lucide-react";

import { Modal } from "./modal";
import { ConfirmButton, EditButton } from "./dialogs";
import type { SopRow } from "@/lib/sops.functions";

function hostOf(url: string | null): string | null {
  if (!url) return null;
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

export function SopRowItem({
  sop,
  index,
  onEdit,
  onDelete,
}: {
  sop: SopRow;
  index: number;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const [noteOpen, setNoteOpen] = useState(false);
  const host = hostOf(sop.url);
  const isLink = sop.kind === "link" && !!sop.url;

  const body = (
    <div className="flex min-w-0 flex-1 items-center gap-3 sm:gap-4">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-border text-xs font-semibold text-muted-foreground">
        {String(index + 1).padStart(2, "0")}
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{sop.title}</p>
        <p className="truncate text-xs text-muted-foreground">
          {isLink ? host : (sop.content ?? "").slice(0, 90) || "Note"}
        </p>
      </div>
      <span className="hidden shrink-0 rounded-full border border-border px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground sm:block">
        {isLink ? "Link" : "Note"}
      </span>
    </div>
  );

  return (
    <div className="group flex items-center gap-2 rounded-2xl border border-border bg-card py-2 pl-2 pr-2 transition-colors hover:border-accent sm:gap-3 sm:py-2.5">
      {isLink ? (
        <a href={sop.url!} target="_blank" rel="noreferrer" className="min-w-0 flex-1">
          {body}
        </a>
      ) : (
        <button type="button" onClick={() => setNoteOpen(true)} className="min-w-0 flex-1 text-left">
          {body}
        </button>
      )}
      <span
        className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors group-hover:text-accent"
        aria-hidden
      >
        {isLink ? <ArrowUpRight className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
      </span>
      {onEdit && <EditButton onClick={onEdit} title="Edit SOP" />}
      {onDelete && <ConfirmButton onConfirm={onDelete} title="Delete SOP" />}
      <Modal open={noteOpen} onClose={() => setNoteOpen(false)} title={sop.title}>
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/90">
          {sop.content}
        </p>
      </Modal>
    </div>
  );
}
