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
  ExternalLink,
  Link2,
  Compass,
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
  onManageSopLink?: (sopId: string) => void;
  onFlyToDistrict: (teamId: string) => void;
}

export function TeamHQDialog({
  team,
  teamIndex,
  teamSops,
  isOpen,
  onClose,
  onUpdateTeam,
  onManageSopLink,
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
    setSaveStatus("Configuration saved successfully!");
    setTimeout(() => setSaveStatus(null), 3500);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] flex flex-col rounded-xl dark-deco-card shadow-2xl text-foreground overflow-hidden">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between bg-black/40 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#D9531E]/20 text-orange-400">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-display text-xs tracking-widest text-orange-400">
                  DISTRICT 0{teamIndex + 1} // OPERATIONS HQ
                </span>
                <span className="text-[10px] font-sans px-2 py-0.5 rounded bg-zinc-900 text-zinc-400">
                  {team.code} SECTOR
                </span>
              </div>
              <h2 className="font-display text-2xl tracking-wide text-white">
                {team.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onFlyToDistrict(team.id)}
              className="hidden sm:flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5 font-sans text-xs text-zinc-300 hover:bg-zinc-800 transition-colors"
              title="Fly camera to this team's district"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Navigate</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg p-1.5 text-zinc-400 hover:bg-white/10 hover:text-white transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Status Toast */}
        {saveStatus && (
          <div className="flex items-center gap-2 bg-emerald-950/80 px-6 py-2 text-xs font-sans text-emerald-400">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>{saveStatus}</span>
          </div>
        )}

        {/* Modal Scrollable Body */}
        <div className="custom-scrollbar flex-1 overflow-y-auto p-6 space-y-6">
          {/* Key Metrics HUD Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="rounded-lg bg-zinc-900/70 p-3.5">
              <div className="font-sans text-[11px] font-medium tracking-wide text-zinc-400 flex items-center gap-1">
                <Layers className="h-3.5 w-3.5 text-orange-400" /> SOP BLOCKS
              </div>
              <div className="mt-1 font-display text-2xl tracking-wide text-white">
                {teamSops.length} <span className="font-sans text-xs font-normal text-zinc-400">CONFIGURED</span>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-900/70 p-3.5">
              <div className="font-sans text-[11px] font-medium tracking-wide text-zinc-400 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" /> COMPLIANCE
              </div>
              <div className="mt-1 font-display text-2xl tracking-wide text-emerald-400">
                {avgCompliance}%
              </div>
            </div>

            <div className="rounded-lg bg-zinc-900/70 p-3.5">
              <div className="font-sans text-[11px] font-medium tracking-wide text-zinc-400 flex items-center gap-1">
                <ShieldAlert className="h-3.5 w-3.5 text-orange-400" /> CRITICAL P1
              </div>
              <div className={`mt-1 font-display text-2xl tracking-wide ${criticalCount > 0 ? "text-orange-400" : "text-zinc-500"}`}>
                {criticalCount} <span className="font-sans text-xs font-normal text-zinc-400">ACTIVE</span>
              </div>
            </div>

            <div className="rounded-lg bg-zinc-900/70 p-3.5">
              <div className="font-sans text-[11px] font-medium tracking-wide text-zinc-400 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-orange-400" /> SLA TARGET
              </div>
              <div className="mt-1 font-display text-2xl tracking-wide text-orange-400">
                {slaMinutes} <span className="font-sans text-xs font-normal text-zinc-400">MIN</span>
              </div>
            </div>
          </div>

          {/* Manager Configuration Form / Display */}
          <div className="rounded-lg bg-zinc-900/50 p-4 space-y-4">
            <div className="flex items-center justify-between pb-2">
              <div className="flex items-center gap-2">
                <Users className="h-4 w-4 text-orange-400" />
                <span className="font-display text-sm tracking-wider text-white">
                  MANAGER BRIEFING & OPERATIONAL CHARTER
                </span>
              </div>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-1 text-xs font-sans text-orange-400 hover:text-orange-300 transition-colors"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                  <span>Edit Profile</span>
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-xs font-sans text-zinc-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex items-center gap-1 rounded-lg bg-[#D9531E] px-3 py-1 font-display text-xs tracking-wider text-white hover:bg-[#C84814]"
                  >
                    <Save className="h-3.5 w-3.5" />
                    <span>SAVE</span>
                  </button>
                </div>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3 font-sans text-xs">
                <div>
                  <label className="text-zinc-400 block mb-1">Team Display Name:</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Operations Lead / Director:</label>
                  <input
                    type="text"
                    value={lead}
                    onChange={(e) => setLead(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Operating Mandate & Scope:</label>
                  <textarea
                    rows={3}
                    value={mandate}
                    onChange={(e) => setMandate(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40 resize-none"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-zinc-400 block mb-1">Duty Comms / Contact:</label>
                    <input
                      type="text"
                      value={contact}
                      onChange={(e) => setContact(e.target.value)}
                      className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                    />
                  </div>
                  <div>
                    <label className="text-zinc-400 block mb-1">Target SLA (Minutes):</label>
                    <input
                      type="number"
                      value={slaMinutes}
                      onChange={(e) => setSlaMinutes(Number(e.target.value))}
                      className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-zinc-400 block mb-1">Robotics Fleets & Systems (comma-separated):</label>
                  <input
                    type="text"
                    value={fleetsInput}
                    onChange={(e) => setFleetsInput(e.target.value)}
                    className="w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3.5 font-sans text-xs">
                <div>
                  <div className="font-display text-xs tracking-wider text-zinc-400">OPERATIONS LEAD</div>
                  <div className="mt-0.5 font-display text-base tracking-wide text-white flex items-center gap-2">
                    <span>{team.lead}</span>
                    <span className="rounded bg-[#24130A] border border-orange-500/30 px-2 py-0.5 font-sans text-[10px] text-orange-300">Lead Verified</span>
                  </div>
                </div>

                <div>
                  <div className="font-display text-xs tracking-wider text-zinc-400">OPERATING MANDATE</div>
                  <p className="mt-0.5 text-zinc-300 leading-relaxed font-sans text-xs">
                    {team.mandate || team.description}
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <div className="font-sans text-[11px] text-zinc-400 flex items-center gap-1">
                      <Radio className="h-3.5 w-3.5 text-orange-400" /> Duty Comms / Contact
                    </div>
                    <div className="mt-0.5 font-sans text-xs text-white">
                      {team.contact || "Ops Channel #01 · Ext 400"}
                    </div>
                  </div>

                  <div>
                    <div className="font-sans text-[11px] text-zinc-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-orange-400" /> Escalation SLA
                    </div>
                    <div className="mt-0.5 font-sans text-xs text-white">
                      {team.slaMinutes || 15} Minutes Tier-1 Target
                    </div>
                  </div>
                </div>

                {team.fleets && team.fleets.length > 0 && (
                  <div className="pt-2">
                    <div className="font-sans text-[11px] text-zinc-400 mb-1.5 flex items-center gap-1">
                      <Cpu className="h-3.5 w-3.5 text-orange-400" /> Managed Robotics & Hardware Fleets
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {team.fleets.map((fleet, idx) => (
                        <span
                          key={idx}
                          className="rounded-md bg-zinc-950/80 px-2.5 py-1 font-sans text-xs text-zinc-300"
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
              <span className="font-display text-sm tracking-wider text-zinc-300">
                ASSIGNED DISTRICT SOPS ({teamSops.length})
              </span>
              <span className="font-sans text-xs text-zinc-400">
                Double-click SOP to run
              </span>
            </div>

            {teamSops.length === 0 ? (
              <div className="rounded-lg bg-zinc-900/40 p-4 text-center font-sans text-xs text-zinc-400">
                No SOP blocks configured in this district yet.
              </div>
            ) : (
              <div className="space-y-2">
                {teamSops.map((sop) => (
                  <div
                    key={sop.id}
                    className="flex items-center justify-between rounded-lg bg-zinc-900/60 p-3 transition-colors hover:bg-zinc-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-800 text-orange-400 font-display text-xs">
                        {sop.code.split("-").pop() || "SOP"}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-display text-sm tracking-wider text-white">
                            {sop.code}
                          </span>
                          <span className={`text-[10px] font-sans px-1.5 py-0.5 rounded ${sop.priority === "CRITICAL" ? "bg-orange-950/70 border border-orange-500/30 text-orange-400 font-semibold" : "text-zinc-400"}`}>
                            {sop.priority}
                          </span>
                          {sop.alert && (
                            <span className="flex items-center gap-0.5 text-[10px] font-sans text-orange-400">
                              <AlertTriangle className="h-3 w-3" /> ALERT
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-zinc-400 font-sans truncate max-w-sm">
                          {sop.title}
                        </div>
                      </div>
                    </div>

                    {sop.contentLink ? (
                      <a
                        href={sop.contentLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-3 py-1.5 font-sans text-xs font-semibold text-white hover:bg-[#C84814] transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>OPEN LINK</span>
                      </a>
                    ) : (
                      <button
                        onClick={() => {
                          onClose();
                          onManageSopLink?.(sop.id);
                        }}
                        className="flex items-center gap-1.5 rounded-lg bg-zinc-800 px-3 py-1.5 font-sans text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        <span>+ LINK</span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between bg-black/40 px-6 py-3 font-sans text-xs">
          <span className="text-zinc-400 text-xs flex items-center gap-1.5">
            <Database className="h-3.5 w-3.5 text-orange-400" />
            <span>Database Synchronized</span>
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onFlyToDistrict(team.id);
              }}
              className="flex items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 py-2 text-zinc-300 hover:bg-zinc-800 transition-colors"
            >
              <Compass className="h-3.5 w-3.5" />
              <span>Fly to District</span>
            </button>
            <button
              onClick={onClose}
              className="rounded-lg bg-[#D9531E] px-5 py-2 font-display text-xs tracking-wider text-white hover:bg-[#C84814] transition-colors"
            >
              CLOSE
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
