import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

import { Modal, Field, inputClass } from "./modal";
import {
  createTeam,
  updateTeam,
  deleteTeam,
  createCategory,
  updateCategory,
  deleteCategory,
  createSop,
  updateSop,
  deleteSop,
} from "@/lib/sops-client";
import type { TeamRow, CategoryRow, SopRow } from "@/lib/sops.functions";

function invalidateHubs(queryClient: ReturnType<typeof useQueryClient>) {
  // All hub queries live under the ["teams"] prefix.
  return queryClient.invalidateQueries({ queryKey: ["teams"] });
}

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
      onClick={() => (armed ? onConfirm() : setArmed(true))}
      className={
        className ??
        "grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-destructive hover:text-destructive"
      }
    >
      {armed ? (
        <span className="text-[9px] font-bold uppercase leading-none">Sure?</span>
      ) : (
        <Trash2 className="h-3.5 w-3.5" />
      )}
    </button>
  );
}

export function EditButton({ onClick, title = "Edit" }: { onClick: () => void; title?: string }) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
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

export function TeamDialog({
  open,
  onClose,
  team,
}: {
  open: boolean;
  onClose: () => void;
  team?: TeamRow | null;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setName(team?.name ?? "");
      setDescription(team?.description ?? "");
    }
  }, [open, team]);

  const save = useMutation({
    mutationFn: async () => {
      if (team) {
        return updateTeam({ id: team.id, name: name.trim(), description: description.trim() || null });
      }
      return createTeam({ name: name.trim(), description: description.trim() || null });
    },
    onSuccess: async (row) => {
      await invalidateHubs(queryClient);
      toast.success(team ? "Team updated" : "Team added");
      onClose();
      if (!team && row) {
        navigate({ to: "/teams/$teamId", params: { teamId: row.id } });
      }
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save team"),
  });

  return (
    <Modal open={open} onClose={onClose} title={team ? "Edit team" : "Add team"}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save.mutate();
        }}
      >
        <Field label="Team name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Floor Operations"
            required
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
          disabled={save.isPending || !name.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : team ? "Save changes" : "Create team"}
        </button>
      </form>
    </Modal>
  );
}

export function CategoryDialog({
  open,
  onClose,
  teamId,
  category,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  category?: CategoryRow | null;
}) {
  const [name, setName] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) setName(category?.name ?? "");
  }, [open, category]);

  const save = useMutation({
    mutationFn: async () => {
      if (category) return updateCategory({ id: category.id, name: name.trim() });
      return createCategory({ team_id: teamId, name: name.trim() });
    },
    onSuccess: async () => {
      await invalidateHubs(queryClient);
      toast.success(category ? "Category updated" : "Category added");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save category"),
  });

  return (
    <Modal open={open} onClose={onClose} title={category ? "Edit category" : "Add category"}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (name.trim()) save.mutate();
        }}
      >
        <Field label="Category name">
          <input
            className={inputClass}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Opening & Closing"
            required
          />
        </Field>
        <button
          type="submit"
          disabled={save.isPending || !name.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : category ? "Save changes" : "Create category"}
        </button>
      </form>
    </Modal>
  );
}

export function SopDialog({
  open,
  onClose,
  teamId,
  categoryId,
  sop,
}: {
  open: boolean;
  onClose: () => void;
  teamId: string;
  categoryId: string | null;
  sop?: SopRow | null;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<"link" | "note">("link");
  const [url, setUrl] = useState("");
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setTitle(sop?.title ?? "");
      setKind(sop?.kind === "note" ? "note" : "link");
      setUrl(sop?.url ?? "");
      setContent(sop?.content ?? "");
    }
  }, [open, sop]);

  const save = useMutation({
    mutationFn: async () => {
      let cleanUrl: string | null = null;
      if (kind === "link" && url.trim()) {
        cleanUrl = url.trim();
        if (!/^https?:\/\//i.test(cleanUrl)) cleanUrl = `https://${cleanUrl}`;
      }
      const cleanContent = kind === "note" ? content.trim() || null : null;
      if (kind === "link" && !cleanUrl) throw new Error("Add the link URL");
      if (kind === "note" && !cleanContent) throw new Error("Write the SOP content");
      if (sop) {
        return updateSop({ id: sop.id, title: title.trim(), kind, url: cleanUrl, content: cleanContent });
      }
      return createSop({
        team_id: teamId,
        category_id: categoryId,
        title: title.trim(),
        kind,
        url: cleanUrl,
        content: cleanContent,
      });
    },
    onSuccess: async () => {
      await invalidateHubs(queryClient);
      toast.success(sop ? "SOP updated" : "SOP added");
      onClose();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save SOP"),
  });

  return (
    <Modal open={open} onClose={onClose} title={sop ? "Edit SOP" : "Add SOP"}>
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          if (title.trim()) save.mutate();
        }}
      >
        <Field label="SOP title">
          <input
            className={inputClass}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Machine start-up checklist"
            required
          />
        </Field>
        <div className="grid grid-cols-2 gap-2">
          {(["link", "note"] as const).map((k) => (
            <button
              type="button"
              key={k}
              onClick={() => setKind(k)}
              className={`rounded-2xl border px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors ${
                kind === k
                  ? "border-transparent bg-primary text-primary-foreground"
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
              placeholder="https://docs.google.com/…"
            />
          </Field>
        ) : (
          <Field label="SOP content">
            <textarea
              className={`${inputClass} min-h-40 resize-y`}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write the steps, rules or notes for this SOP…"
            />
          </Field>
        )}
        <button
          type="submit"
          disabled={save.isPending || !title.trim()}
          className="pill w-full bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
        >
          {save.isPending ? "Saving…" : sop ? "Save changes" : "Add SOP"}
        </button>
      </form>
    </Modal>
  );
}

export { deleteTeam, deleteCategory, deleteSop };
