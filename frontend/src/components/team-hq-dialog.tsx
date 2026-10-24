import { useState, useEffect } from "react";
import { Team, SOP } from "@/lib/teams-sops";
import {
  X,
  Building2,
  Users,
  ShieldAlert,
  Clock,
  Radio,
  Cpu,
  Edit3,
  Save,
  CheckCircle2,
  Terminal,
  Compass,
  FileText,
  AlertTriangle,
  Layers,
  Database,
} from "lucide-react";

interface TeamHQDialogProps {
  team: Team | null;
  teamIndex: number;
  teamSops: SOP[];
  isOpen: boolean;
  onClose: () => void;
  onUpdateTeam: (updatedTeam: Team) => void;
  onOpenSopTerminal: (sopId: string) => void;
  onFlyToDistrict: (teamId: string) => void;
}

export function TeamHQDialog({
  team,
  teamIndex,
  teamSops,
  isOpen,
  onClose,
  onUpdateTeam,
  onOpenSopTerminal,
  onFlyToDistrict,
}: TeamHQDialogProps) {
  if (!isOpen || !team) return null;

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(team.name);
  const [lead, setLead] = useState(team.lead);
  const [description, setDescription] = useState(team.description);
  const [mandate, setMandate] = useState(team.mandate || "");
  const [contact, setContact] = useState(team.contact || "");
  const [slaMinutes, setSlaMinutes] = useState(team.slaMinutes || 15);
  const [fleetsInput, setFleetsInput] = useState((team.fleets || []).join(", "));
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Sync state whenever team changes
  useEffect(() => {
    setName(team.name);
    setLead(team.lead);
    setDescription(team.description);
    setMandate(team.mandate || "");
    setContact(team.contact || "");
    setSlaMinutes(team.slaMinutes || 15);
    setFleetsInput((team.fleets || []).join(", "));
    setIsEditing(false);
    setSaveStatus(null);
  }, [team]);

  const avgCompliance = teamSops.length
    ? Math.round(teamSops.reduce((sum, s) => sum + s.load, 0) / teamSops.length)
    : 100;

  const criticalCount = teamSops.filter((s) => s.priority === "CRITICAL" || s.alert).length;

  const handleSave = () => {
    const updatedFleets = fleetsInput
      .split(",")
      .map((f) => f.trim())
      .filter(Boolean);

    const updated: Team = {
      ...team,
      name: name.trim(),
      lead: lead.trim(),
      description: description.trim(),
      mandate: mandate.trim(),
      contact: contact.trim(),
      slaMinutes: Number(slaMinutes) || 15,
      fleets: updatedFleets.length > 0 ? updatedFleets : team.fleets,
    };

    onUpdateTeam(updated);
    setIsEditing(false);
    setSaveStatus("Configuration saved to MongoDB & LocalStorage!");
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-lg border border-accent/40 bg-zinc-950/95 shadow-2xl text-foreground overflow-hidden"
        style={{
          boxShadow: "0 0 45px rgba(255, 136, 0, 0.15)",
        }}
      >
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-border/70 bg-black/60 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded bg-accent/15 border border-accent/50 text-accent">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-accent tracking-widest">
                  DISTRICT 0{teamIndex + 1} // OPERATIONS HQ
                </span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-muted-foreground">
                  {team.code} SECTOR
                </span>
              </div>
              <h2 className="font-display text-lg font-bold tracking-wide text-foreground">
                {team.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlyToDistrict(team.id)}
              className="hidden sm:flex items-center gap-1.5 rounded border border-border px-2.5 py-1 font-mono text-[11px] text-muted-foreground hover:border-accent hover:text-accent transition-colors"
              title="Fly camera to this team's district"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>NAVIGATE</span>
            </button>
            <button
              onClick={onClose}
              className="rounded p-1 text-muted-foreground hover:bg-white/10 hover:text-foreground transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {saveStatus && (
          <div className="flex items-center gap-2 bg-emerald-950/80 border-b border-emerald-500/40 px-6 py-2 text-xs font-mono text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics HUD Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded border border-border/60 bg-black/40 p-3">
              <div className="font-mono text-[9px] tracking-wider text-muted-foreground flex items-center gap-1">
                <Layers className="h-3 w-3 text-accent" /> SOP BLOCKS
              </div>
              <div className="mt-1 font-display text-xl font-bold text-foreground">
                {teamSops.length} <span className="font-mono text-xs font-normal text-muted-foreground">CONFIGURED</span>
              </div>
            </div>

            <div className="rounded border border-border/60 bg-black/40 p-3">
              <div className="font-mono text-[9px] tracking-wider text-muted-foreground flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" /> COMPLIANCE
              </div>
              <div className="mt-1 font-display text-xl font-bold text-emerald-400">
                {avgCompliance}%
              </div>
            </div>

            <div className="rounded border border-border/60 bg-black/40 p-3">
              <div className="font-mono text-[9px] tracking-wider text-muted-foreground flex items-center gap-1">
                <ShieldAlert className="h-3 w-3 text-destructive" /> CRITICAL P1
              </div>
              <div className={`mt-1 font-display text-xl font-bold ${criticalCount > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                {criticalCount} <span className="font-mono text-xs font-normal text-muted-foreground">ACTIVE</span>
              </div>
            </div>

            <div className="rounded border border-border/60 bg-black/40 p-3">
              <div className="font-mono text-[9px] tracking-wider text-muted-foreground flex items-center gap-1">
                <Clock className="h-3 w-3 text-accent" /> SLA TARGET
              </div>
              <div className="mt-1 font-display text-xl font-bold text-accent">
                {slaMinutes} <span className="font-mono text-xs font-normal text-muted-foreground">MINUTES</span>
              </div>
            </div>
          </div>

          {/* Manager Configuration Form / Display */}
          <div className="rounded border border-border/70 bg-zinc-900/40 p-4 space-y-4">
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-accent" />
                <span className="font-mono text-xs font-bold tracking-wider text-foreground">
                  MANAGER BRIEFING & OPERATIONAL CHARTER
                </span>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-[11px] font-mono text-accent hover:text-accent/80 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>EDIT PROFILE</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-[11px] font-mono text-muted-foreground hover:text-foreground"
                  >
                    CANCEL
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 rounded bg-accent px-2.5 py-1 text-[11px] font-mono font-bold text-accent-foreground hover:bg-accent/90"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>SAVE</span>
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 font-mono text-xs">
                <div>
                  <label className="text-muted-foreground block mb-1">Team Display Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Operations Lead / Director:</label>
                  <input
                    type="text"
                    value={lead}
                    onChange={(e) => setLead(e.target.value)}
                    className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Operating Mandate & Scope:</label>
                  <textarea
                    rows={3}
                    value={mandate}
                    onChange={(e) => setMandate(e.target.value)}
                    className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-muted-foreground block mb-1">Duty Comms / Contact:</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-muted-foreground block mb-1">Target SLA (Minutes):</label>
                    <input
                      type="number"
                      value={slaMinutes}
                      onChange={(e) => setSlaMinutes(Number(e.target.value))}
                      className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-muted-foreground block mb-1">Robotics Fleets & Systems (comma-separated):</label>
                  <input
                    type="text"
                    value={fleetsInput}
                    onChange={(e) => setFleetsInput(e.target.value)}
                    className="w-full rounded border border-border bg-black/60 px-3 py-1.5 text-foreground focus:border-accent focus:outline-none"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 text-xs">
                <div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">OPERATIONS LEAD</div>
                  <div className="mt-0.5 font-display text-sm font-semibold text-foreground flex items-center gap-2">
                    <span>{team.lead}</span>
                    <span className="rounded bg-accent/15 px-1.5 py-0.5 font-mono text-[10px] text-accent">LEAD VERIFIED</span>
                  </div>
                </div>

                <div>
                  <div className="font-mono text-[10px] tracking-widest text-muted-foreground">OPERATING MANDATE</div>
                  <p className="mt-0.5 text-muted-foreground leading-relaxed">
                    {team.mandate || team.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 border-t border-border/40">
                  <div>
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
                      <Radio className="h-3 w-3 text-accent" /> DUTY COMMS / CONTACT
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-foreground">
                      {team.contact || "Ops Channel #01 · Ext 400"}
                    </div>
                  </div>

                  <div>
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground flex items-center gap-1">
                      <Clock className="h-3 w-3 text-accent" /> ESCALATION SLA
                    </div>
                    <div className="mt-0.5 font-mono text-[11px] text-foreground">
                      {team.slaMinutes || 15} Minutes Tier-1 Target
                    </div>
                  </div>
                </div>

                {team.fleets && team.fleets.length > 0 && (
                  <div className="pt-2 border-t border-border/40">
                    <div className="font-mono text-[10px] tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1">
                      <Cpu className="h-3 w-3 text-accent" /> MANAGED ROBOTICS & HARDWARE FLEETS
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {team.fleets.map((fleet, idx) => (
                        <span
                          key={idx}
                          className="rounded border border-border/80 bg-black/40 px-2 py-0.5 font-mono text-[10px] text-zinc-300"
                        >
                          {fleet}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Configured SOPs in this District */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-xs font-bold tracking-wider text-muted-foreground">
                ASSIGNED DISTRICT SOPS ({teamSops.length})
              </span>
              <span className="font-mono text-[10px] text-muted-foreground">
                DOUBLE-CLICK SOP TO RUN
              </span>
            </div>

            {teamSops.length === 0 ? (
              <div className="rounded border border-dashed border-border/60 p-4 text-center font-mono text-xs text-muted-foreground">
                No SOP blocks configured in this district yet.
              </div>
            ) : (
              <div className="space-y-2">
                {teamSops.map((sop) => (
                  <div
                    key={sop.id}
                    className="flex items-center justify-between rounded border border-border/60 bg-black/40 p-2.5 transition-colors hover:border-accent/60"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-7 w-7 items-center justify-center rounded bg-zinc-800 text-accent font-mono text-xs font-bold">
                        {sop.code.split("-").pop() || "SOP"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-foreground">
                            {sop.code}
                          </span>
                          <span className={`text-[9px] font-mono px-1 rounded ${sop.priority === "CRITICAL" ? "bg-destructive/20 text-destructive font-bold" : "text-muted-foreground"}`}>
                            {sop.priority}
                          </span>
                          {sop.alert && (
                            <span className="flex items-center gap-0.5 text-[9px] font-mono text-destructive">
                              <AlertTriangle className="h-2.5 w-2.5" /> ALERT
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-muted-foreground truncate max-w-sm">
                          {sop.title}
                        </div>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        onClose();
                        onOpenSopTerminal(sop.id);
                      }}
                      className="flex items-center gap-1.5 rounded border border-accent/40 bg-accent/10 px-2.5 py-1 font-mono text-[10px] font-bold text-accent hover:bg-accent/20 transition-colors"
                    >
                      <Terminal className="h-3 w-3" />
                      <span>TERMINAL</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between border-t border-border/60 bg-black/60 px-6 py-3 font-mono text-xs">
          <span className="text-muted-foreground text-[10px] flex items-center gap-1.5">
            <Database className="h-3 w-3 text-accent" />
            <span>MONGODB INTEGRATED</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onFlyToDistrict(team.id);
              }}
              className="flex items-center gap-1.5 rounded border border-border px-3 py-1.5 text-muted-foreground hover:border-accent hover:text-accent transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>FLY TO DISTRICT</span>
            </button>
            <button
              onClick={onClose}
              className="rounded bg-accent px-4 py-1.5 font-bold text-accent-foreground hover:bg-accent/90 transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
