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
import { ArrowLeft, Plus } from "lucide-react";
import type { ErrorComponentProps } from "@tanstack/react-router";

import { categoryQueryOptions } from "@/lib/sops-queries";
import { SiteHeader } from "@/components/site-header";
import { SopRowItem } from "@/components/sop-row";
import {
  CategoryDialog,
  SopDialog,
  ConfirmButton,
  EditButton,
} from "@/components/dialogs";
import { deleteCategory, deleteSop } from "@/lib/sops-client";
import type { SopRow } from "@/lib/sops.functions";

export const Route = createFileRoute("/teams/$teamId_/category/$categoryId")({
  head: () => ({
    meta: [
      { title: "Category — Wow Laundry SOP Hub" },
      { name: "description", content: "SOP links and notes in this category." },
      { property: "og:title", content: "Category — Wow Laundry SOP Hub" },
      { property: "og:description", content: "SOP links and notes in this category." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: async ({ context, params }) => {
    const data = await context.queryClient.ensureQueryData(
      categoryQueryOptions(params.teamId, params.categoryId),
    );
    if (!data) throw notFound();
  },
  component: CategoryPage,
  notFoundComponent: CategoryNotFound,
  errorComponent: CategoryError,
});

function CategoryError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-2xl uppercase tracking-tight">Couldn't load this category</p>
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

function CategoryNotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <p className="font-display text-4xl uppercase tracking-tight">Category not found</p>
      <Link to="/" className="pill bg-primary text-primary-foreground hover:opacity-90">
        All teams
      </Link>
    </div>
  );
}

function CategoryPage() {
  const { teamId, categoryId } = Route.useParams();
  const { data } = useSuspenseQuery(categoryQueryOptions(teamId, categoryId));
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [catDialogOpen, setCatDialogOpen] = useState(false);
  const [sopDialog, setSopDialog] = useState<{ open: boolean; sop: SopRow | null }>({
    open: false,
    sop: null,
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["teams"] });

  const deleteCategoryMut = useMutation({
    mutationFn: () => deleteCategory(categoryId),
    onSuccess: async () => {
      await invalidate();
      toast.success("Category deleted");
      navigate({ to: "/teams/$teamId", params: { teamId } });
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
  const { team, category, sops } = data;

  return (
    <div className="min-h-screen">
      <SiteHeader />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        <Link
          to="/teams/$teamId"
          params={{ teamId }}
          className="mt-8 inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          {team?.name ?? "Team"}
        </Link>

        {/* Category header */}
        <div className="mt-6 grid gap-6 border-b border-foreground/15 pb-10 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Category
            </p>
            <h1 className="mt-3 truncate font-display text-[clamp(2.5rem,7vw,4.5rem)] font-medium uppercase leading-none tracking-tight text-foreground">
              {category.name}
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2 sm:shrink-0 sm:justify-end">
            <button
              type="button"
              onClick={() => setSopDialog({ open: true, sop: null })}
              className="pill bg-accent text-accent-foreground hover:opacity-90"
            >
              <Plus className="h-3.5 w-3.5" />
              Add SOP
            </button>
            <EditButton onClick={() => setCatDialogOpen(true)} title="Edit category" />
            <ConfirmButton onConfirm={() => deleteCategoryMut.mutate()} title="Delete category" />
          </div>
        </div>

        {/* SOPs */}
        <section className="pt-12">
          <div className="mb-6 flex items-center gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              SOPs
            </h2>
            <span className="h-px flex-1 bg-foreground/15" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {sops.length} {sops.length === 1 ? "SOP" : "SOPs"}
            </span>
          </div>

          {sops.length === 0 ? (
            <p className="rounded-4xl border border-border bg-card px-6 py-10 text-center text-sm text-muted-foreground">
              Nothing here yet. Add your first SOP — a link to a document, or written steps
              stored right inside this category.
            </p>
          ) : (
            <div className="flex flex-col gap-3">
              {sops.map((s, i) => (
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

      <CategoryDialog
        open={catDialogOpen}
        teamId={teamId}
        category={category}
        onClose={() => setCatDialogOpen(false)}
      />
      <SopDialog
        open={sopDialog.open}
        teamId={teamId}
        categoryId={categoryId}
        sop={sopDialog.sop}
        onClose={() => setSopDialog({ open: false, sop: null })}
      />
    </div>
  );
}
