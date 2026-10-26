import { useState, useEffect } from "react";
import { Team } from "@/lib/teams-sops";
import { X, Plus, Shield, Users, Sparkles } from "lucide-react";

interface CreateTeamDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (team: Team) => void;
}

export function CreateTeamDialog({ isOpen, onClose, onCreate }: CreateTeamDialogProps) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [lead, setLead] = useState("");

  // Clear state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setName("");
      setCode("");
      setDescription("");
      setLead("");
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
    if (!name.trim() || !code.trim()) return;

    const newTeam: Team = {
      id: `team-${code.toLowerCase().replace(/[^a-z0-9]/g, "")}-${Date.now()}`,
      code: code.trim().toUpperCase(),
      name: name.trim().endsWith("Team") ? name.trim() : `${name.trim()} Team`,
      description: description.trim() || `Operational unit for ${code.trim().toUpperCase()}`,
      lead: lead.trim() || "Operations Lead",
    };

    onCreate(newTeam);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-lg bg-[#141518] border border-zinc-800 p-6 shadow-2xl text-foreground font-sans">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#D9531E] text-white">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-xl font-bold tracking-wider text-white uppercase">
                Configure New Team
              </h3>
              <p className="text-xs text-zinc-400 font-sans">Operational squad division</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-zinc-300 font-medium">Team Code</label>
              <input
                type="text"
                required
                placeholder="e.g. NOC"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white font-bold focus:bg-black/80 focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-zinc-300 font-medium">Team Name</label>
              <input
                type="text"
                required
                placeholder="e.g. Network Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white focus:bg-black/80 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-zinc-300 font-medium">Team Lead / Owner</label>
            <input
              type="text"
              placeholder="e.g. Vikram Malhotra"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white focus:bg-black/80 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-zinc-300 font-medium">Description</label>
            <textarea
              rows={3}
              placeholder="Describe operational scope and robotic systems managed."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white focus:bg-black/80 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded bg-zinc-800 px-4 py-2 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-[#D9531E] px-4 py-2 text-xs font-medium text-white transition-colors hover:bg-[#C84814]"
            >
              <Plus className="h-4 w-4" />
              <span>Create Team</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
