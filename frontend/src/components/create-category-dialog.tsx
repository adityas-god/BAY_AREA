import { useState, useEffect } from "react";
import { Team } from "@/lib/teams-sops";
import { X, Plus, FolderPlus, Layers, Sparkles } from "lucide-react";

interface CreateCategoryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  team: Team;
  existingCategories: string[];
  onCreateCategory: (teamId: string, categoryName: string) => void;
}

const PRESET_SUGGESTIONS = [
  "Alert & Incident SOPs",
  "Fleet & Dispatch Protocols",
  "Firmware & Telemetry",
  "Hardware & Power Safety",
  "Pick Station Automation",
  "Emergency E-Stop & Safety",
  "Sensor Calibration",
  "Post-Mortem & RCA",
];

export function CreateCategoryDialog({
  isOpen,
  onClose,
  team,
  existingCategories = [],
  onCreateCategory,
}: CreateCategoryDialogProps) {
  const [categoryName, setCategoryName] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Clear state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setCategoryName("");
      setError(null);
    }
  }, [isOpen]);

  // Handle Escape key to close
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = categoryName.trim();
    if (!trimmed) {
      setError("Please specify a category partition name.");
      return;
    }

    if (existingCategories.some((c) => c.toLowerCase() === trimmed.toLowerCase())) {
      setError(`Category "${trimmed}" already exists in ${team.name}.`);
      return;
    }

    onCreateCategory(team.id, trimmed);
    setCategoryName("");
    setError(null);
    onClose();
  };

  const handlePickPreset = (preset: string) => {
    setCategoryName(preset);
    setError(null);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-accent/40 bg-black/85 p-6 shadow-[0_0_60px_rgba(255,140,0,0.22)] backdrop-blur-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-accent/20 border border-accent/50 text-accent">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-wide">
                ADD CATEGORY PARTITION BAY
              </h3>
              <p className="font-mono text-xs text-muted-foreground">
                SUB-SECTOR BAY FOR <span className="text-accent font-bold">{team.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-4 rounded border border-accent/30 bg-accent/10 p-3 font-mono text-[11px] text-muted-foreground">
          <div className="flex items-center gap-1.5 font-bold text-accent">
            <Layers className="h-3.5 w-3.5" />
            <span>DYNAMIC PARTITION EXPANSION</span>
          </div>
          <p className="mt-1">
            This creates a spacious ground bay plate inside <strong className="text-foreground">{team.name}</strong>.
            The bay will automatically expand in depth as SOP blocks are placed inside it!
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono text-xs">
          <div>
            <label className="text-muted-foreground tracking-wider">CATEGORY BAY TITLE</label>
            <input
              type="text"
              required
              autoFocus
              placeholder="e.g. Alert & Incident SOPs, Sorter Protocols..."
              value={categoryName}
              onChange={(e) => {
                setCategoryName(e.target.value);
                setError(null);
              }}
              className="mt-1.5 w-full rounded border border-border/80 bg-black/70 px-3 py-2 text-foreground font-display text-sm focus:border-accent focus:outline-none"
            />
            {error && <p className="mt-1.5 text-destructive text-[11px] font-bold">{error}</p>}
          </div>

          {/* Quick Preset Badges */}
          <div>
            <label className="text-muted-foreground tracking-wider flex items-center gap-1 text-[10px]">
              <Sparkles className="h-3 w-3 text-accent" /> QUICK PRESETS
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.filter(
                (p) => !existingCategories.some((ec) => ec.toLowerCase() === p.toLowerCase()),
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePickPreset(preset)}
                  className="rounded border border-border/70 bg-white/[0.03] px-2 py-1 text-[10px] text-muted-foreground transition-colors hover:border-accent hover:text-accent hover:bg-accent/10"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2 pt-4 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-white/10 px-4 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-bold text-accent-foreground transition-all hover:bg-accent/90 shadow-md"
            >
              <Plus className="h-4 w-4" />
              <span>PARTITION AREA</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
