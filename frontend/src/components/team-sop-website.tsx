import { useState, useMemo } from "react";
import { ArrowLeft, ArrowUpRight, Plus, Compass, Layers, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { Team, SOP } from "@/lib/teams-sops";
import { SiteHeader } from "./site-header";
import { SopRowItem } from "./sop-row";
import {
  TeamDialog,
  CategoryDialog,
  SopDialog,
  ConfirmButton,
  EditButton,
  type TeamDialogData,
  type CategoryDialogData,
  type SopDialogData,
} from "./dialogs";

interface TeamSopWebsiteProps {
  teams: Team[];
  sops: SOP[];
  onFlipToVillage: () => void;
  onFlyToTeamInVillage: (teamId: string) => void;
  onCreateTeam: (team: { name: string; description: string | null }) => Promise<void> | void;
  onUpdateTeam: (team: { id: string; name: string; description: string | null }) => Promise<void> | void;
  onDeleteTeam: (teamId: string) => Promise<void> | void;
  onCreateCategory: (teamId: string, name: string) => Promise<void> | void;
  onUpdateCategory: (teamId: string, oldName: string, newName: string) => Promise<void> | void;
  onDeleteCategory: (teamId: string, name: string) => Promise<void> | void;
  onCreateSOP: (sop: {
    teamId: string;
    categoryId: string | null;
    title: string;
    kind: "link" | "note";
    url: string | null;
    content: string | null;
  }) => Promise<void> | void;
  onUpdateSOP: (sop: {
    id: string;
    teamId: string;
    categoryId: string | null;
    title: string;
    kind: "link" | "note";
    url: string | null;
    content: string | null;
  }) => Promise<void> | void;
  onDeleteSOP: (sopId: string) => Promise<void> | void;
}

type NavigationState =
  | { level: "teams" }
  | { level: "team"; teamId: string }
  | { level: "category"; teamId: string; categoryName: string };

export function TeamSopWebsite({
  teams,
  sops,
  onFlipToVillage,
  onFlyToTeamInVillage,
  onCreateTeam,
  onUpdateTeam,
  onDeleteTeam,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onCreateSOP,
  onUpdateSOP,
  onDeleteSOP,
}: TeamSopWebsiteProps) {
  const [nav, setNav] = useState<NavigationState>({ level: "teams" });

  // Dialog states
  const [teamDialog, setTeamDialog] = useState<{ open: boolean; team: TeamDialogData | null }>({
    open: false,
    team: null,
  });

  const [categoryDialog, setCategoryDialog] = useState<{
    open: boolean;
    teamId: string;
    category: CategoryDialogData | null;
  }>({
    open: false,
    teamId: "",
    category: null,
  });

  const [sopDialog, setSopDialog] = useState<{
    open: boolean;
    teamId: string;
    categoryId: string | null;
    sop: SopDialogData | null;
  }>({
    open: false,
    teamId: "",
    categoryId: null,
    sop: null,
  });

  // Current active team and category based on navigation
  const activeTeam = useMemo(() => {
    if (nav.level === "team" || nav.level === "category") {
      return teams.find((t) => t.id === nav.teamId) || teams[0];
    }
    return null;
  }, [nav, teams]);

  const activeCategory = useMemo(() => {
    if (nav.level === "category") {
      return nav.categoryName;
    }
    return null;
  }, [nav]);

  // SOPs calculations
  const teamSops = useMemo(() => {
    if (!activeTeam) return [];
    return sops.filter((s) => s.teamId === activeTeam.id);
  }, [activeTeam, sops]);

  const categorySops = useMemo(() => {
    if (!activeTeam || !activeCategory) return [];
    return sops.filter((s) => s.teamId === activeTeam.id && s.category === activeCategory);
  }, [activeTeam, activeCategory, sops]);

  const directSops = useMemo(() => {
    if (!activeTeam) return [];
    const teamCats = activeTeam.categories || [];
    return teamSops.filter((s) => !s.category || !teamCats.includes(s.category));
  }, [activeTeam, teamSops]);

  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("bay_area_theme");
      if (stored) return stored === "dark";
    }
    return true; // Default to Dark Mode!
  });

  const handleToggleDarkMode = () => {
    setIsDark((prev) => {
      const next = !prev;
      if (typeof window !== "undefined") {
        localStorage.setItem("bay_area_theme", next ? "dark" : "light");
      }
      return next;
    });
  };

  return (
    <div className={`retro-theme min-h-screen bg-background text-foreground transition-colors duration-200 ${isDark ? "dark" : ""}`}>
      <SiteHeader
        onNavigateHome={() => setNav({ level: "teams" })}
        onFlipToVillage={onFlipToVillage}
        isDark={isDark}
        onToggleDarkMode={handleToggleDarkMode}
        action={
          nav.level === "teams" ? (
            <button
              type="button"
              onClick={() => setTeamDialog({ open: true, team: null })}
              className="pill bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add team
            </button>
          ) : nav.level === "team" && activeTeam ? (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setCategoryDialog({
                    open: true,
                    teamId: activeTeam.id,
                    category: null,
                  })
                }
                className="pill border border-foreground/25 text-foreground hover:bg-foreground/5 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add category
              </button>
              <button
                type="button"
                onClick={() =>
                  setSopDialog({
                    open: true,
                    teamId: activeTeam.id,
                    categoryId: null,
                    sop: null,
                  })
                }
                className="pill bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add SOP
              </button>
            </div>
          ) : nav.level === "category" && activeTeam && activeCategory ? (
            <button
              type="button"
              onClick={() =>
                setSopDialog({
                  open: true,
                  teamId: activeTeam.id,
                  categoryId: activeCategory,
                  sop: null,
                })
              }
              className="pill bg-primary text-primary-foreground hover:opacity-90 cursor-pointer"
            >
              <Plus className="h-3.5 w-3.5" />
              Add SOP
            </button>
          ) : null
        }
      />

      <main className="mx-auto max-w-6xl px-6 pb-24">
        {/* ========================================================================= */}
        {/* LEVEL 1: ALL TEAMS VIEW                                                   */}
        {/* ========================================================================= */}
        {nav.level === "teams" && (
          <div className="animate-in fade-in duration-200">
            {/* Hero Section */}
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
                  Every team gets a panel. Inside each panel, categories hold your SOP links and written SOPs —
                  so the right way to do things is always one click away.
                </p>
              </div>

              {/* Decorative Composition */}
              <div aria-hidden className="relative hidden h-72 w-72 lg:block select-none opacity-90">
                <div className="absolute bottom-0 left-0 h-44 w-28 striped rounded-t-[9rem] border-2 border-border" />
                <div className="absolute bottom-0 right-12 h-40 w-12 rounded-t-full bg-secondary" />
                <div className="absolute left-24 top-0 h-52 w-40 rounded-t-[12rem] border-2 border-border bg-card" />
                <div className="absolute right-0 top-4 h-24 w-24 rounded-full bg-accent" />
                <div className="absolute bottom-20 right-0 h-14 w-14 rounded-2xl bg-secondary" />
                <div className="absolute left-14 top-10 h-5 w-5 rounded-full bg-accent" />
              </div>
            </section>

            {/* Teams Grid Section */}
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
                    className="pill mt-8 bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add team
                  </button>
                </div>
              ) : (
                <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {teams.map((t, i) => {
                    const countSops = sops.filter((s) => s.teamId === t.id).length;
                    const countCats = t.categories?.length || 0;

                    return (
                      <div key={t.id} className="group relative">
                        <div
                          onClick={() => setNav({ level: "team", teamId: t.id })}
                          className="flex min-h-64 flex-col justify-between rounded-4xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-panel cursor-pointer"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                                {String(i + 1).padStart(2, "0")} · {t.code}
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
                              {countCats} {countCats === 1 ? "category" : "categories"} · {countSops} SOP
                              {countSops === 1 ? "" : "s"}
                            </span>
                            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                              <ArrowUpRight className="h-4 w-4" />
                            </span>
                          </div>
                        </div>

                        {/* Top action buttons */}
                        <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
                          <button
                            type="button"
                            title="Focus in 3D Village"
                            onClick={(e) => {
                              e.stopPropagation();
                              onFlyToTeamInVillage(t.id);
                            }}
                            className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-border text-muted-foreground transition-colors hover:border-accent hover:text-accent"
                          >
                            <Compass className="h-3.5 w-3.5" />
                          </button>
                          <EditButton
                            onClick={() =>
                              setTeamDialog({
                                open: true,
                                team: { id: t.id, name: t.name, description: t.description },
                              })
                            }
                            title="Edit team"
                          />
                          <ConfirmButton
                            onConfirm={async () => {
                              await onDeleteTeam(t.id);
                              toast.success("Team deleted");
                            }}
                            title="Delete team"
                          />
                        </div>
                      </div>
                    );
                  })}

                  {/* Add team dashed card */}
                  <button
                    type="button"
                    onClick={() => setTeamDialog({ open: true, team: null })}
                    className="flex min-h-64 flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-foreground/25 text-muted-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer"
                  >
                    <Plus className="h-8 w-8" />
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                      Add team
                    </span>
                  </button>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 2: TEAM CATEGORIES VIEW                                             */}
        {/* ========================================================================= */}
        {nav.level === "team" && activeTeam && (
          <div className="animate-in fade-in duration-200 pt-8">
            {/* Header & Back Navigation */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setNav({ level: "teams" })}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All Teams
              </button>

              <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-foreground/15 pb-8">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.25em] text-accent">
                      {activeTeam.code} District Campus
                    </span>
                  </div>
                  <h1 className="mt-2 font-display text-4xl sm:text-5xl uppercase tracking-tight text-foreground">
                    {activeTeam.name}
                  </h1>
                  {activeTeam.description && (
                    <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted-foreground">
                      {activeTeam.description}
                    </p>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3 shrink-0">
                  <button
                    type="button"
                    onClick={() => onFlyToTeamInVillage(activeTeam.id)}
                    className="pill border border-foreground/25 text-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Compass className="h-3.5 w-3.5 text-accent" />
                    <span>View District in Village</span>
                  </button>
                  <EditButton
                    onClick={() =>
                      setTeamDialog({
                        open: true,
                        team: {
                          id: activeTeam.id,
                          name: activeTeam.name,
                          description: activeTeam.description,
                        },
                      })
                    }
                    title="Edit team"
                  />
                </div>
              </div>
            </div>

            {/* Categories Grid */}
            <section className="pt-4">
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Categories ({activeTeam.categories?.length || 0})
                </h2>
                <span className="h-px flex-1 bg-foreground/15" />
              </div>

              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {(activeTeam.categories || []).map((catName, idx) => {
                  const sopsInCat = teamSops.filter((s) => s.category === catName);

                  return (
                    <div key={catName} className="group relative">
                      <div
                        onClick={() =>
                          setNav({
                            level: "category",
                            teamId: activeTeam.id,
                            categoryName: catName,
                          })
                        }
                        className="flex min-h-52 flex-col justify-between rounded-4xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:shadow-panel cursor-pointer"
                      >
                        <div className="min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                              Category {String(idx + 1).padStart(2, "0")}
                            </span>
                            <span className="h-2 w-2 rounded-full bg-accent" aria-hidden />
                          </div>
                          <h3 className="mt-4 truncate font-display text-2xl uppercase tracking-tight text-foreground">
                            {catName}
                          </h3>
                        </div>

                        <div className="mt-6 flex items-center justify-between border-t border-foreground/10 pt-4">
                          <span className="text-xs text-muted-foreground">
                            {sopsInCat.length} SOP{sopsInCat.length === 1 ? "" : "s"}
                          </span>
                          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
                            <ArrowUpRight className="h-4 w-4" />
                          </span>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="absolute right-4 top-4 z-10 flex items-center gap-1.5">
                        <EditButton
                          onClick={() =>
                            setCategoryDialog({
                              open: true,
                              teamId: activeTeam.id,
                              category: { name: catName },
                            })
                          }
                          title="Edit category"
                        />
                        <ConfirmButton
                          onConfirm={async () => {
                            await onDeleteCategory(activeTeam.id, catName);
                            toast.success("Category deleted");
                          }}
                          title="Delete category"
                        />
                      </div>
                    </div>
                  );
                })}

                {/* Add category dashed card */}
                <button
                  type="button"
                  onClick={() =>
                    setCategoryDialog({
                      open: true,
                      teamId: activeTeam.id,
                      category: null,
                    })
                  }
                  className="flex min-h-52 flex-col items-center justify-center gap-3 rounded-4xl border-2 border-dashed border-foreground/25 text-muted-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer"
                >
                  <Plus className="h-7 w-7" />
                  <span className="text-[11px] font-semibold uppercase tracking-[0.25em]">
                    Add category
                  </span>
                </button>
              </div>
            </section>

            {/* Direct SOPs (if any) */}
            {directSops.length > 0 && (
              <section className="mt-14 border-t border-foreground/15 pt-8">
                <div className="mb-6 flex items-center gap-4">
                  <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                    Direct Team SOPs ({directSops.length})
                  </h2>
                  <span className="h-px flex-1 bg-foreground/15" />
                </div>
                <div className="space-y-3">
                  {directSops.map((sop, idx) => (
                    <SopRowItem
                      key={sop.id}
                      sop={{
                        id: sop.id,
                        title: sop.title,
                        url: sop.contentLink,
                        content:
                          sop.summary ||
                          sop.steps?.map((st) => `${st.order}. ${st.title}: ${st.description}`).join("\n"),
                      }}
                      index={idx}
                      onEdit={() =>
                        setSopDialog({
                          open: true,
                          teamId: activeTeam.id,
                          categoryId: null,
                          sop: {
                            id: sop.id,
                            title: sop.title,
                            url: sop.contentLink,
                            content: sop.summary,
                            category: null,
                          },
                        })
                      }
                      onDelete={async () => {
                        await onDeleteSOP(sop.id);
                        toast.success("SOP deleted");
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* LEVEL 3: CATEGORY SOPS VIEW                                               */}
        {/* ========================================================================= */}
        {nav.level === "category" && activeTeam && activeCategory && (
          <div className="animate-in fade-in duration-200 pt-8">
            {/* Header & Back Navigation */}
            <div className="mb-8">
              <button
                type="button"
                onClick={() => setNav({ level: "team", teamId: activeTeam.id })}
                className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                {activeTeam.name}
              </button>

              <div className="mt-6 flex flex-col md:flex-row md:items-end md:justify-between gap-6 border-b border-foreground/15 pb-8">
                <div>
                  <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">
                    <span>{activeTeam.name}</span>
                    <span>/</span>
                    <span className="text-accent">{activeCategory}</span>
                  </div>
                  <h1 className="mt-2 font-display text-4xl sm:text-5xl uppercase tracking-tight text-foreground">
                    {activeCategory}
                  </h1>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => onFlyToTeamInVillage(activeTeam.id)}
                    className="pill border border-foreground/25 text-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer flex items-center gap-2"
                  >
                    <Compass className="h-3.5 w-3.5 text-accent" />
                    <span>View Bay in 3D Village</span>
                  </button>
                  <EditButton
                    onClick={() =>
                      setCategoryDialog({
                        open: true,
                        teamId: activeTeam.id,
                        category: { name: activeCategory },
                      })
                    }
                    title="Rename category"
                  />
                  <ConfirmButton
                    onConfirm={async () => {
                      await onDeleteCategory(activeTeam.id, activeCategory);
                      toast.success("Category deleted");
                      setNav({ level: "team", teamId: activeTeam.id });
                    }}
                    title="Delete category"
                  />
                </div>
              </div>
            </div>

            {/* SOPs List */}
            <section className="pt-2">
              <div className="mb-6 flex items-center gap-4">
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
                  Procedures & Links ({categorySops.length})
                </h2>
                <span className="h-px flex-1 bg-foreground/15" />
              </div>

              {categorySops.length === 0 ? (
                <div className="flex flex-col items-center rounded-4xl border border-border bg-card px-6 py-16 text-center">
                  <h3 className="font-display text-3xl uppercase tracking-tight text-foreground">
                    No SOPs yet
                  </h3>
                  <p className="mt-3 max-w-sm text-sm text-muted-foreground">
                    Add standard operating procedures or document links to this category.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      setSopDialog({
                        open: true,
                        teamId: activeTeam.id,
                        categoryId: activeCategory,
                        sop: null,
                      })
                    }
                    className="pill mt-8 bg-accent text-accent-foreground hover:opacity-90 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add SOP
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {categorySops.map((sop, idx) => (
                    <SopRowItem
                      key={sop.id}
                      sop={{
                        id: sop.id,
                        title: sop.title,
                        url: sop.contentLink,
                        content:
                          sop.summary ||
                          sop.steps?.map((st) => `${st.order}. ${st.title}: ${st.description}`).join("\n"),
                      }}
                      index={idx}
                      onEdit={() =>
                        setSopDialog({
                          open: true,
                          teamId: activeTeam.id,
                          categoryId: activeCategory,
                          sop: {
                            id: sop.id,
                            title: sop.title,
                            url: sop.contentLink,
                            content: sop.summary,
                            category: activeCategory,
                          },
                        })
                      }
                      onDelete={async () => {
                        await onDeleteSOP(sop.id);
                        toast.success("SOP deleted");
                      }}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-foreground/15 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6">
          <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-muted-foreground">
            BAY AREA™ · SOP HUB FOR GREYORANGE
          </p>
          <button
            type="button"
            onClick={onFlipToVillage}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-accent transition-colors cursor-pointer"
          >
            <Compass className="h-3.5 w-3.5" />
            <span>Switch to 3D Village Canvas [F]</span>
          </button>
        </div>
      </footer>

      {/* Team Dialog */}
      <TeamDialog
        open={teamDialog.open}
        onClose={() => setTeamDialog({ open: false, team: null })}
        team={teamDialog.team}
        onSave={async (data) => {
          if (data.id) {
            await onUpdateTeam({ id: data.id, name: data.name, description: data.description });
            toast.success("Team updated");
          } else {
            await onCreateTeam({ name: data.name, description: data.description });
            toast.success("Team created");
          }
        }}
      />

      {/* Category Dialog */}
      <CategoryDialog
        open={categoryDialog.open}
        onClose={() => setCategoryDialog({ open: false, teamId: "", category: null })}
        teamId={categoryDialog.teamId}
        category={categoryDialog.category}
        onSave={async (data) => {
          if (data.oldName) {
            await onUpdateCategory(data.teamId, data.oldName, data.name);
            toast.success("Category renamed");
            if (activeCategory === data.oldName) {
              setNav({ level: "category", teamId: data.teamId, categoryName: data.name });
            }
          } else {
            await onCreateCategory(data.teamId, data.name);
            toast.success("Category created");
          }
        }}
      />

      {/* SOP Dialog */}
      <SopDialog
        open={sopDialog.open}
        onClose={() =>
          setSopDialog({
            open: false,
            teamId: "",
            categoryId: null,
            sop: null,
          })
        }
        teamId={sopDialog.teamId}
        categoryId={sopDialog.categoryId}
        sop={sopDialog.sop}
        availableCategories={activeTeam?.categories || []}
        onSave={async (data) => {
          if (data.id) {
            await onUpdateSOP({
              id: data.id,
              teamId: data.teamId,
              categoryId: data.categoryId,
              title: data.title,
              kind: data.kind,
              url: data.url,
              content: data.content,
            });
            toast.success("SOP updated");
          } else {
            await onCreateSOP({
              teamId: data.teamId,
              categoryId: data.categoryId,
              title: data.title,
              kind: data.kind,
              url: data.url,
              content: data.content,
            });
            toast.success("SOP created");
          }
        }}
      />
    </div>
  );
}
