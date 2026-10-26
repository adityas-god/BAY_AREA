import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Trash2,
  FolderPlus,
  Database,
  Layers,
  Compass,
  Maximize,
  ExternalLink,
  Link2,
  Activity,
  ShieldAlert,
  Bot,
  Clock,
  AlertTriangle,
  Radio,
  ChevronDown,
  ChevronUp,
  Eye,
  EyeOff,
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
import { CreateTeamDialog } from "@/components/create-team-dialog";
import { CreateSOPDialog } from "@/components/create-sop-dialog";
import { CreateCategoryDialog } from "@/components/create-category-dialog";
import { TeamHQDialog } from "@/components/team-hq-dialog";
import { EditSopLinkDialog } from "@/components/edit-sop-link-dialog";
import { TeamSopWebsite } from "@/components/team-sop-website";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BAY AREA™ — SOP Hub for GreyOrange" },
      {
        name: "description",
        content:
          "BAY AREA — SOP Hub for GreyOrange operations, teams, categories and standard operating procedures.",
      },
      { property: "og:title", content: "BAY AREA™ — SOP Hub for GreyOrange" },
      {
        property: "og:description",
        content:
          "BAY AREA — SOP Hub for GreyOrange operations, teams, categories and standard operating procedures.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const [viewMode, setViewMode] = useState<"website" | "village">("website");
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
  const [hudCollapsed, setHudCollapsed] = useState(true);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [isCreateSOPOpen, setIsCreateSOPOpen] = useState(false);
  const [isCreateCategoryOpen, setIsCreateCategoryOpen] = useState(false);
  const [categoryDialogTeamId, setCategoryDialogTeamId] = useState<string | null>(null);
  const [sopDialogTeamId, setSopDialogTeamId] = useState<string | null>(null);
  const [preselectedCategory, setPreselectedCategory] = useState<string | undefined>(undefined);
  const [isEditLinkOpen, setIsEditLinkOpen] = useState(false);
  const [editLinkSop, setEditLinkSop] = useState<SOP | null>(null);

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

  // Target team for SOP creation dialog (ensures newly added SOPs map to the exact team & category)
  const targetSopTeam = useMemo(
    () => teams.find((t) => t.id === (sopDialogTeamId || activeTeamId)) || activeTeam,
    [teams, sopDialogTeamId, activeTeamId, activeTeam],
  );
  const targetSopTeamIndex = Math.max(
    0,
    teams.findIndex((t) => t.id === targetSopTeam.id),
  );
  const targetSopTeamSops = useMemo(
    () => sops.filter((s) => s.teamId === targetSopTeam.id),
    [sops, targetSopTeam.id],
  );
  const targetSopCategoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    const cats =
      targetSopTeam.categories && targetSopTeam.categories.length > 0
        ? targetSopTeam.categories
        : ["General Protocols", "Alert & Incident SOPs"];
    for (const c of cats) counts[c] = 0;
    for (const s of targetSopTeamSops) {
      const c = cats.includes(s.category) ? s.category : cats[0];
      counts[c] = (counts[c] || 0) + 1;
    }
    return counts;
  }, [targetSopTeam, targetSopTeamSops]);

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
          title: s.title,
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

  const handleOpenProcedure = (id?: string) => {
    const targetId = id || selectedId;
    if (!targetId) return;
    const targetSop = sops.find((s) => s.id === targetId);
    if (!targetSop) return;
    setSelectedId(targetId);
    if (targetSop.contentLink) {
      window.open(targetSop.contentLink, "_blank", "noopener,noreferrer");
    } else {
      setEditLinkSop(targetSop);
      setIsEditLinkOpen(true);
    }
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

  const handleSaveSopLink = async (sopId: string, contentLink: string, linkText: string) => {
    const target = sops.find((s) => s.id === sopId);
    if (!target) return;
    const updatedSop: SOP = {
      ...target,
      contentLink: contentLink || undefined,
      linkText: linkText || undefined,
    };
    const updatedList = await SopDataService.saveSOP(updatedSop);
    setSops(updatedList);
  };

  // Handlers for the Team SOP Hub website
  const handleWebsiteCreateTeam = async (data: { name: string; description: string | null }) => {
    const rawCode = data.name.slice(0, 3).toUpperCase().replace(/[^A-Z]/g, "TM") || "TM";
    const uniqueCode = teams.some((t) => t.code === rawCode) ? `${rawCode}${teams.length + 1}` : rawCode;
    const newTeam: Team = {
      id: `team-${Date.now()}`,
      code: uniqueCode,
      name: data.name,
      description: data.description || "",
      lead: "Team Lead",
      color: "#D9531E",
      categories: ["General Operations", "Troubleshooting", "Checklists"],
    };
    const updated = await SopDataService.saveTeam(newTeam);
    setTeams(updated);
  };

  const handleWebsiteUpdateTeam = async (data: { id: string; name: string; description: string | null }) => {
    const target = teams.find((t) => t.id === data.id);
    if (!target) return;
    const updatedTeam: Team = {
      ...target,
      name: data.name,
      description: data.description || "",
    };
    const updated = await SopDataService.saveTeam(updatedTeam);
    setTeams(updated);
  };

  const handleWebsiteDeleteTeam = async (teamId: string) => {
    const updatedTeams = await SopDataService.deleteTeam(teamId);
    setTeams(updatedTeams);
    const updatedSops = await SopDataService.getAllSOPs();
    setSops(updatedSops);
    if (activeTeamId === teamId && updatedTeams.length > 0) {
      setActiveTeamId(updatedTeams[0].id);
    }
  };

  const handleWebsiteCreateCategory = async (teamId: string, name: string) => {
    const updatedTeams = await SopDataService.addCategory(teamId, name);
    setTeams(updatedTeams);
  };

  const handleWebsiteUpdateCategory = async (teamId: string, oldName: string, newName: string) => {
    const updatedTeams = await SopDataService.updateCategory(teamId, oldName, newName);
    setTeams(updatedTeams);
    const updatedSops = await SopDataService.getAllSOPs();
    setSops(updatedSops);
  };

  const handleWebsiteDeleteCategory = async (teamId: string, name: string) => {
    const updatedTeams = await SopDataService.deleteCategory(teamId, name);
    setTeams(updatedTeams);
    const updatedSops = await SopDataService.getAllSOPs();
    setSops(updatedSops);
  };

  const handleWebsiteCreateSOP = async (data: {
    teamId: string;
    categoryId: string | null;
    title: string;
    kind: "link" | "note";
    url: string | null;
    content: string | null;
  }) => {
    const targetTeam = teams.find((t) => t.id === data.teamId) || activeTeam;
    const teamIndex = Math.max(0, teams.findIndex((t) => t.id === targetTeam.id));
    const teamSopsList = sops.filter((s) => s.teamId === targetTeam.id);
    const category = data.categoryId || targetTeam.categories?.[0] || "General Operations";
    const sopsInCat = teamSopsList.filter((s) => s.category === category);
    const code = `${targetTeam.code}-SOP-${String(teamSopsList.length + 1).padStart(2, "0")}`;

    const catIndex = Math.max(0, (targetTeam.categories || []).findIndex((c) => c === category));
    const catCounts = (targetTeam.categories || []).map(
      (c) => teamSopsList.filter((s) => s.category === c).length,
    );

    const coords = getCategorySopCoords(
      teamIndex,
      catIndex,
      sopsInCat.length,
      catCounts,
    );

    const newSop: SOP = {
      id: `sop-${Date.now()}`,
      teamId: data.teamId,
      code,
      title: data.title,
      category,
      priority: "MEDIUM",
      status: "ACTIVE",
      version: "v1.0",
      author: "Operations Lead",
      updatedAt: new Date().toISOString().slice(0, 10),
      summary: data.content || (data.url ? `Standard operating link: ${data.url}` : "Standard Procedure"),
      triggerCondition: "Operational procedure standard",
      steps: data.content
        ? [{ id: "step-1", order: 1, title: data.title, description: data.content }]
        : [{ id: "step-1", order: 1, title: "Review Procedure Link", description: `Access external documentation at ${data.url}` }],
      contentLink: data.url || undefined,
      linkText: data.url ? "Open SOP Document" : undefined,
      gx: coords.gx,
      gy: coords.gy,
      row: 0,
      load: 100,
      alert: false,
    };

    const updated = await SopDataService.saveSOP(newSop);
    setSops(updated);
  };

  const handleWebsiteUpdateSOP = async (data: {
    id: string;
    teamId: string;
    categoryId: string | null;
    title: string;
    kind: "link" | "note";
    url: string | null;
    content: string | null;
  }) => {
    const target = sops.find((s) => s.id === data.id);
    if (!target) return;
    const updatedSop: SOP = {
      ...target,
      title: data.title,
      category: data.categoryId || target.category,
      contentLink: data.url || undefined,
      linkText: data.url ? "Open SOP Document" : undefined,
      summary: data.content || target.summary,
    };
    const updated = await SopDataService.saveSOP(updatedSop);
    setSops(updated);
  };

  const handleWebsiteDeleteSOP = async (sopId: string) => {
    const updated = await SopDataService.deleteSOP(sopId);
    setSops(updated);
  };

  // Keyboard shortcut: Delete key removes selected SOP block, 'F' flips view
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return;
      if (e.key === "f" || e.key === "F") {
        e.preventDefault();
        setViewMode((m) => (m === "website" ? "village" : "website"));
        return;
      }
      if (
        isCreateTeamOpen ||
        isCreateSOPOpen ||
        isCreateCategoryOpen ||
        isEditLinkOpen ||
        selectedTeamHQId
      ) {
        return;
      }
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        e.preventDefault();
        handleDeleteSOP();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [
    selectedId,
    isCreateTeamOpen,
    isCreateSOPOpen,
    isCreateCategoryOpen,
    isEditLinkOpen,
    selectedTeamHQId,
  ]);

  if (viewMode === "website") {
    return (
      <TeamSopWebsite
        teams={teams}
        sops={sops}
        onFlipToVillage={() => setViewMode("village")}
        onFlyToTeamInVillage={(teamId) => {
          navigateToTeam(teamId);
          setViewMode("village");
        }}
        onCreateTeam={handleWebsiteCreateTeam}
        onUpdateTeam={handleWebsiteUpdateTeam}
        onDeleteTeam={handleWebsiteDeleteTeam}
        onCreateCategory={handleWebsiteCreateCategory}
        onUpdateCategory={handleWebsiteUpdateCategory}
        onDeleteCategory={handleWebsiteDeleteCategory}
        onCreateSOP={handleWebsiteCreateSOP}
        onUpdateSOP={handleWebsiteUpdateSOP}
        onDeleteSOP={handleWebsiteDeleteSOP}
      />
    );
  }

  const activeTeamIndex = Math.max(0, teams.findIndex((t) => t.id === activeTeam.id));

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-background text-foreground">
      {/* Dark Deco Nav Header */}
      <header className="flex h-14 shrink-0 items-center justify-between gap-4 bg-[#101114] border-b border-zinc-800/80 px-5 md:px-8 shadow-md">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-[#D9531E] font-display text-lg font-bold leading-none text-white">
            G
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-base font-bold tracking-wider text-white uppercase">
                BAY <span className="text-orange-400">AREA</span>
              </span>
              <span className="text-[9px] font-sans font-bold text-orange-400">™</span>
            </div>
            <span className="text-[10px] text-zinc-400 font-mono -mt-0.5 tracking-wider uppercase">
              SOP HUB FOR GREYORANGE
            </span>
          </div>
        </div>

        <nav className="hidden items-center gap-4 text-xs font-sans text-zinc-400 md:flex">
          <span className="flex items-center gap-1.5 text-white font-medium">
            <Compass className="h-3.5 w-3.5 text-orange-400" />
            <span>Campus District: <strong className="text-white">{activeTeam.name}</strong></span>
          </span>
        </nav>

        <div className="flex items-center gap-2.5 font-sans">
          <button
            onClick={() => setViewMode("website")}
            className="flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#C84814] cursor-pointer shadow-sm"
            title="Switch to SOP Hub Website [F]"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            <span>SOP Hub</span>
            <kbd className="hidden sm:inline font-mono text-[9px] opacity-75 ml-0.5">[F]</kbd>
          </button>

          <button
            onClick={navigateToAllBays}
            className="hidden lg:flex items-center gap-1.5 rounded bg-zinc-900 px-2.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            title="Overview / Zoom out to frame all bay areas"
          >
            <Maximize className="h-3.5 w-3.5" />
            <span>All Bays</span>
          </button>

          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="hidden sm:flex items-center gap-1.5 rounded bg-zinc-900 px-3 py-1.5 text-xs font-medium text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <FolderPlus className="h-3.5 w-3.5" />
            <span>+ Team</span>
          </button>
          <button
            onClick={() => {
              setPreselectedCategory(undefined);
              setSopDialogTeamId(activeTeam.id);
              setIsCreateSOPOpen(true);
            }}
            className="flex items-center gap-1.5 rounded bg-[#D9531E] px-3.5 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#C84814]"
          >
            <Plus className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>+ SOP</span>
          </button>
        </div>
      </header>

      {/* Main 2.5D Isometric Canvas */}
      <main className="relative min-h-0 flex-1 bg-[var(--ground)] overflow-hidden">
        {/* Background Clash of Clans 2.5D Village Canvas */}
        <div className="relative h-full w-full">
          <IsoScene
          halls={halls}
          districts={districtsData}
          categoryPartitions={categoryPartitionsData}
          selectedId={selectedId}
          onSelectHall={handleSelectHall}
          onSelectDistrict={navigateToTeam}
          onSelectTeamHQ={handleSelectTeamHQ}
          onOpenProcedure={handleOpenProcedure}
          onAddSopToCategory={handleOpenAddSopToCategory}
          onAddCategoryZone={handleOpenAddCategoryZone}
          onDeleteCategory={handleDeleteCategory}
          view={view}
          onViewChange={setView}
          onSizeChange={setCanvasSize}
        />
        </div>

        {/* Telemetry Info Area — Clean Robotics Data Style with Collapse Toggle */}
        <div className="absolute left-5 top-4 z-20 pointer-events-auto md:left-8 md:top-5 select-none">
          {hudCollapsed ? (
            /* Collapsed State: Minimal Tag */
            <button
              onClick={() => setHudCollapsed(false)}
              title="Expand District Telemetry"
              className="group flex items-center gap-2 rounded border border-white/10 bg-black/60 px-2.5 py-1 backdrop-blur-md transition-all hover:border-accent hover:bg-black/80"
            >
              <span className="font-mono text-[9px] tracking-[0.2em] text-muted-foreground">CAMPUS 0{activeTeamIndex + 1}</span>
              <span className="font-display text-xs font-bold text-accent">{activeTeam.name.toUpperCase()}</span>
              <span className="font-mono text-[10px] text-muted-foreground">· {teamSops.length} BLOCKS</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground transition-transform group-hover:translate-y-0.5 group-hover:text-accent" />
            </button>
          ) : (
            /* Expanded State: Exact Clean Typography Data Style with Close/Collapse Icon */
            <div className="relative flex items-start gap-6 md:gap-9 animate-in fade-in duration-150">
              {/* Team / District */}
              <div>
                <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground font-medium">
                  CAMPUS DISTRICT 0{activeTeamIndex + 1}
                </div>
                <h1 className="mt-0.5 font-display text-lg font-bold leading-[1.15] tracking-wide text-accent md:text-xl">
                  {activeTeam.name.toUpperCase()}
                </h1>
              </div>

              {/* District SOPs */}
              <div>
                <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground font-medium">
                  DISTRICT SOPS
                </div>
                <div className="mt-0.5 font-display text-2xl font-bold leading-none md:text-[28px] text-foreground">
                  {teamSops.length}
                  <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">BLOCKS</span>
                </div>
              </div>

              {/* Compliance */}
              <div className="hidden sm:block">
                <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground font-medium">
                  COMPLIANCE
                </div>
                <div className={`mt-0.5 font-display text-2xl font-bold leading-none md:text-[28px] ${avgCompliance >= 90 ? "text-accent" : "text-foreground"}`}>
                  {avgCompliance}%
                </div>
              </div>

              {/* Critical P1 */}
              <div>
                <div className="font-mono text-[10px] tracking-[0.24em] text-muted-foreground font-medium">
                  CRITICAL P1
                </div>
                <div className={`mt-0.5 font-display text-2xl font-bold leading-none md:text-[28px] ${criticalCount > 0 ? "text-accent" : "text-foreground"}`}>
                  {criticalCount}
                  <span className="ml-1 font-mono text-[11px] font-medium text-muted-foreground">ALERT</span>
                </div>
              </div>

              {/* Collapse Button */}
              <button
                onClick={() => setHudCollapsed(true)}
                title="Collapse Panel"
                className="mt-1 flex h-6 w-6 items-center justify-center rounded-lg bg-black/50 text-zinc-400 transition-all hover:text-white"
              >
                <ChevronUp className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>

        {/* Selection Sidebar (Collapsible) */}
        {selectionCollapsed ? (
          <button
            onClick={() => setSelectionCollapsed(false)}
            aria-label="Expand SOP repository"
            title="Expand SOP repository"
            className="group absolute right-4 top-4 z-20 flex items-center gap-2 rounded-lg bg-black/80 px-3.5 py-2 backdrop-blur-md transition-all hover:bg-black/95 md:right-6 md:top-4 shadow-xl"
          >
            <ChevronLeft className="h-3.5 w-3.5 text-zinc-400 transition-transform group-hover:-translate-x-0.5 group-hover:text-orange-400" />
            <span className="font-display text-xs tracking-wider text-zinc-400">SOPS</span>
            <span className="font-display text-sm tracking-wide text-white">
              {teamSops.length} · {activeTeam.code}
            </span>
            {selectedSop && (
              <span className="rounded bg-[#24130A] border border-orange-500/30 px-2 py-0.5 font-display text-xs text-orange-300">
                {selectedSop.code}
              </span>
            )}
          </button>
        ) : (
          <aside className="absolute right-4 top-4 z-20 w-64 rounded-xl bg-black/90 p-4 backdrop-blur-xl transition-all md:right-6 md:top-4 md:w-72 shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between pb-2">
              <div>
                <div className="font-display text-xs tracking-wider text-zinc-400">SOP REPOSITORY</div>
                <div className="font-display text-base tracking-wide text-white">
                  {teamSops.length} SOPs · {activeTeam.code}
                </div>
              </div>
              <button
                onClick={() => setSelectionCollapsed(true)}
                title="Collapse panel"
                aria-label="Collapse panel"
                className="rounded-lg p-1 text-zinc-400 transition-colors hover:bg-white/10 hover:text-white"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>

            {/* SOP List organized by Category */}
            <div className="custom-scrollbar mt-2 max-h-[55vh] space-y-3 overflow-y-auto pr-1">
              {activeTeamCategories.map((catName) => {
                const sopsInCat = teamSops.filter(
                  (s) =>
                    s.category === catName ||
                    (catName === activeTeamCategories[0] &&
                      !activeTeamCategories.includes(s.category)),
                );

                return (
                  <div key={catName} className="space-y-1">
                    {/* Category Title */}
                    <div className="flex items-center justify-between py-1 text-xs">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-semibold text-accent/90">
                        <Layers className="h-3 w-3 shrink-0" />
                        <span className="truncate max-w-[150px]">{catName}</span>
                      </div>
                      <div className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
                        <span>{sopsInCat.length}</span>
                        <button
                          onClick={() => handleOpenAddSopToCategory(activeTeam.id, catName)}
                          title={`Add SOP to ${catName}`}
                          className="rounded p-0.5 hover:text-accent transition-colors"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                        {sopsInCat.length === 0 && (
                          <button
                            onClick={() => handleDeleteCategory(activeTeam.id, catName)}
                            title={`Remove empty category ${catName}`}
                            className="rounded p-0.5 text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* SOP Cards */}
                    {sopsInCat.length === 0 ? (
                      <div className="py-1.5 text-center font-mono text-[10px] text-muted-foreground/50 italic">
                        Empty bay ·{" "}
                        <button
                          onClick={() => handleOpenAddSopToCategory(activeTeam.id, catName)}
                          className="text-accent underline not-italic"
                        >
                          + Add SOP
                        </button>
                      </div>
                    ) : (
                      sopsInCat.map((s) => {
                        const active = s.id === selectedId;
                        return (
                          <div
                            key={s.id}
                            onClick={() => setSelectedId(active ? null : s.id)}
                            onDoubleClick={() => handleOpenProcedure(s.id)}
                            className={`group flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 cursor-pointer transition-colors ${
                              active
                                ? "bg-[#28150C] border border-orange-500/30"
                                : "bg-zinc-900/60 hover:bg-zinc-900"
                            }`}
                          >
                            <div className="flex flex-col min-w-0 flex-1">
                              <span className={`font-display text-xs tracking-wider ${active ? "text-orange-300" : "text-white"}`}>
                                {s.code}
                              </span>
                              <span className="text-xs text-zinc-400 truncate font-sans">
                                {s.title}
                              </span>
                            </div>

                            {s.contentLink ? (
                              <a
                                href={s.contentLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={(e) => e.stopPropagation()}
                                title={`Open ${s.linkText || "External Link"}`}
                                className="flex shrink-0 items-center gap-1 rounded bg-[#D9531E] px-2.5 py-1 font-sans text-xs font-semibold text-white transition-colors hover:bg-[#C84814]"
                              >
                                <ExternalLink className="h-3 w-3" />
                                <span>LINK</span>
                              </a>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEditLinkSop(s);
                                  setIsEditLinkOpen(true);
                                }}
                                title="Attach procedure link"
                                className="flex shrink-0 items-center gap-1 rounded bg-zinc-800 px-2 py-1 font-sans text-xs text-orange-400 transition-colors hover:bg-zinc-700 hover:text-orange-300"
                              >
                                <Link2 className="h-3 w-3" />
                                <span>+ LINK</span>
                              </button>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                );
              })}

              {/* Add New Category Zone in Sidebar */}
              <button
                onClick={() => handleOpenAddCategoryZone(activeTeam.id)}
                className="flex w-full items-center justify-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 font-display text-xs tracking-wider text-orange-400 transition-colors hover:bg-zinc-800 hover:text-orange-300"
              >
                <Plus className="h-3 w-3" />
                <span>+ ADD CATEGORY ZONE</span>
              </button>
            </div>

            {/* Selected SOP Action Card */}
            {selectedSop && (
              <div className="mt-3 space-y-2 pt-3">
                {selectedSop.contentLink ? (
                  <div className="space-y-1.5">
                    <a
                      href={selectedSop.contentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D9531E] px-3.5 py-2 font-display text-xs tracking-wider text-white shadow-md transition-all hover:bg-[#C84814]"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      <span className="truncate">
                        OPEN {selectedSop.linkText || "PROCEDURE LINK"}
                      </span>
                    </a>
                    <button
                      onClick={() => {
                        setEditLinkSop(selectedSop);
                        setIsEditLinkOpen(true);
                      }}
                      className="flex w-full items-center justify-center gap-2 rounded-lg bg-zinc-900 px-3 py-1.5 font-display text-xs tracking-wider text-zinc-300 transition-all hover:bg-zinc-800 hover:text-white"
                    >
                      <Link2 className="h-3.5 w-3.5 text-orange-400" />
                      <span>EDIT PROCEDURE LINK</span>
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setEditLinkSop(selectedSop);
                      setIsEditLinkOpen(true);
                    }}
                    className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#D9531E] px-3.5 py-2 font-display text-xs tracking-wider text-white shadow-md transition-all hover:bg-[#C84814]"
                  >
                    <Link2 className="h-3.5 w-3.5" />
                    <span>ATTACH PROCEDURE LINK</span>
                  </button>
                )}
              </div>
            )}
          </aside>
        )}

        {/* Campus Town Radar Minimap */}
        <div className="absolute bottom-4 left-5 bg-black/85 p-3 backdrop-blur-md md:left-8 rounded-xl shadow-2xl">
          <div className="flex items-center justify-between pb-1.5 font-display text-xs text-zinc-400 tracking-wider">
            <span className="flex items-center gap-1 text-orange-400 font-bold">
              <Compass className="h-3.5 w-3.5" /> CAMPUS RADAR
            </span>
            <span className="font-sans text-[11px]">{teams.length} DISTRICTS</span>
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

      {/* Bottom Footer */}
      <footer className="flex h-14 shrink-0 items-center justify-between bg-black/85 px-5 backdrop-blur-md md:px-8 shadow-inner">
        <div className="flex items-center gap-4 overflow-x-auto font-sans text-xs tracking-wide md:gap-6 custom-scrollbar py-1">
          {teams.map((t, idx) => (
            <button
              key={t.id}
              onClick={() => navigateToTeam(t.id)}
              className={`relative pb-1 whitespace-nowrap transition-colors flex items-center gap-1.5 ${
                activeTeamId === t.id ? "text-orange-400 font-bold" : "text-zinc-400 hover:text-white"
              }`}
            >
              <span>0{idx + 1} {t.code}</span>
              {activeTeamId === t.id && (
                <span className="absolute -bottom-[2px] left-0 right-0 h-[2px] bg-[#D9531E] rounded-full" />
              )}
            </button>
          ))}
          <button
            onClick={() => setIsCreateTeamOpen(true)}
            className="flex items-center gap-1 rounded-lg bg-zinc-900 px-2.5 py-1 text-xs font-sans text-zinc-300 hover:bg-zinc-800 hover:text-white"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>New Team</span>
          </button>
        </div>

        <div className="flex items-center gap-2 font-display">
          {selectedSop && (
            selectedSop.contentLink ? (
              <a
                href={selectedSop.contentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-3.5 py-2 text-xs tracking-wider text-white transition-colors hover:bg-[#C84814]"
              >
                <ExternalLink className="h-3.5 w-3.5" /> Open Link
              </a>
            ) : (
              <button
                onClick={() => {
                  setEditLinkSop(selectedSop);
                  setIsEditLinkOpen(true);
                }}
                className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs tracking-wider text-orange-400 transition-colors hover:bg-zinc-800 hover:text-orange-300"
              >
                <Link2 className="h-3.5 w-3.5" /> + Link
              </button>
            )
          )}
          <button
            onClick={() => handleOpenAddCategoryZone(activeTeam.id)}
            className="hidden md:flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-2 text-xs tracking-wider text-zinc-300 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <Layers className="h-3.5 w-3.5 text-orange-400" /> + Category Bay
          </button>
          <button
            onClick={handleDeleteSOP}
            disabled={!selectedId}
            className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-xs tracking-wider text-zinc-400 transition-colors hover:bg-orange-950/40 hover:text-orange-300 disabled:pointer-events-none disabled:opacity-40"
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete SOP
          </button>
          <button
            onClick={() => {
              setPreselectedCategory(undefined);
              setSopDialogTeamId(activeTeam.id);
              setIsCreateSOPOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-4 py-2 text-xs tracking-wider text-white transition-colors hover:bg-[#C84814]"
          >
            <Plus className="h-3.5 w-3.5" /> Add SOP Block
          </button>
        </div>
      </footer>

      {/* Modals */}
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
        onClose={() => {
          setIsCreateSOPOpen(false);
          setSopDialogTeamId(null);
        }}
        team={targetSopTeam}
        teamIndex={targetSopTeamIndex}
        existingSopsCount={targetSopTeamSops.length}
        defaultCategory={preselectedCategory}
        categorySopCounts={targetSopCategoryCounts}
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
        onManageSopLink={(sopId) => {
          const target = sops.find((s) => s.id === sopId);
          if (target) {
            setEditLinkSop(target);
            setIsEditLinkOpen(true);
          }
        }}
        onFlyToDistrict={(teamId) => {
          setSelectedTeamHQId(null);
          navigateToTeam(teamId);
        }}
      />

      <EditSopLinkDialog
        sop={editLinkSop}
        isOpen={isEditLinkOpen}
        onClose={() => {
          setIsEditLinkOpen(false);
          setEditLinkSop(null);
        }}
        onSaveLink={handleSaveSopLink}
      />
    </div>
  );
}
