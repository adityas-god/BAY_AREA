import { useState, useEffect } from "react";
import { SOP, SOPStep, SOPPriority } from "@/lib/teams-sops";
import {
  X,
  Terminal,
  Edit3,
  CheckCircle2,
  Copy,
  Play,
  Save,
  Plus,
  Trash2,
  ShieldAlert,
  Clock,
  Activity,
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
          setIsSimulating(false);
          setDiagLogs((prev) => [
            ...prev,
            `[${new Date().toLocaleTimeString()}] >> EXECUTION FINISHED: ALL VERIFICATIONS CONFIRMED.`,
          ]);
        }
      }, (idx + 1) * 700);
    });
  };

  const priorityColor: Record<SOPPriority, string> = {
    CRITICAL: "bg-orange-950/70 border border-orange-500/40 text-orange-400 font-semibold",
    HIGH: "bg-orange-950/40 border border-orange-500/20 text-orange-300 font-semibold",
    MEDIUM: "bg-zinc-800 text-zinc-300",
    LOW: "bg-zinc-800 text-zinc-400",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 md:p-10 backdrop-blur-md bg-black/75 animate-in fade-in duration-200">
      {/* Sci-Fi Glassmorphic Window Container */}
      <div className="relative flex h-[90vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl dark-deco-card shadow-2xl backdrop-blur-2xl text-foreground">
        
        {/* Top Header */}
        <header className="relative z-20 flex h-14 shrink-0 items-center justify-between bg-black/50 px-4 md:px-6">
          <div className="flex items-center gap-3">
            <span className="flex h-3 w-3 relative">
              <span className={`relative inline-flex rounded-full h-3 w-3 ${formData.alert ? "bg-orange-500" : "bg-[#D9531E]"}`}></span>
            </span>
            <div className="flex items-center gap-2 font-sans text-xs">
              <span className="text-zinc-400">GREYORANGE://</span>
              <span className="font-display text-base tracking-wider text-orange-400">{formData.code}</span>
              <span className="hidden sm:inline text-zinc-600">/</span>
              <span className="hidden sm:inline text-zinc-400">{formData.category}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 font-sans text-xs text-zinc-300 bg-zinc-900/80 px-2.5 py-1 rounded-lg">
              <Clock className="h-3.5 w-3.5 text-orange-400" />
              <span>SLA: {formData.escalation.slaMinutes}m</span>
            </div>

            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white"
              aria-label="Close terminal"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Navigation Tabs Bar */}
        <div className="relative z-20 flex shrink-0 items-center justify-between bg-black/30 px-4 md:px-6">
          <div className="flex items-center gap-2 md:gap-4 font-display text-xs tracking-wider">
            <button
              onClick={() => setActiveTab("protocol")}
              className={`flex items-center gap-2 py-3 font-semibold transition-colors ${
                activeTab === "protocol"
                  ? "text-orange-400 bg-orange-950/40 border border-orange-500/30 px-3 rounded-lg"
                  : "text-zinc-400 hover:text-white px-3"
              }`}
            >
              <Terminal className="h-3.5 w-3.5" />
              <span>PROTOCOL RUNNER</span>
            </button>

            <button
              onClick={() => setActiveTab("editor")}
              className={`flex items-center gap-2 py-3 font-semibold transition-colors ${
                activeTab === "editor"
                  ? "text-orange-400 bg-orange-950/40 border border-orange-500/30 px-3 rounded-lg"
                  : "text-zinc-400 hover:text-white px-3"
              }`}
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span>TERMINAL EDITOR</span>
            </button>

            <button
              onClick={() => setActiveTab("diagnostics")}
              className={`flex items-center gap-2 py-3 font-semibold transition-colors ${
                activeTab === "diagnostics"
                  ? "text-orange-400 bg-orange-950/40 border border-orange-500/30 px-3 rounded-lg"
                  : "text-zinc-400 hover:text-white px-3"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>LIVE CLI DIAGNOSTICS</span>
            </button>
          </div>

          {activeTab === "editor" && (
            <button
              onClick={handleSave}
              className="my-1.5 flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-4 py-1.5 font-display text-xs tracking-wider text-white transition-all hover:bg-[#C84814]"
            >
              <Save className="h-3.5 w-3.5" />
              <span>SAVE CHANGES</span>
            </button>
          )}

          {activeTab === "diagnostics" && (
            <button
              onClick={runDiagnosticsSimulation}
              disabled={isSimulating}
              className="my-1.5 flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-4 py-1.5 font-display text-xs tracking-wider text-white transition-all hover:bg-[#C84814] disabled:opacity-50"
            >
              <Play className="h-3.5 w-3.5" />
              <span>{isSimulating ? "SIMULATING..." : "RUN CLI SIM"}</span>
            </button>
          )}
        </div>

        {/* Save confirmation toast */}
        {saveSuccess && (
          <div className="absolute top-16 right-6 z-30 flex items-center gap-2 rounded-lg bg-emerald-950/90 px-4 py-2 font-sans text-xs font-semibold text-emerald-300 shadow-xl backdrop-blur-md animate-in slide-in-from-top-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>SOP changes saved successfully</span>
          </div>
        )}

        {/* Terminal Body Content */}
        <div className="relative z-20 flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar font-sans">
          {/* TAB 1: PROTOCOL RUNNER */}
          {activeTab === "protocol" && (
            <div className="space-y-6">
              {/* Header Info Banner */}
              <div className="flex flex-col gap-3 rounded-xl bg-zinc-900/60 p-4 md:p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-display text-2xl tracking-wide text-white">
                    {formData.title}
                  </h2>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-lg px-2.5 py-1 font-sans text-xs ${priorityColor[formData.priority]}`}>
                      {formData.priority}
                    </span>
                    <span className="rounded-lg bg-zinc-800 px-2.5 py-1 font-sans text-xs text-zinc-400">
                      v{formData.version}
                    </span>
                    <span className="rounded-lg bg-zinc-800 px-2.5 py-1 font-sans text-xs text-zinc-400">
                      {formData.updatedAt}
                    </span>
                  </div>
                </div>

                <p className="text-sm text-zinc-300 leading-relaxed font-sans">
                  {formData.summary}
                </p>

                {/* Direct Link Redirection Banner */}
                {formData.contentLink && (
                  <div className="mt-2 flex items-center justify-between gap-3 rounded-lg bg-[#24130A] border border-orange-500/30 p-3.5 backdrop-blur-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#D9531E]/20 text-orange-400">
                        <ExternalLink className="h-4 w-4" />
                      </div>
                      <div>
                        <div className="font-display text-xs tracking-wider text-orange-400">
                          LIVE DOCUMENTATION / ROSTER LINK
                        </div>
                        <div className="font-sans text-xs text-zinc-300 truncate max-w-sm sm:max-w-md">
                          {formData.linkText || formData.contentLink}
                        </div>
                      </div>
                    </div>
                    <a
                      href={formData.contentLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 rounded-lg bg-[#D9531E] px-3.5 py-2 font-display text-xs tracking-wider text-white transition-all hover:bg-[#C84814] shrink-0 shadow-sm"
                    >
                      <span>OPEN PAGE</span>
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  </div>
                )}

                {/* Trigger Condition Alert Box */}
                <div className="mt-2 flex items-start gap-3 rounded-lg bg-zinc-950/70 p-3">
                  <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                  <div className="font-sans text-xs">
                    <span className="font-semibold text-orange-400">TRIGGER CONDITION: </span>
                    <span className="text-zinc-200">{formData.triggerCondition}</span>
                  </div>
                </div>
              </div>

              {/* Execution Steps */}
              <div>
                <div className="flex items-center justify-between pb-2">
                  <div className="font-display text-sm tracking-wider text-zinc-400">
                    EXECUTION PROTOCOL STEPS ({formData.steps.length})
                  </div>
                  <div className="font-sans text-xs text-orange-400 font-medium">
                    {Object.values(completedSteps).filter(Boolean).length}/{formData.steps.length} Completed
                  </div>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step) => {
                    const isDone = completedSteps[step.id];
                    return (
                      <div
                        key={step.id}
                        onClick={() => toggleStep(step.id)}
                        className={`group cursor-pointer rounded-xl p-4 transition-all ${
                          isDone
                            ? "bg-emerald-950/30"
                            : "bg-zinc-900/60 hover:bg-zinc-900"
                        }`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <span
                              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg font-display text-xs font-bold ${
                                isDone ? "bg-emerald-500 text-black" : "bg-zinc-800 text-orange-400"
                              }`}
                            >
                              {step.order}
                            </span>
                            <div>
                              <h4 className={`font-semibold text-sm ${isDone ? "line-through text-zinc-500" : "text-white"}`}>
                                {step.title}
                              </h4>
                              <p className="mt-1 text-xs text-zinc-400 leading-relaxed font-sans">
                                {step.description}
                              </p>
                            </div>
                          </div>
                          <CheckCircle2 className={`h-5 w-5 shrink-0 transition-colors ${isDone ? "text-emerald-400" : "text-zinc-600 group-hover:text-zinc-400"}`} />
                        </div>

                        {step.command && (
                          <div className="mt-3 flex items-center justify-between rounded-lg bg-zinc-950/80 px-3 py-2 font-mono text-xs text-orange-300">
                            <span className="overflow-x-auto pr-2 select-all">$ {step.command}</span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                copyToClipboard(step.command!);
                              }}
                              className="flex items-center gap-1 rounded-md bg-zinc-800 px-2 py-1 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
                            >
                              <Copy className="h-3 w-3" />
                              <span>{copiedCmd === step.command ? "COPIED" : "COPY"}</span>
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Escalation Matrix */}
              <div className="rounded-xl bg-zinc-900/60 p-4">
                <div className="font-display text-sm tracking-wider text-zinc-400">ESCALATION PATH</div>
                <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs font-sans">
                  <div className="rounded-lg bg-zinc-950/80 p-3.5">
                    <span className="text-zinc-400 font-medium">TIER 1 DISPATCH:</span>
                    <div className="mt-1 font-semibold text-white">{formData.escalation.level1}</div>
                  </div>
                  <div className="rounded-lg bg-zinc-950/80 p-3.5">
                    <span className="text-zinc-400 font-medium">TIER 2 ESCALATION:</span>
                    <div className="mt-1 font-semibold text-orange-400">{formData.escalation.level2}</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: TERMINAL EDITOR */}
          {activeTab === "editor" && (
            <div className="space-y-5 font-sans text-xs">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-zinc-400 font-medium">SOP CODE</label>
                  <input
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-orange-400 font-semibold focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium">CATEGORY</label>
                  <input
                    type="text"
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium">PRIORITY</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  >
                    <option value="CRITICAL" className="bg-zinc-900 text-orange-400">CRITICAL</option>
                    <option value="HIGH" className="bg-zinc-900 text-orange-300">HIGH</option>
                    <option value="MEDIUM" className="bg-zinc-900 text-zinc-300">MEDIUM</option>
                    <option value="LOW" className="bg-zinc-900 text-zinc-400">LOW</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-zinc-400 font-medium">SOP TITLE</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3.5 py-2.5 text-zinc-100 font-sans text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-medium">SUMMARY & OBJECTIVE</label>
                <textarea
                  rows={2}
                  value={formData.summary}
                  onChange={(e) => setFormData({ ...formData, summary: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3.5 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                />
              </div>

              <div>
                <label className="text-zinc-400 font-medium">TRIGGER CONDITION (WHEN TO EXECUTE)</label>
                <input
                  type="text"
                  value={formData.triggerCondition}
                  onChange={(e) => setFormData({ ...formData, triggerCondition: e.target.value })}
                  className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                />
              </div>

              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-zinc-400 font-medium">CONTENT / REDIRECT LINK (URL)</label>
                  <input
                    type="text"
                    placeholder="https://docs.google.com/... or https://atlassian.net/..."
                    value={formData.contentLink || ""}
                    onChange={(e) => setFormData({ ...formData, contentLink: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-orange-300 font-sans text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
                <div>
                  <label className="text-zinc-400 font-medium">LINK DISPLAY TEXT</label>
                  <input
                    type="text"
                    placeholder="e.g. Master Template of DIR .docx"
                    value={formData.linkText || ""}
                    onChange={(e) => setFormData({ ...formData, linkText: e.target.value })}
                    className="mt-1 w-full rounded-lg bg-zinc-950/80 px-3 py-2 text-zinc-100 text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                  />
                </div>
              </div>

              {/* Editable Steps */}
              <div className="pt-2">
                <div className="flex items-center justify-between pb-2">
                  <span className="text-zinc-400 font-medium">EDIT PROCEDURE STEPS</span>
                  <button
                    onClick={handleAddStep}
                    className="flex items-center gap-1 rounded-lg bg-zinc-900 px-3 py-1.5 text-xs text-orange-400 hover:bg-zinc-800 transition-colors"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>ADD STEP</span>
                  </button>
                </div>

                <div className="space-y-3">
                  {formData.steps.map((step, i) => (
                    <div key={step.id} className="rounded-xl bg-zinc-950/70 p-3.5 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="font-display text-xs tracking-wider text-orange-400">STEP {i + 1}</span>
                        <button
                          onClick={() => handleRemoveStep(i)}
                          className="rounded-lg p-1 text-zinc-500 hover:bg-orange-950/40 hover:text-orange-400 transition-colors"
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
                        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-zinc-100 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
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
                        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-orange-500/40"
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
                        className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-orange-300 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-orange-500/40"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LIVE CLI DIAGNOSTICS */}
          {activeTab === "diagnostics" && (
            <div className="flex h-full min-h-[400px] flex-col rounded-xl bg-zinc-950/80 p-4 font-mono text-xs">
              <div className="flex items-center justify-between pb-3 text-zinc-400">
                <div className="flex items-center gap-2">
                  <Terminal className="h-3.5 w-3.5 text-orange-400" />
                  <span className="font-sans font-medium">Fleet CLI Simulation Console</span>
                </div>
                <span className="font-sans">Status: {isSimulating ? "Running" : "Idle"}</span>
              </div>

              <div className="flex-1 space-y-1.5 overflow-y-auto py-3 text-emerald-400">
                {diagLogs.length === 0 ? (
                  <div className="text-zinc-500 italic font-sans text-xs">
                    Press "RUN CLI SIM" to test and simulate automated execution of this SOP across the robotic fleet.
                  </div>
                ) : (
                  diagLogs.map((log, idx) => (
                    <div key={idx} className={log.includes("ERROR") ? "text-orange-400" : log.includes("CMD") ? "text-orange-300 font-bold" : ""}>
                      {log}
                    </div>
                  ))
                )}
                {isSimulating && (
                  <div className="animate-pulse text-orange-400">_</div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
