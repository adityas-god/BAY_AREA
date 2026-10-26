import { Link } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Sun, Moon } from "lucide-react";

export function SiteHeader({ action }: { action?: ReactNode }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const isD =
      document.documentElement.classList.contains("dark") ||
      localStorage.getItem("bay_area_theme") !== "light";
    setIsDark(isD);
    if (isD) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("bay_area_theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("bay_area_theme", "light");
    }
  };

  return (
    <header className="border-b border-foreground/15 bg-background/90 backdrop-blur-md sticky top-0 z-30">
      <div className="mx-auto grid max-w-6xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-6 py-4 sm:flex sm:flex-wrap sm:justify-between">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display text-2xl font-bold uppercase tracking-tight text-foreground">
                BAY AREA
              </span>
              <span className="text-[10px] font-sans font-bold text-accent align-super">™</span>
              <span className="h-2 w-2 shrink-0 rounded-full bg-accent ml-0.5" aria-hidden />
            </div>
            <span className="text-[9px] font-mono font-medium tracking-[0.22em] text-muted-foreground uppercase -mt-0.5">
              SOP HUB FOR GREYORANGE
            </span>
          </div>
        </Link>
        <div className="flex shrink-0 items-center gap-4">
          <Link
            to="/"
            className="text-[11px] font-semibold uppercase tracking-[0.25em] text-foreground/70 transition-colors hover:text-foreground"
          >
            Teams
          </Link>
          <button
            type="button"
            onClick={toggle}
            title={isDark ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
            className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-foreground/20 text-muted-foreground transition-colors hover:border-accent hover:text-accent cursor-pointer"
          >
            {isDark ? <Sun className="h-4 w-4 text-accent" /> : <Moon className="h-4 w-4" />}
          </button>
          {action}
        </div>
      </div>
    </header>
  );
}
