import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  Terminal,
  FolderPlus,
  Database,
  Layers,
  Compass,
  Maximize,
} from "lucide-react";
import { IsoScene, DistrictInfo, CategoryPartitionInfo } from "@/components/iso-scene";
import { INITIAL_VIEW, type View, type Hall, HALL_STEP, project } from "@/lib/iso";
import {
  Team,
  SOP,
  INITIAL_TEAMS,
  INITIAL_SOPS,
  getDistrictOrigin,
  getDistrictCenter,
  getTeamDistrictBounds,
  getCategoryPartitionCoords,
  getCategorySopCoords,
} from "@/lib/teams-sops";
import { SopDataService } from "@/lib/mongodb";
import { ScifiTerminal } from "@/components/scifi-terminal";
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { CreateSOPDialog } from "@/components/create-sop-dialog";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { TeamHQDialog } from "@/components/team-hq-dialog";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "GreyOrange — Operations & SOP Command" },
      {
        name: "description",
        content:
          "Mission-critical operations and Standard Operating Procedure (SOP) command canvas for GreyOrange robotics teams.",
      },
      { property: "og:title", content: "GreyOrange — Operations & SOP Command" },
      {
        property: "og:description",
        content:
          "Mission-critical operations and Standard Operating Procedure (SOP) command canvas for GreyOrange robotics teams.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Stat({ label, value, unit, highlight }: { label: string; value: string; unit?: string; highlight?: boolean }) {
  return (
    <div>
      <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">{label}</div>
      <div className={`mt-0.5 font-display text-2xl font-bold leading-none md:text-[28px] ${highlight ? "text-accent" : ""}`}>
        {value}
        {unit && (
          <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">{unit}</span>
        )}
      </div>
    </div>
  );
}

function Index() {
  const [teams, setTeams] = useState<Team[]>(INITIAL_TEAMS);
  const [sops, setSops] = useState<SOP[]>(INITIAL_SOPS);
  const [activeTeamId, setActiveTeamId] = useState<string>("team-cac");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedTeamHQId, setSelectedTeamHQId] = useState<string | null>(null);
  const [view, setView] = useState<View>(INITIAL_VIEW);
  const [canvasSize, setCanvasSize] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });
  const [selectionCollapsed, setSelectionCollapsed] = useState(false);
  const [isTerminalOpen, setIsTerminalOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateSOPOpen, setIsCreateSOPOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [categoryDialogTeamId, setCategoryDialogTeamId] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);

  const animationRef = useRef<number | null>(null);
  const viewRef = useRef(view);
  viewRef.current = view;

  // Load teams and SOPs on mount
  useEffect(() => {
    SopDataService.getTeams().then(setTeams);
    SopDataService.getAllSOPs().then(setSops);
  }, []);

  const activeTeam = useMemo(
    () => teams.find((t) => t.id === activeTeamId) || teams[0] || INITIAL_TEAMS[0],
    [teams, activeTeamId],
  );

  const activeTeamCategories = useMemo(
    () =>
      activeTeam.categories && activeTeam.categories.length > 0
        ? activeTeam.categories
        : ["General Protocols", "Alert & Incident SOPs"],
    [activeTeam],
  );

  const teamSops = useMemo(
    () => sops.filter((s) => s.teamId === activeTeam.id),
    [sops, activeTeam.id],
  );

  const categorySopCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const c of activeTeamCategories) counts[c] = 0;
    for (const s of teamSops) {
      const c = activeTeamCategories.includes(s.category) ? s.category : activeTeamCategories[0];
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [activeTeamCategories, teamSops]);

  const selectedSop = useMemo(
    () => sops.find((s) => s.id === selectedId) || null,
    [sops, selectedId],
  );

  const hqTeam = useMemo(
    () => teams.find((t) => t.id === selectedTeamHQId) || null,
    [teams, selectedTeamHQId],
  );

  const hqTeamIndex = Math.max(0, teams.findIndex((t) => t.id === selectedTeamHQId));

  const hqTeamSops = useMemo(
    () => (selectedTeamHQId ? sops.filter((s) => s.teamId === selectedTeamHQId) : []),
    [sops, selectedTeamHQId],
  );

  // Map ALL SOPs across all teams onto their designated category partition bays.
  // Map ALL SOPs across all teams onto their designated category partition bays.
  // Each category bay groups SOPs in a 3-column grid that expands in depth as more SOPs are added.
  const halls: Hall[] = useMemo(() => {
    const result: Hall[] = [];

    teams.forEach((team, teamIdx) => {
      const teamCategories =
        team.categories && team.categories.length > 0
          ? team.categories
          : ["General Protocols", "Alert & Incident SOPs"];

      const teamSopsList = sops.filter((s) => s.teamId === team.id);

      // Compute SOP count per category for row offset calculations
      const catCounts = teamCategories.map(
        (c, cIdx) =>
          teamSopsList.filter(
            (s) => s.category === c || (cIdx === 0 && !teamCategories.includes(s.category)),
          ).length,
      );

      const catSopCounter = new Map<string, number>();

      teamSopsList.forEach((s) => {
        let cat = s.category;
        let catIdx = teamCategories.indexOf(cat);
        if (catIdx === -1) {
          catIdx = 0;
          cat = teamCategories[0];
        }

        const sopIdxInCat = catSopCounter.get(cat) ?? 0;
        catSopCounter.set(cat, sopIdxInCat + 1);

        const coords = getCategorySopCoords(teamIdx, catIdx, sopIdxInCat, catCounts);

        result.push({
          id: s.id,
          name: s.code.replace("SOP-", ""),
          gx: coords.gx,
          gy: coords.gy,
          row: coords.row,
          load: s.load ?? 80,
          alert: s.alert ?? s.priority === "CRITICAL",
          teamId: s.teamId,
          teamCode: team.code,
        });
      });
    });

    return result;
  }, [sops, teams]);

  // Aggregate Category Bay partition plates with dynamically expanding dimensions
  const categoryPartitionsData: CategoryPartitionInfo[] = useMemo(() => {
    const list: CategoryPartitionInfo[] = [];

    teams.forEach((t, teamIdx) => {
      const teamCategories =
        t.categories && t.categories.length > 0
          ? t.categories
          : ["General Protocols", "Alert & Incident SOPs"];

      const teamSopsList = sops.filter((s) => s.teamId === t.id);
      const catCounts = teamCategories.map(
        (c, cIdx) =>
          teamSopsList.filter(
            (s) => s.category === c || (cIdx === 0 && !teamCategories.includes(s.category)),
          ).length,
      );

      teamCategories.forEach((catName, catIdx) => {
        const countInCat = catCounts[catIdx];
        const part = getCategoryPartitionCoords(teamIdx, catIdx, countInCat, catCounts);

        list.push({
          id: `${t.id}__${catName}`,
          teamId: t.id,
          teamCode: t.code,
          teamIndex: teamIdx,
          catIndex: catIdx,
          name: catName,
          sopCount: countInCat,
          originGx: part.originGx,
          originGy: part.originGy,
          width: part.width,
          depth: part.depth,
          isActive: t.id === activeTeamId,
        });
      });
    });

    return list;
  }, [teams, sops, activeTeamId]);

  // Aggregate dynamic district telemetry and dynamically expanding bounds!
  const districtsData: DistrictInfo[] = useMemo(() => {
    return teams.map((t, idx) => {
      const origin = getDistrictOrigin(idx);
      const teamSopsList = sops.filter((s) => s.teamId === t.id);
      const teamCategories =
        t.categories && t.categories.length > 0
          ? t.categories
          : ["General Protocols", "Alert & Incident SOPs"];

      const categoryItems = teamCategories.map((c, cIdx) => ({
        name: c,
        sopCount: teamSopsList.filter(
          (s) => s.category === c || (cIdx === 0 && !teamCategories.includes(s.category)),
        ).length,
      }));

      const catCounts = categoryItems.map((c) => c.sopCount);
      const bounds = getTeamDistrictBounds(idx, categoryItems);

      const alertCount = teamSopsList.filter((s) => s.alert || s.priority === "CRITICAL").length;
      const avgCompliance = teamSopsList.length
        ? Math.round(teamSopsList.reduce((sum, s) => sum + s.load, 0) / teamSopsList.length)
        : 100;

      return {
        id: t.id,
        code: t.code,
        name: t.name,
        lead: t.lead,
        index: idx,
        sopCount: teamSopsList.length,
        alertCount,
        avgCompliance,
        baseGx: origin.baseGx,
        baseGy: origin.baseGy,
        isActive: t.id === activeTeamId,
        bounds,
        catCounts,
      };
    });
  }, [teams, sops, activeTeamId]);

  // Smooth camera flight animation to glide to any district
  const animateCameraTo = (targetX: number, targetY: number, targetK?: number) => {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }

    const startX = viewRef.current.x;
    const startY = viewRef.current.y;
    const startK = viewRef.current.k;
    const finalK = targetK ?? (startK < 0.8 || startK > 1.6 ? 1.05 : startK);
    const startTime = performance.now();
    const duration = 750; // smooth 750ms flight animation

    const step = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(1, elapsed / duration);
      // Cubic ease-out curve: swift liftoff and gentle deceleration landing
      const ease = 1 - Math.pow(1 - progress, 3);

      const nextView: View = {
        x: startX + (targetX - startX) * ease,
        y: startY + (targetY - startY) * ease,
        k: startK + (finalK - startK) * ease,
      };

      setView(nextView);

      if (progress < 1) {
        animationRef.current = requestAnimationFrame(step);
      } else {
        animationRef.current = null;
      }
    };

    animationRef.current = requestAnimationFrame(step);
  };

  const navigateToTeam = (teamId: string) => {
    const teamIndex = teams.findIndex((t) => t.id === teamId);
    if (teamIndex === -1) return;

    setActiveTeamId(teamId);

    const team = teams[teamIndex];
    const teamSopsList = sops.filter((s) => s.teamId === team.id);
    const teamCategories =
      team.categories && team.categories.length > 0
        ? team.categories
        : ["General Protocols", "Alert & Incident SOPs"];
    const categoryItems = teamCategories.map((c, cIdx) => ({
      name: c,
      sopCount: teamSopsList.filter(
        (s) => s.category === c || (cIdx === 0 && !teamCategories.includes(s.category)),
      ).length,
    }));

    const center = getDistrictCenter(teamIndex, categoryItems);
    const p = project(center.gx, center.gy, 0);

    const targetK = 1.05;
    const targetX = canvasSize.width / 2 - p.px * targetK;
    const targetY = canvasSize.height / 2 - p.py * targetK;

    animateCameraTo(targetX, targetY, targetK);
  };

  const navigateToAllBays = () => {
    let minPx = Infinity;
    let maxPx = -Infinity;
    let minPy = Infinity;
    let maxPy = -Infinity;

    const includePoint = (gx: number, gy: number) => {
      const p = project(gx, gy, 0);
      if (p.px < minPx) minPx = p.px;
      if (p.px > maxPx) maxPx = p.px;
      if (p.py < minPy) minPy = p.py;
      if (p.py > maxPy) maxPy = p.py;
    };

    categoryPartitionsData.forEach((cp) => {
      includePoint(cp.originGx, cp.originGy);
      includePoint(cp.originGx + cp.width, cp.originGy);
      includePoint(cp.originGx + cp.width, cp.originGy + cp.depth);
      includePoint(cp.originGx, cp.originGy + cp.depth);
    });

    districtsData.forEach((d) => {
      includePoint(d.bounds.ox, d.bounds.oy);
      includePoint(d.bounds.ox + d.bounds.width, d.bounds.oy);
      includePoint(d.bounds.ox + d.bounds.width, d.bounds.oy + d.bounds.depth);
      includePoint(d.bounds.ox, d.bounds.oy + d.bounds.depth);
    });

    halls.forEach((h) => {
      includePoint(h.gx, h.gy);
      includePoint(h.gx + 3, h.gy + 2);
    });

    if (!isFinite(minPx) || !isFinite(maxPx) || maxPx <= minPx) return;

    const pad = 100;
    const availW = Math.max(200, canvasSize.width - pad * 2);
    const availH = Math.max(200, canvasSize.height - pad * 2);
    const fitK = Math.max(0.005, Math.min(availW / (maxPx - minPx), availH / (maxPy - minPy), 1.0));
    const midPx = (minPx + maxPx) / 2;
    const midPy = (minPy + maxPy) / 2;

    const targetX = canvasSize.width / 2 - midPx * fitK;
    const targetY = canvasSize.height / 2 - midPy * fitK;

    animateCameraTo(targetX, targetY, fitK);
  };

  // Initial camera framing on first load
  const initialFramedRef = useRef(false);
  useEffect(() => {
    if (!initialFramedRef.current && canvasSize.width > 0 && canvasSize.height > 0) {
      initialFramedRef.current = true;
      const team0 = teams[0];
      const team0Sops = sops.filter((s) => s.teamId === team0?.id);
      const team0Cats =
        team0?.categories?.map((c, cIdx) => ({
          name: c,
          sopCount: team0Sops.filter(
            (s) => s.category === c || (cIdx === 0 && !team0.categories?.includes(s.category)),
          ).length,
        })) || [];
      const center = getDistrictCenter(0, team0Cats);
      const p = project(center.gx, center.gy, 0);
      const k = 1.05;
      setView({
        x: canvasSize.width / 2 - p.px * k,
        y: canvasSize.height / 2 - p.py * k,
        k,
      });
    }
  }, [canvasSize, teams, sops]);

  const avgCompliance = teamSops.length
    ? Math.round(teamSops.reduce((sum, s) => sum + s.load, 0) / teamSops.length)
    : 100;

  const criticalCount = teamSops.filter((s) => s.priority === "CRITICAL" || s.alert).length;

  const handleOpenTerminal = (id?: string) => {
    if (id) setSelectedId(id);
    setIsTerminalOpen(true);
  };

  const handleSelectHall = (id: string | null) => {
    setSelectedId(id);
    if (id) {
      const clickedSop = sops.find((s) => s.id === id);
      if (clickedSop && clickedSop.teamId !== activeTeamId) {
        setActiveTeamId(clickedSop.teamId);
      }
    }
  };

  const handleSelectTeamHQ = (teamId: string) => {
    setSelectedTeamHQId(teamId);
    setActiveTeamId(teamId);
  };

  const handleUpdateTeam = async (updatedTeam: Team) => {
    const updatedTeams = await SopDataService.saveTeam(updatedTeam);
    setTeams(updatedTeams);
  };

  const handleSaveSOP = async (updatedSop: SOP) => {
    const updatedList = await SopDataService.saveSOP(updatedSop);
    setSops(updatedList);
  };

  const handleDeleteSOP = async () => {
    if (!selectedId) return;
    const updatedList = await SopDataService.deleteSOP(selectedId);
    setSops(updatedList);
    setSelectedId(null);
  };

  const handleCreateTeam = async (newTeam: Team) => {
    const updatedTeams = await SopDataService.saveTeam(newTeam);
    setTeams(updatedTeams);
    // Smoothly fly camera to the newly added team's town sector!
    setTimeout(() => {
      navigateToTeam(newTeam.id);
    }, 50);
  };

  const handleCreateSOP = async (newSop: SOP) => {
    const updatedList = await SopDataService.saveSOP(newSop);
    setSops(updatedList);
    setSelectedId(newSop.id);
  };

  const handleAddCategory = async (teamId: string, categoryName: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return;

    const currentCats = targetTeam.categories || [];
    if (currentCats.some((c) => c.toLowerCase() === categoryName.toLowerCase())) return;

    const updatedTeam: Team = {
      ...targetTeam,
      categories: [...currentCats, categoryName],
    };

    const updatedTeams = await SopDataService.saveTeam(updatedTeam);
    setTeams(updatedTeams);
  };

  const handleDeleteCategory = async (teamId: string, categoryName: string) => {
    const targetTeam = teams.find((t) => t.id === teamId);
    if (!targetTeam) return;

    const sopsInCat = sops.filter((s) => s.teamId === teamId && s.category === categoryName);
    if (sopsInCat.length > 0) {
      alert(`Cannot delete category "${categoryName}" because it contains ${sopsInCat.length} SOPs.`);
      return;
    }

    const updatedTeam: Team = {
      ...targetTeam,
      categories: (targetTeam.categories || []).filter((c) => c !== categoryName),
    };

    const updatedTeams = await SopDataService.saveTeam(updatedTeam);
    setTeams(updatedTeams);
  };

  const handleOpenAddSopToCategory = (teamId: string, categoryName: string) => {
    setActiveTeamId(teamId);
    setPreselectedCategory(categoryName);
    setIsCreateSOPOpen(true);
  };

  const handleOpenAddCategoryZone = (teamId: string) => {
    setActiveTeamId(teamId);
    setCategoryDialogTeamId(teamId);
    setIsCreateCategoryOpen(true);
  };

  // Keyboard shortcut: Delete key removes selected SOP block
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA") return;
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !isTerminalOpen) {
        e.preventDefault();
        handleDeleteSOP();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selectedId, isTerminalOpen]);

  const activeTeamIndex = Math.max(0, teams.findIndex((t) => t.id === activeTeam.id));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Top Cybernetic Nav Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 border-b border-border/60 bg-black/40 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded bg-accent font-display text-[15px] font-black leading-none text-black">
            G
          </div>
          <div className="flex flex-col">
            <span className="font-display text-sm font-bold tracking-[0.22em] text-foreground">
              GREY<span className="text-accent">ORANGE</span>
            </span>
            <span className="font-mono text-[9px] tracking-wider text-muted-foreground">
              ROBOTICS OPERATIONS COMMAND · CAMPUS TOWN
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-6 text-xs font-mono text-muted-foreground lg:flex">
          <span className="flex items-center gap-1.5 text-accent">
            <Database className="h-3.5 w-3.5" />
            <span>MONGODB CONNECTED</span>
          </span>
          <span className="text-border">|</span>
          <span className="flex items-center gap-1.5 text-foreground">
            <Compass className="h-3.5 w-3.5 text-accent animate-spin-slow" />
            <span>DISTRICT: {activeTeam.name.toUpperCase()} (0{activeTeamIndex + 1})</span>
          </span>
          <span className="text-border">|</span>
          <button
            onClick={navigateToAllBays}
            className="flex items-center gap-1.5 rounded border border-border/70 bg-panel/70 px-2.5 py-1 text-xs font-mono font-bold text-muted-foreground transition-all hover:border-accent hover:text-accent hover:bg-accent/10"
            title="Overview / Zoom out to frame all bay areas across campus"
          >
            <Maximize className="h-3.5 w-3.5 text-accent" />
            <span>ALL BAY AREAS</span>
          </button>
        </nav>

        <div className="flex items-center gap-2">
          <button
            onClick={navigateToAllBays}
            className="flex items-center gap-1.5 rounded border border-border px-2.5 py-1.5 font-mono text-xs font-bold text-muted-foreground transition-colors hover:border-accent hover:text-accent lg:hidden"
            title="Overview / Zoom out to frame all bay areas across campus"
          >
            <Maximize className="h-3.5 w-3.5 text-accent" />
            <span>ALL BAYS</span>
          </button>
          <button
            onClick={() => handleOpenAddCategoryZone(activeTeam.id)}
            className="hidden sm:flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-3 py-1.5 font-mono text-xs font-bold text-accent transition-colors hover:bg-accent/20"
          >
            <Layers className="h-3.5 w-3.5" />
            <span>+ CATEGORY BAY</span>
          </button>
          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded border border-border px-3 py-1.5 font-mono text-xs font-bold text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>+ NEW TEAM</span>
          </button>
          <button
            onClick={() => {
              setPreselectedCategory(undefined);
              setIsCreateSOPOpen(true);
            }}
            className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>+ CONFIGURE SOP</span>
          </button>
        </div>
      </header>

      {/* Main 2.5D Isometric Canvas */}
      <main className="relative min-h-0 flex-1 bg-[var(--ground)] overflow-hidden">
        <IsoScene
          halls={halls}
          districts={districtsData}
          categoryPartitions={categoryPartitionsData}
          selectedId={selectedId}
          onSelectHall={handleSelectHall}
          onSelectDistrict={navigateToTeam}
          onSelectTeamHQ={handleSelectTeamHQ}
          onOpenTerminal={handleOpenTerminal}
          onAddSopToCategory={handleOpenAddSopToCategory}
          onAddCategoryZone={handleOpenAddCategoryZone}
          onDeleteCategory={handleDeleteCategory}
          view={view}
          onViewChange={setView}
          onSizeChange={setCanvasSize}
        />

        {/* Top-Left Telemetry HUD */}
        <div className="pointer-events-none absolute left-5 top-4 flex items-start gap-6 md:left-8 md:top-5 md:gap-10">
          <div>
            <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground">CAMPUS DISTRICT 0{activeTeamIndex + 1}</div>
            <h1 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-wide text-accent md:text-xl">
              {activeTeam.name.toUpperCase()}
            </h1>
          </div>
          <Stat label="DISTRICT SOPS" value={String(teamSops.length)} unit="BLOCKS" />
          <div className="hidden sm:block">
            <Stat label="COMPLIANCE" value={`${avgCompliance}%`} highlight={avgCompliance >= 90} />
          </div>
          <Stat
            label="CRITICAL P1"
            value={String(criticalCount)}
            unit="ALERT"
            highlight={criticalCount > 0}
          />
        </div>

        {/* Selection Sidebar (Collapsible) */}
        {selectionCollapsed ? (
          <button
            onClick={() => setSelectionCollapsed(false)}
            aria-label="Expand selection panel"
            title="Expand selection panel"
            className="group absolute right-4 top-4 flex items-center gap-2.5 border border-border/80 bg-panel px-3 py-2 backdrop-blur-md transition-all hover:border-accent hover:bg-panel/95 md:right-8 md:top-5"
          >
            <ChevronLeft className="h-4 w-4 text-muted-foreground transition-transform group-hover:-translate-x-0.5 group-hover:text-accent" />
            <div className="text-left">
              <div className="font-mono text-[9px] tracking-[0.24em] text-muted-foreground">SOP REPOSITORY</div>
              <div className="font-display text-[13px] font-bold text-foreground">
                {teamSops.length} SOPs · {activeTeam.code}
              </div>
            </div>
            {selectedSop && (
              <span className="ml-1 rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-accent">
                {selectedSop.code}
              </span>
            )}
          </button>
        ) : (
          <aside className="absolute right-4 top-4 w-60 border border-border/70 bg-panel/95 p-4 backdrop-blur-md transition-all md:right-8 md:top-5 md:w-72 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-mono text-[10px] tracking-[0.28em] text-muted-foreground">SOP REPOSITORY</div>
                <div className="mt-1 font-display text-[16px] font-bold tracking-wide">
                  {teamSops.length} SOPs · {activeTeam.code}
                </div>
              </div>
              <button
                onClick={() => setSelectionCollapsed(true)}
                title="Collapse panel"
                aria-label="Collapse panel"
                className="mt-0.5 -mr-1 rounded p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* SOP List organized by Category Partition Bays */}
            <div className="custom-scrollbar mt-3 max-h-[50vh] space-y-4 overflow-y-auto pr-1">
              {activeTeamCategories.map((catName) => {
                const sopsInCat = teamSops.filter(
                  (s) =>
                    s.category === catName ||
                    (catName === activeTeamCategories[0] &&
                      !activeTeamCategories.includes(s.category)),
                );

                return (
                  <div key={catName} className="space-y-1.5 rounded border border-border/40 bg-black/40 p-2.5">
                    {/* Category Header */}
                    <div className="flex items-center justify-between border-b border-border/60 pb-1.5">
                      <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-accent">
                        <Layers className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[140px]">{catName}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[9px] text-muted-foreground">
                          {sopsInCat.length}
                        </span>
                        <button
                          onClick={() => handleOpenAddSopToCategory(activeTeam.id, catName)}
                          title={`Add SOP to ${catName}`}
                          className="rounded p-0.5 text-accent hover:bg-accent/20 transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        {sopsInCat.length === 0 && (
                          <button
                            onClick={() => handleDeleteCategory(activeTeam.id, catName)}
                            title={`Remove empty category ${catName}`}
                            className="rounded p-0.5 text-destructive hover:bg-destructive/20 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SOP Items inside Category */}
                    {sopsInCat.length === 0 ? (
                      <div className="py-2 text-center font-mono text-[10px] text-muted-foreground/60 italic">
                        Empty bay ·{" "}
                        <button
                          onClick={() => handleOpenAddSopToCategory(activeTeam.id, catName)}
                          className="text-accent underline not-italic font-bold"
                        >
                          + Add SOP
                        </button>
                      </div>
                    ) : (
                      sopsInCat.map((s) => {
                        const active = s.id === selectedId;
                        return (
                          <button
                            key={s.id}
                            onClick={() => setSelectedId(active ? null : s.id)}
                            onDoubleClick={() => handleOpenTerminal(s.id)}
                            className={`flex w-full flex-col rounded p-2 text-left transition-all ${
                              active
                                ? "border border-accent/60 bg-accent/15"
                                : "border border-transparent bg-white/[0.02] hover:bg-white/[0.06]"
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`font-mono text-xs font-bold ${active ? "text-accent" : "text-foreground"}`}>
                                {s.code}
                              </span>
                              <span
                                className={`text-[9px] font-mono px-1 rounded ${
                                  s.priority === "CRITICAL"
                                    ? "bg-destructive/20 text-destructive font-bold"
                                    : "text-muted-foreground"
                                }`}
                              >
                                {s.priority}
                              </span>
                            </div>

                            <div className="mt-1 text-[11px] truncate text-muted-foreground font-medium">
                              {s.title}
                            </div>

                            <div className="mt-2 flex items-center gap-2">
                              <span className="h-[3px] flex-1 overflow-hidden bg-muted rounded-full">
                                <span
                                  className="block h-full transition-all"
                                  style={{
                                    width: `${s.load}%`,
                                    background:
                                      s.alert || s.priority === "CRITICAL"
                                        ? "var(--destructive)"
                                        : active
                                          ? "var(--accent)"
                                          : "var(--foreground)",
                                  }}
                                />
                              </span>
                              <span className="font-mono text-[9px] text-muted-foreground">
                                {s.load}%
                              </span>
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                );
              })}

              {/* Add New Category Zone in Sidebar */}
              <button
                onClick={() => handleOpenAddCategoryZone(activeTeam.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded border border-dashed border-accent/40 bg-accent/5 p-2.5 font-mono text-[10px] font-bold text-accent transition-colors hover:bg-accent/15"
              >
                <Plus className="h-3 w-3" />
                <span>+ ADD CATEGORY ZONE</span>
              </button>
            </div>

            {/* Selected SOP Action Card */}
            {selectedSop && (
              <div className="mt-3 border-t border-border/60 pt-3">
                <button
                  onClick={() => handleOpenTerminal(selectedSop.id)}
                  className="flex w-full items-center justify-center gap-2 rounded bg-accent px-3 py-2 font-mono text-xs font-bold text-accent-foreground shadow-md transition-all hover:bg-accent/90"
                >
                  <Terminal className="h-3.5 w-3.5" />
                  <span>OPEN SCI-FI TERMINAL</span>
                </button>
              </div>
            )}
          </aside>
        )}

        {/* Campus Town Radar Minimap */}
        <div className="absolute bottom-4 left-5 border border-border/70 bg-panel/95 p-2.5 backdrop-blur-md md:left-8 rounded shadow-lg">
          <div className="flex items-center justify-between pb-1.5 font-mono text-[9px] text-muted-foreground tracking-wider border-b border-border/50">
            <span className="flex items-center gap-1 text-accent font-bold">
              <Compass className="h-3 w-3" /> CAMPUS RADAR
            </span>
            <span>{teams.length} DISTRICTS</span>
          </div>

          <svg viewBox="0 0 200 160" className="mt-1.5 block h-[96px] w-[140px] md:h-[120px] md:w-[180px]">
            {/* Background grid */}
            <rect x="0" y="0" width="200" height="160" fill="oklch(0.12 0.005 260)" rx="2" />
            <line x1="100" y1="4" x2="100" y2="156" stroke="oklch(0.25 0.008 260)" strokeDasharray="3 3" />
            <line x1="6" y1="40" x2="194" y2="40" stroke="oklch(0.22 0.008 260)" strokeDasharray="3 3" />
            <line x1="6" y1="78" x2="194" y2="78" stroke="oklch(0.22 0.008 260)" strokeDasharray="3 3" />
            <line x1="6" y1="116" x2="194" y2="116" stroke="oklch(0.22 0.008 260)" strokeDasharray="3 3" />

            {/* Render each district on radar */}
            {teams.map((t, idx) => {
              const col = idx % 2;
              const row = Math.floor(idx / 2);
              const dx = col === 0 ? 12 : 108;
              const dy = 10 + row * 36;
              const dw = 80;
              const dh = 31;
              const isCurrent = t.id === activeTeamId;
              const teamSopsList = sops.filter((s) => s.teamId === t.id);
              const teamCats =
                t.categories && t.categories.length > 0
                  ? t.categories
                  : ["General Protocols", "Alert & Incident SOPs"];

              return (
                <g
                  key={`radar-${t.id}`}
                  className="cursor-pointer group"
                  onClick={() => navigateToTeam(t.id)}
                >
                  {/* District footprint */}
                  <rect
                    x={dx}
                    y={dy}
                    width={dw}
                    height={dh}
                    rx="2"
                    fill={isCurrent ? "oklch(0.78 0.18 55 / 0.12)" : "oklch(0.18 0.005 260 / 0.5)"}
                    stroke={isCurrent ? "var(--accent)" : "oklch(0.3 0.01 260)"}
                    strokeWidth={isCurrent ? "1.5" : "1"}
                  />
                  <text
                    x={dx + 4}
                    y={dy + 8}
                    className="font-mono text-[7px] font-bold select-none pointer-events-none"
                    fill={isCurrent ? "var(--accent)" : "oklch(0.65 0.01 260)"}
                  >
                    0{idx + 1} {t.code}
                  </text>

                  {/* Mini HQ Building on radar (left for left teams, right for right teams) */}
                  <rect
                    x={col === 0 ? dx + 3 : dx + dw - 14}
                    y={dy + 11}
                    width="11"
                    height="16"
                    rx="1"
                    fill={isCurrent ? "var(--accent)" : "oklch(0.32 0.008 260)"}
                    stroke={isCurrent ? "var(--accent)" : "oklch(0.42 0.01 260)"}
                    strokeWidth="0.8"
                  />

                  {/* Category Partition Bays on Radar */}
                  {teamCats.slice(0, 4).map((cat, cIdx) => {
                    const cCol = cIdx % 2;
                    const cRow = Math.floor(cIdx / 2);
                    const catW = 27;
                    const catH = 9.5;
                    const startX = col === 0 ? dx + 17 : dx + 4;
                    const catX = startX + cCol * 29;
                    const catY = dy + 10 + cRow * 10;

                    return (
                      <rect
                        key={`mini-cat-${t.id}-${cat}`}
                        x={catX}
                        y={catY}
                        width={catW}
                        height={catH}
                        rx="1"
                        fill="oklch(0.16 0.005 260 / 0.5)"
                        stroke={isCurrent ? "oklch(0.78 0.18 55 / 0.3)" : "oklch(0.28 0.008 260)"}
                        strokeWidth="0.6"
                        strokeDasharray="2 2"
                      />
                    );
                  })}

                  {/* SOP block pips inside category bays */}
                  {teamSopsList.map((s, sIdx) => {
                    let catIdx = teamCats.indexOf(s.category);
                    if (catIdx === -1) catIdx = 0;
                    if (catIdx > 3) catIdx = 0;

                    const cCol = catIdx % 2;
                    const cRow = Math.floor(catIdx / 2);
                    const startX = col === 0 ? dx + 17 : dx + 4;
                    const catX = startX + cCol * 29;
                    const catY = dy + 10 + cRow * 10;

                    const sopsInCatBefore = teamSopsList
                      .slice(0, sIdx)
                      .filter((other) => other.category === s.category).length;

                    const pipCol = sopsInCatBefore % 3;
                    const pipRow = Math.floor(sopsInCatBefore / 3);
                    const px = catX + 2 + pipCol * 8.2;
                    const py = catY + 2 + pipRow * 4;
                    const isAlert = s.alert || s.priority === "CRITICAL";
                    const isSelected = s.id === selectedId;

                    return (
                      <rect
                        key={`sop-pip-${s.id}`}
                        x={px}
                        y={py}
                        width="6.5"
                        height="3"
                        rx="0.5"
                        fill={isAlert ? "var(--destructive)" : isSelected ? "var(--accent)" : "oklch(0.5 0.01 260)"}
                      />
                    );
                  })}
                </g>
              );
            })}
          </svg>
        </div>
      </main>

      {/* Bottom Footer: Dynamic GreyOrange Team Tabs + Action Buttons */}
      <footer className="flex h-12 shrink-0 items-center justify-between border-t border-border/60 bg-black/40 px-5 backdrop-blur-md md:px-8">
        <div className="flex items-center gap-4 overflow-x-auto font-mono text-[11px] tracking-wide md:gap-6 custom-scrollbar py-1">
          {teams.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => navigateToTeam(t.id)}
              className={`relative pb-0.5 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTeamId === t.id ? "text-accent font-bold" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <span>0{idx + 1} {t.code}</span>
              {activeTeamId === t.id && (
                <span className="absolute -bottom-[7px] left-0 right-0 h-[2px] bg-accent" />
              )}
            </button>
          ))}
          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="flex items-center gap-1 rounded border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-mono text-muted-foreground hover:border-accent hover:text-accent"
          >
            <Plus className="h-3 w-3" />
            <span>NEW TEAM</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {selectedSop && (
            <button
              onClick={() => handleOpenTerminal(selectedSop.id)}
              className="hidden sm:flex items-center gap-1.5 rounded-[4px] border border-accent/50 bg-accent/10 px-3 py-1.5 text-xs font-bold text-accent transition-colors hover:bg-accent/20"
            >
              <Terminal className="h-3.5 w-3.5" /> Terminal
            </button>
          )}
          <button
            onClick={() => handleOpenAddCategoryZone(activeTeam.id)}
            className="hidden md:flex items-center gap-1.5 rounded-[4px] border border-border px-2.5 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-accent hover:text-accent"
          >
            <Layers className="h-3.5 w-3.5 text-accent" /> + Category Bay
          </button>
          <button
            onClick={handleDeleteSOP}
            disabled={!selectedId}
            className="flex items-center gap-1.5 rounded-[4px] border border-border px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:border-destructive hover:text-destructive disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={2.5} /> Delete SOP
          </button>
          <button
            onClick={() => {
              setPreselectedCategory(undefined);
              setIsCreateSOPOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-[4px] bg-accent px-3 py-1.5 text-xs font-bold text-accent-foreground transition-colors hover:bg-accent/90"
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} /> Add SOP Block
          </button>
        </div>
      </footer>

      {/* Modals */}
      <ScifiTerminal
        sop={selectedSop}
        isOpen={isTerminalOpen}
        onClose={() => setIsTerminalOpen(false)}
        onSave={handleSaveSOP}
      />

      <CreateTeamDialog
        isOpen={isCreateTeamOpen}
        onClose={() => setIsCreateTeamOpen(false)}
        onCreate={handleCreateTeam}
      />

      <CreateCategoryDialog
        isOpen={isCreateCategoryOpen}
        onClose={() => setIsCreateCategoryOpen(false)}
        team={teams.find((t) => t.id === categoryDialogTeamId) || activeTeam}
        existingCategories={
          (teams.find((t) => t.id === categoryDialogTeamId) || activeTeam).categories || []
        }
        onCreateCategory={handleAddCategory}
      />

      <CreateSOPDialog
        isOpen={isCreateSOPOpen}
        onClose={() => setIsCreateSOPOpen(false)}
        team={activeTeam}
        teamIndex={activeTeamIndex}
        existingSopsCount={teamSops.length}
        defaultCategory={preselectedCategory}
        categorySopCounts={categorySopCounts}
        onCreate={handleCreateSOP}
        onAddNewCategory={handleOpenAddCategoryZone}
      />

      <TeamHQDialog
        team={hqTeam}
        teamIndex={hqTeamIndex}
        teamSops={hqTeamSops}
        isOpen={selectedTeamHQId !== null}
        onClose={() => setSelectedTeamHQId(null)}
        onUpdateTeam={handleUpdateTeam}
        onOpenSopTerminal={handleOpenTerminal}
        onFlyToDistrict={(teamId) => {
          setSelectedTeamHQId(null);
          navigateToTeam(teamId);
        }}
      />
    </div>
  );
}
