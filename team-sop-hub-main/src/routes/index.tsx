import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { ArrowLeft, ArrowUpRight, Plus } from "lucide-react";

import { teamsQueryOptions } from "@/lib/sops-queries";
import { SiteHeader } from "@/components/site-header";
import { TeamDialog, ConfirmButton, EditButton, deleteTeam } from "@/components/dialogs";
import type { TeamSummary } from "@/lib/sops.functions";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Wow Laundry — SOP Hub" },
      {
        name: "description",
        content:
          "One place for every team's categories and standard operating procedures — SOP links and notes, neatly organized.",
      },
      { property: "og:title", content: "Wow Laundry — SOP Hub" },
      {
        property: "og:description",
        content: "Teams, categories and SOPs in one minimal hub.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(teamsQueryOptions());
  },
  component: IndexPage,
});

function IndexPage() {
  const { data: teams } = useSuspenseQuery(teamsQueryOptions());
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; team: TeamSummary | null }>({
    open: false,
    team: null,
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => deleteTeam(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["teams"] });
      toast.success("Team deleted");
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not delete team"),
  });

  return (
    <div className="min-h-screen">
      <SiteHeader
        action={
          <button
            type="button"
            onClick={() => setTeamDialog({ open: true, team: null })}
            className="pill bg-primary text-primary-foreground hover:opacity-90"
          >
            <Plus className="h-3.5 w-3.5" />
            Add team
          </button>
        }
      />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* Hero */}
        <section className="grid items-end gap-10 border-b border-foreground/15 py-12 lg:grid-cols-[minmax(0,1fr)_auto] lg:py-16">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                Standard Operating Procedures
              </p>
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              <span className="text-[10px] font-mono font-bold tracking-[0.2em] text-accent uppercase">
                SOP HUB FOR GREYORANGE
              </span>
            </div>
            <h1 className="mt-4 font-display text-[clamp(3.2rem,9.5vw,6.5rem)] font-medium uppercase leading-[0.95] tracking-tight text-foreground">
              BAY AREA
              <span className="align-super text-[0.32em] font-sans font-bold tracking-normal text-accent ml-2">™</span>
            </h1>
            <p className="mt-2.5 text-xs font-mono font-semibold tracking-[0.28em] text-accent uppercase">
              SOP HUB FOR GREYORANGE
            </p>
            <p className="mt-5 max-w-xl text-sm leading-relaxed text-muted-foreground">
              Every team gets a panel. Inside each panel, categories hold your SOP links and
              written SOPs — so the right way to do things is always one click away.
            </p>
          </div>

          {/* Decorative composition */}
          <div aria-hidden className="relative hidden h-72 w-72 lg:block">
            <div className="absolute bottom-0 left-0 h-44 w-28 striped rounded-t-[9rem] border-2 border-ink/80" />
            <div className="absolute bottom-0 right-12 h-40 w-12 rounded-t-full bg-secondary" />
            <div className="absolute left-24 top-0 h-52 w-40 rounded-t-[12rem] border-2 border-ink/80 bg-card" />
            <div className="absolute right-0 top-4 h-24 w-24 rounded-full bg-accent" />
            <div className="absolute bottom-20 right-0 h-14 w-14 rounded-2xl bg-secondary" />
            <div className="absolute left-14 top-10 h-5 w-5 rounded-full bg-accent" />
          </div>
        </section>

        {/* Teams grid */}
        <section className="pt-12">
          <div className="mb-8 flex items-center gap-4">
            <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
              Teams
            </h2>
            <span className="h-px flex-1 bg-foreground/15" />
            <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">
              {teams.length} {teams.length === 1 ? "team" : "teams"}
            </span>
          </div>

          {teams.length === 0 ? (
            <div className="flex flex-col items-center rounded-4xl border border-border bg-card px-6 py-16 text-center">
              <h3 className="font-display text-3xl uppercase tracking-tight text-foreground">
                No teams yet
              </h3>
              <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                Add your first team — then build it out with categories and SOPs.
              </p>
              <button
                type="button"
                onClick={() => setTeamDialog({ open: true, team: null })}
                className="pill mt-8 bg-accent text-accent-foreground hover:opacity-90"
              >
                <Plus className="h-3.5 w-3.5" />
                Add team
              </button>
            </div>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((t, i) => (
                <div key={t.id} className="group relative">
                  <Link
                    to="/teams/$teamId"
                    params={{ teamId: t.id }}
                    className="flex min-h-64 flex-col justify-between rounded-4xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-panel"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="h-2.5 w-2.5 rounded-full bg-accent" aria-hidden />
                      </div>
                      <h3 className="mt-6 truncate font-display text-3xl uppercase leading-tight tracking-tight text-foreground">
                        {t.name}
                      </h3>
                      {t.description && (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {t.description}
                        </p>
                      )}
                    </div>
                    <div className="mt-8 flex items-center justify-between border-t border-foreground/10 pt-4">
                      <span className="truncate text-xs text-muted-foreground">
                        {t.categoryCount} {t.categoryCount === 1 ? "category" : "categories"} ·{" "}
                        {t.sopCount} SOP{t.sopCount === 1 ? "" : "s"}
                      </span>
                      <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                        <ArrowUpRight className="h-4 w-4" />
                      </span>
                    </div>
                  </Link>
                  <div className="absolute right-4 top-4 z-10 flex gap-1.5">
                    <EditButton
                      onClick={() => setTeamDialog({ open: true, team: t })}
                      title="Edit team"
                    />
                    <ConfirmButton onConfirm={() => deleteMut.mutate(t.id)} title="Delete team" />
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => setTeamDialog({ open: true, team: null })}
                className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-foreground/25 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              >
                <Plus className="h-8 w-8" />
                <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                  Add team
                </span>
              </button>
            </div>
          )}
        </section>
      </main>

      <footer className="border-t border-foreground/15 py-8">
        <p className="mx-auto max-w-6xl px-6 text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          BAY AREA™ · SOP HUB FOR GREYORANGE
        </p>
      </footer>

      <TeamDialog
        open={teamDialog.open}
        team={teamDialog.team}
        onClose={() => setTeamDialog({ open: false, team: null })}
      />
    </div>
  );
}
