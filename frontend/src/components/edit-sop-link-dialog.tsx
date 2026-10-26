import { useState, useEffect } from "react";
import { SOP } from "@/lib/teams-sops";
import { X, Link2, ExternalLink, Save, Check } from "lucide-react";

interface EditSopLinkDialogProps {
  sop: SOP | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveLink: (sopId: string, contentLink: string, linkText: string) => void;
}

export function EditSopLinkDialog({
  sop,
  isOpen,
  onClose,
  onSaveLink,
}: EditSopLinkDialogProps) {
  const [contentLink, setContentLink] = useState("");
  const [linkText, setLinkText] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sop && isOpen) {
      setContentLink(sop.contentLink || "");
      setLinkText(sop.linkText || "");
      setError(null);
    }
  }, [sop, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !sop) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedUrl = contentLink.trim();

    if (trimmedUrl && !/^https?:\/\//i.test(trimmedUrl)) {
      setError("Please provide a valid URL starting with http:// or https://");
      return;
    }

    onSaveLink(sop.id, trimmedUrl, linkText.trim());
    onClose();
  };

  const handleClearLink = () => {
    onSaveLink(sop.id, "", "");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-lg bg-[#141518] border border-zinc-800/80 p-6 shadow-2xl text-foreground font-sans">
        {/* Header */}
        <div className="flex items-center justify-between pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded bg-[#D9531E] text-white">
              <Link2 className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-lg font-bold tracking-wider text-white uppercase">
                Manage Procedure Link
              </h3>
              <p className="text-xs text-zinc-400 font-sans">
                SOP: <strong className="text-orange-400">{sop.code}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-white/10 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Title preview */}
        <div className="mt-2 rounded bg-black/40 p-3">
          <div className="text-[11px] text-zinc-400 font-medium">SOP TITLE</div>
          <div className="text-xs font-semibold text-white truncate mt-0.5">{sop.title}</div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-4 space-y-4 text-xs font-sans">
          <div>
            <label className="text-zinc-300 block text-xs font-medium">
              External Documentation Link (URL)
            </label>
            <input
              type="text"
              placeholder="https://docs.google.com/... or https://wiki.greyorange.com/..."
              value={contentLink}
              onChange={(e) => {
                setContentLink(e.target.value);
                setError(null);
              }}
              className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white placeholder:text-zinc-500 focus:bg-black/80 focus:outline-none text-xs"
            />
            {error && <p className="mt-1 text-xs text-orange-400">{error}</p>}
          </div>

          <div>
            <label className="text-zinc-300 block text-xs font-medium">
              Button Display Text
            </label>
            <input
              type="text"
              placeholder="e.g. Master Template of DIR .docx / Incident Roster"
              value={linkText}
              onChange={(e) => setLinkText(e.target.value)}
              className="mt-1.5 w-full rounded bg-black/60 px-3 py-2 text-white placeholder:text-zinc-500 focus:bg-black/80 focus:outline-none text-xs"
            />
          </div>

          {contentLink && (
            <div className="rounded bg-[#22150E] border border-orange-500/20 p-2.5 text-xs text-zinc-200 flex items-center justify-between">
              <span className="truncate max-w-[260px]">{contentLink}</span>
              <a
                href={contentLink}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 font-medium text-orange-400 underline hover:text-white shrink-0 ml-2"
              >
                Test <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}

          <div className="flex items-center justify-between pt-4">
            {sop.contentLink ? (
              <button
                type="button"
                onClick={handleClearLink}
                className="text-xs text-orange-400 hover:underline"
              >
                Remove Link
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="rounded bg-zinc-800 px-3.5 py-1.5 text-xs text-zinc-300 hover:bg-zinc-700 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center gap-1.5 rounded bg-[#D9531E] px-4 py-1.5 text-xs font-medium text-white transition-colors hover:bg-[#C84814]"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save Link</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
