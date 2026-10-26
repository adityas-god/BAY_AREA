import type { ReactNode } from "react";
import { Compass, Box, Sun, Moon } from "lucide-react";

export function SiteHeader({
  action,
  onNavigateHome,
  onFlipToVillage,
  isDark = true,
  onToggleDarkMode,
}: {
  action?: ReactNode;
  onNavigateHome?: () => void;
  onFlipToVillage?: () => void;
  isDark?: boolean;
  onToggleDarkMode?: () => void;
}) {
  return (
    <header className="border-b border-foreground/15 bg-background/90 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:flex-wrap sm:justify-between">
        <button
          type="button"
          onClick={onNavigateHome}
          className="flex min-w-0 items-center gap-2 text-left cursor-pointer group"
        >
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-bold uppercase tracking-tight text-foreground group-hover:text-accent transition-colors">
                BAY AREA
              </span>
              <span className="text-[10px] font-sans font-bold text-accent align-super">™</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent ml-0.5" aria-hidden />
            </div>
            <span className="text-[9px] font-mono font-medium tracking-[0.22em] text-muted-foreground uppercase -mt-0.5">
              SOP HUB FOR GREYORANGE
            </span>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-3 sm:gap-4">
          <button
            type="button"
            onClick={onNavigateHome}
            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:text-foreground cursor-pointer"
          >
            Teams
          </button>

          {onToggleDarkMode && (
            <button
              type="button"
              onClick={onToggleDarkMode}
              title={isDark ? "Switch to light mode" : "Switch to dark mode"}
              aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/25 text-muted-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer"
            >
              {isDark ? (
                <Sun className="h-4 w-4 text-accent" />
              ) : (
                <Moon className="h-4 w-4" />
              )}
            </button>
          )}

          {onFlipToVillage && (
            <button
              type="button"
              onClick={onFlipToVillage}
              title="Switch to 3D Village Command Canvas [F]"
              className="pill border border-foreground/25 text-foreground hover:border-accent hover:text-accent transition-colors cursor-pointer flex items-center gap-1.5"
            >
              <Compass className="h-3.5 w-3.5 text-accent" />
              <span>3D Village</span>
              <kbd className="hidden md:inline font-mono text-[9px] opacity-60 ml-0.5">[F]</kbd>
            </button>
          )}

          {action}
        </div>
      </div>
    </header>
  );
}
