import { useState, useEffect } from "react";
import { SOP, SOPStep, SOPPriority, SOPStatus } from "@/lib/teams-sops";
import {
  X,
  Terminal,
  Edit3,
  CheckCircle2,
  Copy,
  AlertTriangle,
  Play,
  Save,
  Plus,
  Trash2,
  ShieldAlert,
  Clock,
  User,
  Tag,
  Activity,
  Layers,
  Sparkles,
  ExternalLink,
} from "lucide-react";

interface ScifiTerminalProps {
  sop: SOP | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedSop: SOP) => void;
}

export function ScifiTerminal({ sop, isOpen, onClose, onSave }: ScifiTerminalProps) {
  if (!isOpen || !sop) return null;

  const [activeTab, setActiveTab] = useState<"protocol" | "editor" | "diagnostics">("protocol");
  const [formData, setFormData] = useState<SOP>(sop);
  const [copiedCmd, setCopiedCmd] = useState<string | null>(null);
  const [diagLogs, setDiagLogs] = useState<string[]>([]);
  const [isSimulating, setIsSimulating] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<Record<string, boolean>>({});
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    setFormData(sop);
    setSaveSuccess(false);
  }, [sop]);

  const copyToClipboard = (cmd: string) => {
    navigator.clipboard.writeText(cmd);
    setCopiedCmd(cmd);
    setTimeout(() => setCopiedCmd(null), 2000);
  };

  const toggleStep = (stepId: string) => {
    setCompletedSteps((prev) => ({ ...prev, [stepId]: !prev[stepId] }));
  };

  const handleSave = () => {
    onSave(formData);
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 2500);
  };

  const handleAddStep = () => {
    const newStep: SOPStep = {
      id: `step-${Date.now()}`,
      order: (formData.steps.length || 0) + 1,
      title: "New Procedural Step",
      description: "Define execution details and verification criteria.",
      command: "greyctl diag --check",
    };
    setFormData((prev) => ({
      ...prev,
      steps: [...prev.steps, newStep],
    }));
  };

  const handleRemoveStep = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      steps: prev.steps.filter((_, i) => i !== index),
    }));
  };

  const runDiagnosticsSimulation = () => {
    setIsSimulating(true);
    setDiagLogs([
      `[${new Date().toLocaleTimeString()}] >> INITIALIZING GREYORANGE TELEMETRY BRIDGE...`,
      `[${new Date().toLocaleTimeString()}] >> TARGET SOP: [${formData.code}] - ${formData.title}`,
      `[${new Date().toLocaleTimeString()}] >> VERIFYING FLEET SAFETY ENVELOPE: STATUS_NORMAL`,
    ]);

    formData.steps.forEach((step, idx) => {
      setTimeout(() => {
        setDiagLogs((prev) => [
          ...prev,
          `[${new Date().toLocaleTimeString()}] >> EXECUTING STEP ${step.order}: ${step.title}...`,
          step.command ? `[CMD]: $ ${step.command}` : `[OP]: Manual inspection initiated`,
          `[OK]: Return code 0 (SUCCESS)`,
        ]);
        if (idx === formData.steps.length - 1) {
          setTimeout(() => {
            setDiagLogs((prev) => [
              ...prev,
              `[${new Date().toLocaleTimeString()}] >> === SOP EXECUTION SIMULATION COMPLETED: 100% PASS ===`,
            ]);
            setIsSimulating(false);
          }, 600);
        }
      }, (idx + 1) * 800);
    });
  };

  const priorityColor: Record<SOPPriority, string> = {
    CRITICAL: "border-destructive text-destructive bg-destructive/10",
    HIGH: "border-accent text-accent bg-accent/10",
    MEDIUM: "border-amber-400 text-amber-400 bg-amber-400/10",
    LOW: "border-emerald-400 text-emerald-400 bg-emerald-400/10",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 backdrop-blur-md bg-black/60 animate-in fade-in duration-200">
      {/* Sci-Fi Glassmorphic Window Container */}
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-accent/40 bg-black/75 shadow-[0_0_60px_rgba(255,140,0,0.18)] backdrop-blur-2xl text-foreground">
        
        {/* Terminal Scanline Overlay Effect */}
        <div
          className="pointer-events-none absolute inset-0 z-10 opacity-15"
          style={{
            backgroundImage: "linear-gradient(rgba(255, 140, 0, 0.08) 50%, rgba(0, 0, 0, 0.25) 50%)",
            backgroundSize: "100% 4px",
          }}
        />

        {/* Top Cybernetic Chrome Header */}
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between border-b border-border/80 bg-black/60 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${formData.alert ? "bg-destructive" : "bg-accent"}`}></span>
              <span className={`relative inline-flex rounded-full h-3 w-3 ${formData.alert ? "bg-destructive" : "bg-accent"}`}></span>
            </span>
            <div className="flex items-center gap-2 font-mono text-xs tracking-wider">
              <span className="text-muted-foreground">GREYORANGE://</span>
              <span className="font-bold text-accent">{formData.code}</span>
              <span className="hidden sm:inline text-border">|</span>
              <span className="hidden sm:inline text-muted-foreground">{formData.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 font-mono text-[11px] text-muted-foreground bg-white/5 border border-white/10 px-2.5 py-1 rounded">
              <Clock className="h-3.5 w-3.5 text-accent" />
              <span>SLA: {formData.escalation.slaMinutes}m</span>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded border border-white/15 bg-white/5 text-muted-foreground transition-colors hover:border-accent hover:text-accent"
              aria-label="Close terminal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="relative z-20 flex shrink-0 items-center justify-between border-b border-border/60 bg-black/40 px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 font-mono text-xs">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`flex items-center gap-2 py-3 border-b-2 font-semibold transition-colors ${
                activeTab === "protocol"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>PROTOCOL RUNNER</span>
            </button>

            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-2 py-3 border-b-2 font-semibold transition-colors ${
                activeTab === "editor"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>TERMINAL EDITOR</span>
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`flex items-center gap-2 py-3 border-b-2 font-semibold transition-colors ${
                activeTab === "diagnostics"
                  ? "border-accent text-accent"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>LIVE CLI DIAGNOSTICS</span>
            </button>
          </div>

          {activeTab === "editor" && (
            <button
              onClick={handleSave}
              className="my-1.5 flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-foreground transition-all hover:bg-accent/90"
            >
              <Save className="h-3.5 w-3.5" />
              <span>SAVE TO MONGODB</span>
            </button>
          )}

          {activeTab === "diagnostics" && (
            <button
              onClick={runDiagnosticsSimulation}
              disabled={isSimulating}
              className="my-1.5 flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 font-mono text-xs font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSimulating ? "SIMULATING..." : "RUN CLI SIM"}</span>
            </button>
          )}
        </div>

        {/* Save confirmation toast */}
        {saveSuccess && (
          <div className="absolute top-16 right-6 z-30 flex items-center gap-2 rounded border border-emerald-500/50 bg-emerald-950/80 px-4 py-2 font-mono text-xs font-semibold text-emerald-300 shadow-lg backdrop-blur-md animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>SOP SAVED TO MONGODB & LOCAL DATABASE</span>
          </div>
        )}

        {/* Terminal Body Content */}
        <div className="relative z-20 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar">
          {/* TAB 1: PROTOCOL RUNNER */}
          {activeTab === "protocol" && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="flex flex-col gap-3 rounded-lg border border-border/80 bg-white/[0.02] p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-xl md:text-2xl font-bold tracking-tight text-foreground">
                    {formData.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`rounded border px-2 py-0.5 font-mono text-[11px] font-bold ${priorityColor[formData.priority]}`}>
                      {formData.priority}
                    </span>
                    <span className="rounded border border-border bg-white/5 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      v{formData.version}
                    </span>
                    <span className="rounded border border-border bg-white/5 px-2 py-0.5 font-mono text-[11px] text-muted-foreground">
                      {formData.updatedAt}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-muted-foreground leading-relaxed">
                  {formData.summary}
                </p>

                {/* Direct Link Redirection Banner */}
                {formData.contentLink && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded border border-accent/60 bg-accent/15 p-3.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded bg-accent/20 border border-accent/40 text-accent">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-mono text-xs font-bold text-accent">
                          LIVE DOCUMENTATION / ROSTER LINK
                        </div>
                        <div className="font-mono text-[11px] text-muted-foreground truncate max-w-sm sm:max-w-md">
                          {formData.linkText || formData.contentLink}
                        </div>
                      </div>
                    </div>
                    <a
                      href={formData.contentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded bg-accent px-3 py-1.5 font-mono text-xs font-bold text-black shadow-sm transition-all hover:bg-accent/90 shrink-0"
                    >
                      <span>OPEN PAGE</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {/* Trigger Condition Alert Box */}
                <div className="mt-2 flex items-start gap-3 rounded border border-accent/30 bg-accent/5 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                  <div className="font-mono text-xs">
                    <span className="font-bold text-accent">TRIGGER CONDITION: </span>
                    <span className="text-foreground/90">{formData.triggerCondition}</span>
                  </div>
                </div>
              </div>

              {/* Execution Steps */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <div className="font-mono text-xs tracking-widest text-muted-foreground">
                    EXECUTION PROTOCOL STEPS ({formData.steps.length})
                  </div>
                  <div className="font-mono text-[11px] text-accent">
                    {Object.values(completedSteps).filter(Boolean).length}/{formData.steps.length} COMPLETED
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step) => {
                    const isDone = completedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        className={`group cursor-pointer rounded-lg border p-4 transition-all ${
                          isDone
                            ? "border-emerald-500/40 bg-emerald-950/20"
                            : "border-border/70 bg-white/[0.015] hover:border-accent/60 hover:bg-white/[0.04]"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-6 w-6 shrink-0 items-center justify-center rounded font-mono text-xs font-bold ${
                                isDone ? "bg-emerald-500 text-black" : "bg-white/10 text-accent"
                              }`}
                            >
                              {step.order}
                            </span>
                            <div>
                              <h4 className={`font-semibold text-sm ${isDone ? "line-through text-muted-foreground" : "text-foreground"}`}>
                                {step.title}
                              </h4>
                              <p className="mt-1 text-xs text-muted-foreground leading-relaxed">
                                {step.description}
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className={`h-5 w-5 shrink-0 transition-colors ${isDone ? "text-emerald-400" : "text-white/20 group-hover:text-white/40"}`} />
                        </div>

                        {step.command && (
                          <div className="mt-3 flex items-center justify-between rounded bg-black/70 border border-white/10 px-3 py-2 font-mono text-xs text-accent">
                            <span className="overflow-x-auto pr-2 select-all">$ {step.command}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(step.command!);
                              }}
                              className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[11px] text-muted-foreground hover:bg-white/20 hover:text-foreground"
                            >
                              <Copy className="h-3 w-3" />
                              <span>{copiedCmd === step.command ? "COPIED!" : "COPY"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Escalation Matrix */}
              <div className="rounded-lg border border-border/70 bg-white/[0.02] p-4">
                <div className="font-mono text-xs tracking-widest text-muted-foreground">ESCALATION PATH</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-mono">
                  <div className="rounded border border-white/10 bg-black/40 p-3">
                    <span className="text-muted-foreground">TIER 1 DISPATCH:</span>
                    <div className="mt-1 font-bold text-foreground">{formData.escalation.level1}</div>
                  </div>
                  <div className="rounded border border-white/10 bg-black/40 p-3">
                    <span className="text-muted-foreground">TIER 2 ESCALATION:</span>
                    <div className="mt-1 font-bold text-accent">{formData.escalation.level2}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERMINAL EDITOR */}
          {activeTab === "editor" && (
            <div className="space-y-5 font-mono text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-muted-foreground">SOP CODE</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground">CATEGORY</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                    className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="Robotics">Robotics</option>
                    <option value="WMS/RCS">WMS/RCS</option>
                    <option value="Firmware">Firmware</option>
                    <option value="Hardware">Hardware</option>
                    <option value="Network">Network</option>
                    <option value="Safety">Safety</option>
                  </select>
                </div>
                <div>
                  <label className="text-muted-foreground">PRIORITY</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
                  >
                    <option value="CRITICAL">CRITICAL</option>
                    <option value="HIGH">HIGH</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="LOW">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-muted-foreground">SOP TITLE</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground font-display text-sm focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground">SUMMARY & OBJECTIVE</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground focus:border-accent focus:outline-none"
                />
              </div>

              <div>
                <label className="text-muted-foreground">TRIGGER CONDITION (WHEN TO EXECUTE)</label>
                <input
                  type="text"
                  value={formData.triggerCondition}
                  onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
                  className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent focus:border-accent focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-muted-foreground">CONTENT / REDIRECT LINK (URL)</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/... or https://atlassian.net/..."
                    value={formData.contentLink || ""}
                    onChange={(e) => setFormData({ ...formData, contentLink: e.target.value })}
                    className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-accent font-mono text-[11px] focus:border-accent focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-muted-foreground">LINK DISPLAY TEXT</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Template of DIR .docx"
                    value={formData.linkText || ""}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    className="mt-1 w-full rounded border border-border/80 bg-black/60 px-3 py-2 text-foreground text-xs focus:border-accent focus:outline-none"
                  />
                </div>
              </div>

              {/* Editable Steps */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-muted-foreground">EDIT PROCEDURE STEPS</span>
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1 rounded bg-white/10 px-2.5 py-1 text-accent hover:bg-white/20"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>ADD STEP</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step, i) => (
                    <div key={step.id} className="rounded border border-border/70 bg-black/40 p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-accent">STEP {i + 1}</span>
                        <button
                          onClick={() => handleRemoveStep(i)}
                          className="rounded p-1 text-muted-foreground hover:bg-destructive/20 hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <input
                        type="text"
                        placeholder="Step Title"
                        value={step.title}
                        onChange={(e) => {
                          const steps = [...formData.steps];
                          steps[i].title = e.target.value;
                          setFormData({ ...formData, steps });
                        }}
                        className="w-full rounded border border-white/10 bg-black/60 px-2.5 py-1.5 text-foreground focus:border-accent focus:outline-none"
                      />
                      <textarea
                        rows={2}
                        placeholder="Step Description / Instructions"
                        value={step.description}
                        onChange={(e) => {
                          const steps = [...formData.steps];
                          steps[i].description = e.target.value;
                          setFormData({ ...formData, steps });
                        }}
                        className="w-full rounded border border-white/10 bg-black/60 px-2.5 py-1.5 text-muted-foreground focus:border-accent focus:outline-none"
                      />
                      <input
                        type="text"
                        placeholder="CLI Command (optional)"
                        value={step.command || ""}
                        onChange={(e) => {
                          const steps = [...formData.steps];
                          steps[i].command = e.target.value;
                          setFormData({ ...formData, steps });
                        }}
                        className="w-full rounded border border-white/10 bg-black/70 px-2.5 py-1.5 text-accent font-mono text-[11px] focus:border-accent focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CLI DIAGNOSTICS */}
          {activeTab === "diagnostics" && (
            <div className="flex h-full min-h-[400px] flex-col rounded-lg border border-accent/40 bg-black/90 p-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-white/10 pb-2 text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-accent" />
                  <span>GREYORANGE LIVE CLI SIMULATION CONSOLE</span>
                </div>
                <span>STATUS: {isSimulating ? "RUNNING" : "IDLE"}</span>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto py-3 text-emerald-400">
                {diagLogs.length === 0 ? (
                  <div className="text-muted-foreground italic">
                    Press "RUN CLI SIM" to test and simulate automated execution of this SOP across the robotic fleet.
                  </div>
                ) : (
                  diagLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("ERROR") ? "text-destructive" : log.includes("CMD") ? "text-accent font-bold" : ""}>
                      {log}
                    </div>
                  ))
                )}
                {isSimulating && (
                  <div className="animate-pulse text-accent">_</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
