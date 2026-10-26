import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";

import { Modal, Field, inputClass } from "./modal";

export function ConfirmButton({
  onConfirm,
  title = "Delete",
  className,
}: {
  onConfirm: () => void;
  title?: string;
  className?: string;
}) {
  const [armed, setArmed] = useState(false);

  useEffect(() => {
    if (!armed) return;
    const t = setTimeout(() => setArmed(false), 2600);
    return () => clearTimeout(t);
  }, [armed]);

  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        if (armed) {
          onConfirm();
        } else {
          setArmed(true);
        }
      }}
      className={
        className ??
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      }
    >
      {armed ? (
        <span className="text-[9px] font-bold uppercase leading-none text-destructive">Sure?</span>
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function EditButton({
  onClick,
  title = "Edit",
  className,
}: {
  onClick: () => void;
  title?: string;
  className?: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      className={
        className ??
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
      }
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-3.5 w-3.5"
      >
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        <path d="m15 5 4 4" />
      </svg>
    </button>
  );
}

export interface TeamDialogData {
  id?: string;
  name: string;
  description?: string | null;
}

export function TeamDialog({
  open,
  onClose,
  team,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  team?: TeamDialogData | null;
  onSave: (data: { id?: string; name: string; description: string | null }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setDescription(team?.description ?? "");
    }
  }, [open, team]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        id: team?.id,
        name: name.trim(),
        description: description.trim() || null,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={team ? "Edit team" : "Add team"}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="Team name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Floor Operations"
            required
            autoFocus
          />
        </Field>
        <Field label="Short description (optional)">
          <textarea
            className={`${inputClass} min-h-24 resize-none`}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What this team looks after"
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Saving…" : team ? "Save changes" : "Create team"}
        </button>
      </form>
    </Modal>
  );
}

export interface CategoryDialogData {
  id?: string;
  name: string;
}

export function CategoryDialog({
  open,
  onClose,
  teamId,
  category,
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  category?: CategoryDialogData | null;
  onSave: (data: { teamId: string; oldName?: string; name: string }) => Promise<void> | void;
}) {
  const [name, setName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) setName(category?.name ?? "");
  }, [open, category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSaving(true);
    try {
      await onSave({
        teamId,
        oldName: category?.name,
        name: name.trim(),
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit category" : "Add category"}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="Category name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Opening & Closing"
            required
            autoFocus
          />
        </Field>
        <button
          type="submit"
          disabled={isSaving || !name.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
      </form>
    </Modal>
  );
}

export interface SopDialogData {
  id?: string;
  title: string;
  kind?: "link" | "note";
  url?: string | null;
  content?: string | null;
  category?: string | null;
}

export function SopDialog({
  open,
  onClose,
  teamId,
  categoryId,
  sop,
  availableCategories = [],
  onSave,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  categoryId: string | null;
  sop?: SopDialogData | null;
  availableCategories?: string[];
  onSave: (data: {
    id?: string;
    teamId: string;
    categoryId: string | null;
    title: string;
    kind: "link" | "note";
    url: string | null;
    content: string | null;
  }) => Promise<void> | void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"link" | "note">("link");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const [selectedCat, setSelectedCat] = useState<string>(categoryId || availableCategories[0] || "");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(sop?.title ?? "");
      setKind(sop?.kind === "note" || (!sop?.url && sop?.content) ? "note" : "link");
      setUrl(sop?.url ?? "");
      setContent(sop?.content ?? "");
      setSelectedCat(sop?.category || categoryId || availableCategories[0] || "");
    }
  }, [open, sop, categoryId, availableCategories]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    let cleanUrl: string | null = null;
    if (kind === "link" && url.trim()) {
      cleanUrl = url.trim();
      if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
    }
    const cleanContent = kind === "note" ? content.trim() || null : null;

    setIsSaving(true);
    try {
      await onSave({
        id: sop?.id,
        teamId,
        categoryId: selectedCat || categoryId || null,
        title: title.trim(),
        kind,
        url: cleanUrl,
        content: cleanContent,
      });
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={sop ? "Edit SOP" : "Add SOP"}>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Field label="SOP title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Machine start-up checklist"
            required
            autoFocus
          />
        </Field>

        {availableCategories.length > 0 && !categoryId && (
          <Field label="Category / Bay">
            <select
              className={inputClass}
              value={selectedCat}
              onChange={(e) => setSelectedCat(e.target.value)}
            >
              {availableCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        )}

        <div className="grid grid-cols-2 gap-2">
          {(["link", "note"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-2xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors cursor-pointer ${
                kind === k
                  ? "border-transparent bg-primary text-primary-foreground font-bold"
                  : "border-border text-muted-foreground hover:border-accent hover:text-foreground"
              }`}
            >
              {k === "link" ? "SOP link" : "SOP note"}
            </button>
          ))}
        </div>

        {kind === "link" ? (
          <Field label="Link URL">
            <input
              className={inputClass}
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://docs.google.com/… or https://notion.so/…"
              type="url"
              required={kind === "link"}
            />
          </Field>
        ) : (
          <Field label="SOP content">
            <textarea
              className={`${inputClass} min-h-40 resize-y`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the steps, rules or notes for this SOP…"
              required={kind === "note"}
            />
          </Field>
        )}

        <button
          type="submit"
          disabled={isSaving || !title.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50 cursor-pointer"
        >
          {isSaving ? "Saving…" : sop ? "Save changes" : "Add SOP"}
        </button>
      </form>
    </Modal>
  );
}
