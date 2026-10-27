import { StrictMode, startTransition } from "react";
import { hydrateRoot } from "react-dom/client";
import { StartClient } from "@tanstack/react-start/client";

startTransition(() => {
  hydrateRoot(
    document,
    <StrictMode>
      <StartClient />
    </StrictMode>,
    {
      onRecoverableError(error) {
        // Hydration mismatch warnings are non-fatal in React 19; log without throwing uncaught exceptions
        if (typeof console !== "undefined" && console.warn) {
          console.warn("React hydration recovered:", error);
        }
      },
    },
  );
});
