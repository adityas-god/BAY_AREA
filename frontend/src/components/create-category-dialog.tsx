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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/75 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl dark-deco-card p-6 shadow-2xl backdrop-blur-2xl text-foreground">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D9531E]/20 text-orange-400">
              <FolderPlus className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-display text-xl tracking-wider text-white">
                ADD CATEGORY PARTITION BAY
              </h3>
              <p className="font-sans text-xs text-zinc-400">
                Sub-sector bay for <span className="text-orange-400 font-semibold">{team.name}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Info Banner */}
        <div className="mt-2 rounded-lg bg-zinc-900/60 p-3.5 font-sans text-xs text-zinc-300">
          <div className="flex items-center gap-1.5 font-display text-sm tracking-wide text-orange-400">
            <Layers className="h-3.5 w-3.5" />
            <span>DYNAMIC PARTITION EXPANSION</span>
          </div>
          <p className="mt-1 leading-relaxed text-zinc-400 text-xs">
            This creates a spacious ground bay plate inside <strong className="text-zinc-200">{team.name}</strong>.
            The bay will automatically expand in depth as SOP blocks are placed inside it.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-sans text-xs">
          <div>
            <label className="text-zinc-400 font-medium tracking-wide">CATEGORY BAY TITLE</label>
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
              className="mt-1.5 w-full rounded-lg bg-zinc-950/80 px-3.5 py-2.5 text-zinc-100 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/40"
            />
            {error && <p className="mt-1.5 text-orange-400 text-xs font-semibold">{error}</p>}
          </div>

          {/* Quick Preset Badges */}
          <div>
            <label className="text-zinc-400 font-medium tracking-wide flex items-center gap-1.5 text-xs">
              <Sparkles className="h-3.5 w-3.5 text-orange-400" /> QUICK PRESETS
            </label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {PRESET_SUGGESTIONS.filter(
                (p) => !existingCategories.some((ec) => ec.toLowerCase() === p.toLowerCase()),
              ).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => handlePickPreset(preset)}
                  className="rounded-md bg-zinc-900/80 px-2.5 py-1.5 text-xs text-zinc-300 transition-colors hover:bg-orange-950/50 hover:text-orange-300"
                >
                  + {preset}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg bg-zinc-900 px-4 py-2 font-sans text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-5 py-2 font-display text-sm tracking-wider text-white transition-all hover:bg-[#C84814] shadow-md"
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
