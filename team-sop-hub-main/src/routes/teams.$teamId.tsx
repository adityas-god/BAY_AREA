import {
  createFileRoute,
  Link,
  notFound,
  useNavigate,
  useRouter,
} from "@tanstack/react-router";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { teamQueryOptions } from "@/lib/sops-queries";
import { SiteHeader } from "@/components/site-header";
import { SopRowItem } from "@/components/sop-row";
import {
  TeamDialog,
  CategoryDialog,
  SopDialog,
  ConfirmButton,
  EditButton,
} from "@/components/dialogs";
import { deleteTeam, deleteCategory, deleteSop } from "@/lib/sops-client";
import type { CategoryRow, SopRow } from "@/lib/sops.functions";

export const Route = createFileRoute("/teams/$teamId")({
  head: () => ({
    meta: [
      { title: "Team — Wow Laundry SOP Hub" },
      { name: "description", content: "Categories and SOPs for this team." },
      { property: "og:title", content: "Team — Wow Laundry SOP Hub" },
      { property: "og:description", content: "Categories and SOPs for this team." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(teamQueryOptions(params.teamId));
    if (!data) throw notFound();
  },
  component: TeamPage,
  notFoundComponent: TeamNotFound,
  errorComponent: TeamError,
});

function TeamError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-2xl uppercase tracking-tight">Couldn't load this team</p>
      <p className="text-sm text-muted-foreground">
        {error instanceof Error ? error.message : "Something went wrong"}
      </p>
      <button
        className="pill bg-primary text-primary-foreground hover:opacity-90"
        onClick={() => {
          router.invalidate();
          reset();
        }}
      >
        Try again
      </button>
    </div>
  );
}

function TeamNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-4xl uppercase tracking-tight">Team not found</p>
      <Link to="/" className="pill bg-primary text-primary-foreground hover:opacity-90">
        All teams
      </Link>
    </div>
  );
}

function TeamPage() {
  const { teamId } = Route.useParams();
  const { data } = useSuspenseQuery(teamQueryOptions(teamId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [catDialog, setCatDialog] = useState<{ open: boolean; category: CategoryRow | null }>({
    open: false,
    category: null,
  });
  const [sopDialog, setSopDialog] = useState<{ open: boolean; sop: SopRow | null }>({
    open: false,
    sop: null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["teams"] });

  const deleteTeamMut = useMutation({
    mutationFn: () => deleteTeam(teamId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Team deleted");
      navigate({ to: "/" });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete team"),
  });

  const deleteCategoryMut = useMutation({
    mutationFn: (id: string) => deleteCategory(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("Category deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete category"),
  });

  const deleteSopMut = useMutation({
    mutationFn: (id: string) => deleteSop(id),
    onSuccess: async () => {
      await invalidate();
      toast.success("SOP deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete SOP"),
  });

  if (!data) return null;
  const { team, categories, directSops } = data;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          to="/"
          className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          All teams
        </Link>

        {/* Team header */}
        <div className="mt-6 grid gap-6 border-b border-foreground/15 pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <h1 className="truncate font-display text-[clamp(2.5rem,7vw,4.5rem)] font-medium uppercase leading-none tracking-tight text-foreground">
              {team.name}
            </h1>
            {team.description && (
              <p className="mt-4 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {team.description}
              </p>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <button
              type="button"
              onClick={() => setCatDialog({ open: true, category: null })}
              className="pill bg-accent text-accent-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add category
            </button>
            <button
              type="button"
              onClick={() => setSopDialog({ open: true, sop: null })}
              className="pill bg-primary text-primary-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add SOP
            </button>
            <EditButton onClick={() => setTeamDialogOpen(true)} title="Edit team" />
            <ConfirmButton onConfirm={() => deleteTeamMut.mutate()} title="Delete team" />
          </div>
        </div>

        {/* Categories */}
        <section className="pt-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Categories
            </h2>
            <span className="h-px flex-1 bg-foreground/15" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {categories.length} {categories.length === 1 ? "panel" : "panels"}
            </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((c, i) => (
              <div key={c.id} className="group relative">
                <Link
                  to="/teams/$teamId_/category/$categoryId"
                  params={{ teamId, categoryId: c.id }}
                  className="flex min-h-44 flex-col justify-between rounded-4xl border border-border bg-card p-5 transition-all hover:-translate-y-1 hover:shadow-panel"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <span className="rounded-full bg-accent px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-accent-foreground">
                      {c.sopCount} SOP{c.sopCount === 1 ? "" : "s"}
                    </span>
                  </div>
                  <h3 className="mt-6 truncate font-display text-2xl uppercase leading-tight tracking-tight text-foreground">
                    {c.name}
                  </h3>
                </Link>
                <div className="absolute right-4 top-4 z-10 flex gap-1.5">
                  <EditButton
                    onClick={() => setCatDialog({ open: true, category: c })}
                    title="Edit category"
                  />
                  <ConfirmButton
                    onConfirm={() => deleteCategoryMut.mutate(c.id)}
                    title="Delete category"
                  />
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => setCatDialog({ open: true, category: null })}
              className="flex min-h-44 flex-col items-center justify-center gap-2 rounded-4xl border-2 border-dashed border-foreground/25 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
            >
              <Plus className="h-7 w-7" />
              <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                Add category
              </span>
            </button>
          </div>
        </section>

        {/* Direct SOPs */}
        <section className="pt-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Direct SOPs
            </h2>
            <span className="h-px flex-1 bg-foreground/15" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {directSops.length} {directSops.length === 1 ? "SOP" : "SOPs"}
            </span>
          </div>

          {directSops.length === 0 ? (
            <p className="rounded-4xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              No direct SOPs yet. Use “Add SOP” to attach links or written SOPs straight to this
              team — or organize them into a category first.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {directSops.map((s, i) => (
                <SopRowItem
                  key={s.id}
                  sop={s}
                  index={i}
                  onEdit={() => setSopDialog({ open: true, sop: s })}
                  onDelete={() => deleteSopMut.mutate(s.id)}
                />
              ))}
            </div>
          )}
        </section>
      </main>

      <TeamDialog open={teamDialogOpen} team={team} onClose={() => setTeamDialogOpen(false)} />
      <CategoryDialog
        open={catDialog.open}
        teamId={teamId}
        category={catDialog.category}
        onClose={() => setCatDialog({ open: false, category: null })}
      />
      <SopDialog
        open={sopDialog.open}
        teamId={teamId}
        categoryId={null}
        sop={sopDialog.sop}
        onClose={() => setSopDialog({ open: false, sop: null })}
      />
    </div>
  );
}
