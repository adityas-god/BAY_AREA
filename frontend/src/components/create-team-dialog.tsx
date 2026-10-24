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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg rounded-xl border border-accent/40 bg-black/80 p-6 shadow-[0_0_50px_rgba(255,140,0,0.18)] backdrop-blur-2xl text-foreground">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 border border-accent/50 text-accent">
              <Users className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold">CONFIGURE NEW TEAM</h3>
              <p className="font-mono text-xs text-muted-foreground">GREYORANGE OPERATIONS DOMAIN</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4 font-mono text-xs">
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-muted-foreground">TEAM CODE</label>
              <input
                type="text"
                required
                placeholder="e.g. NOC"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent font-bold focus:border-accent focus:outline-none"
              />
            </div>
            <div className="col-span-2">
              <label className="text-muted-foreground">TEAM NAME</label>
              <input
                type="text"
                required
                placeholder="e.g. Network Operations"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-muted-foreground">TEAM LEAD / OWNER</label>
            <input
              type="text"
              placeholder="e.g. Vikram Malhotra (Principal Lead)"
              value={lead}
              onChange={(e) => setLead(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div>
            <label className="text-muted-foreground">MANDATE & SCOPE DESCRIPTION</label>
            <textarea
              rows={3}
              placeholder="Describe this team's operational scope, robotic systems managed, and triage responsibilities."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-border/60">
            <button
              type="button"
              onClick={onClose}
              className="rounded border border-white/10 px-4 py-2 text-muted-foreground hover:bg-white/5 hover:text-foreground"
            >
              CANCEL
            </button>
            <button
              type="submit"
              className="flex items-center gap-1.5 rounded bg-accent px-4 py-2 font-bold text-accent-foreground transition-all hover:bg-accent/90"
            >
              <Plus className="h-4 w-4" />
              <span>DEPLOY TEAM</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
