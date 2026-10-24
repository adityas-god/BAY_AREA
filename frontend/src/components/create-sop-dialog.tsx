import { useState, useEffect } from "react";
import { SOP, SOPPriority, Team, getCategorySopCoords } from "@/lib/teams-sops";
import { X, Plus, FileText } from "lucide-react";

interface CreateSOPDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  teamIndex?: number;
  existingSopsCount: number;
  defaultCategory?: string;
  categorySopCounts?: Record<string, number>;
  onCreate: (sop: SOP) => void;
  onAddNewCategory?: (teamId: string) => void;
}

export function CreateSOPDialog({
  isOpen,
  onClose,
  team,
  teamIndex = 0,
  existingSopsCount,
  defaultCategory,
  categorySopCounts = {},
  onCreate,
  onAddNewCategory,
}: CreateSOPDialogProps) {
  const teamCategories =
    team.categories && team.categories.length > 0
      ? team.categories
      : ["General Protocols", "Alert & Incident SOPs"];

  const initialCat =
    defaultCategory && teamCategories.includes(defaultCategory)
      ? defaultCategory
      : teamCategories[0] || "General Protocols";

  const [title, setTitle] = useState("");
  const [code, setCode] = useState(`SOP-${team.code}-${(existingSopsCount + 1) * 100 + 1}`);
  const [category, setCategory] = useState<string>(initialCat);
  const [priority, setPriority] = useState<SOPPriority>("HIGH");
  const [summary, setSummary] = useState("");
  const [triggerCondition, setTriggerCondition] = useState("");
  const [contentLink, setContentLink] = useState("");
  const [linkText, setLinkText] = useState("");
  const [initialStepCmd, setInitialStepCmd] = useState("greyctl status --zone A");

  // Keep state in sync whenever dialog opens or props change
  useEffect(() => {
    if (isOpen) {
      const cats =
        team.categories && team.categories.length > 0
          ? team.categories
          : ["General Protocols", "Alert & Incident SOPs"];
      const targetCat =
        (defaultCategory && cats.includes(defaultCategory) ? defaultCategory : cats[0]) ||
        "General Protocols";

      setCategory(targetCat);
      setCode(`SOP-${team.code}-${(existingSopsCount + 1) * 100 + 1}`);
      setTitle("");
      setSummary("");
      setTriggerCondition("");
      setContentLink("");
      setLinkText("");
      setPriority("HIGH");
      setInitialStepCmd("greyctl status --zone A");
    }
  }, [isOpen, team.id, team.code, defaultCategory, existingSopsCount]);

  // Handle Escape key to close dialog
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  // Return null AFTER all hooks have been declared to strictly adhere to React's Rules of Hooks
  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !code.trim()) return;

    // Determine category index
    let catIdx = teamCategories.indexOf(category);
    if (catIdx === -1) catIdx = 0;

    const catCounts = teamCategories.map((c) => categorySopCounts[c] || 0);
    const countInCat = categorySopCounts[category] || 0;
    const coords = getCategorySopCoords(teamIndex, catIdx, countInCat, catCounts);
    const now = Date.now();

    const newSop: SOP = {
      id: `sop-${team.code.toLowerCase()}-${now}`,
      teamId: team.id,
      code: code.trim().toUpperCase(),
      title: title.trim(),
      category: category.trim(),
      priority,
      status: "ACTIVE",
      version: "1.0.0",
      author: team.lead || "Operations Specialist",
      updatedAt: new Date().toISOString().slice(0, 10),
      summary: summary.trim() || `Operational standard procedure for ${title.trim()}.`,
      triggerCondition: triggerCondition.trim() || "Manual dispatch or telemetry threshold exceeded.",
      ...(contentLink.trim() ? { contentLink: contentLink.trim() } : {}),
      ...(linkText.trim() ? { linkText: linkText.trim() } : {}),
      steps: [
        {
          id: `step-${now}-1`,
          order: 1,
          title: "Initial Telemetry Verification",
          description: "Verify robot/system telemetry stream and inspect hardware logs.",
          ...(initialStepCmd.trim() ? { command: initialStepCmd.trim() } : {}),
        },
        {
          id: `step-${now}-2`,
          order: 2,
          title: "Execute Remediation Actions",
          description: "Apply standard mitigation protocol as documented in operational guide.",
        },
      ],
      escalation: {
        level1: `${team.name} On-Duty Specialist`,
        level2: team.lead || "Engineering Lead",
        slaMinutes:
          priority === "CRITICAL" ? 15 : priority === "HIGH" ? 30 : priority === "MEDIUM" ? 60 : 120,
      },
      gx: coords.gx,
      gy: coords.gy,
      row: coords.row,
      load: 75 + Math.round(Math.random() * 20),
      alert: priority === "CRITICAL",
    };

    onCreate(newSop);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-xl rounded-xl border border-accent/40 bg-black/90 p-6 shadow-[0_0_50px_rgba(255,140,0,0.18)] backdrop-blur-2xl text-foreground"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 border border-accent/50 text-accent">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">CONFIGURE SOP BLOCK</h3>
              <p className="font-mono text-xs text-muted-foreground">
                ASSIGN TO <span className="text-accent font-bold">{team.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div>
              <label className="text-muted-foreground">SOP CODE</label>
              <input
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent font-bold focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <div className="flex items-center justify-between">
                <label className="text-muted-foreground">CATEGORY BAY</label>
                {onAddNewCategory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onAddNewCategory(team.id);
                    }}
                    className="text-[10px] text-accent hover:underline"
                  >
                    + NEW BAY
                  </button>
                )}
              </div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
              >
                {teamCategories.map((c) => (
                  <option key={c} value={c} className="bg-zinc-900 text-foreground">
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-muted-foreground">PRIORITY</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as SOPPriority)}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
              >
                <option value="CRITICAL" className="bg-zinc-900 text-destructive font-bold">CRITICAL</option>
                <option value="HIGH" className="bg-zinc-900 text-accent font-bold">HIGH</option>
                <option value="MEDIUM" className="bg-zinc-900 text-foreground">MEDIUM</option>
                <option value="LOW" className="bg-zinc-900 text-muted-foreground">LOW</option>
              </select>
            </div>
          </div>

          <div>
            <label className="text-muted-foreground">SOP TITLE / PROCEDURE NAME</label>
            <input
              type="text"
              required
              placeholder="e.g. Sorter Diverter Sensor Failure"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground font-display text-sm focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground">SUMMARY & OBJECTIVE</label>
            <textarea
              rows={2}
              placeholder="Brief operational objective and expected resolution outcome."
              value={summary}
              onChange={(e) => setSummary(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground">TRIGGER CONDITION (WHEN TO EXECUTE)</label>
            <input
              type="text"
              placeholder="e.g. Optical sensor beam break timeout > 3000ms"
              value={triggerCondition}
              onChange={(e) => setTriggerCondition(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="text-muted-foreground">CONTENT / REDIRECT LINK (URL)</label>
              <input
                type="text"
                placeholder="https://docs.google.com/... or https://atlassian.net/..."
                value={contentLink}
                onChange={(e) => setContentLink(e.target.value)}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent font-mono text-[11px] focus:border-accent focus:outline-none"
              />
            </div>
            <div>
              <label className="text-muted-foreground">LINK DISPLAY TEXT</label>
              <input
                type="text"
                placeholder="e.g. Master Template of DIR .docx"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground text-xs focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground">STEP 1 CLI COMMAND (OPTIONAL)</label>
            <input
              type="text"
              value={initialStepCmd}
              onChange={(e) => setInitialStepCmd(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/70 px-3 py-2 text-accent font-mono text-[11px] focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-white/10 px-4 py-2 text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-bold text-accent-foreground transition-all hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              <span>SPAWN SOP BLOCK</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
