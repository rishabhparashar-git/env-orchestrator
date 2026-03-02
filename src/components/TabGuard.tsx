"use client";

import { useEffect, useState } from "react";

export function TabGuard({ children }: { children: React.ReactNode }) {
  const [isLockedOut, setIsLockedOut] = useState(false);

  useEffect(() => {
    // We only run this on the client
    const bc = new BroadcastChannel("env_lock");

    // Tell anyone listening that we just booted up
    bc.postMessage("HELO");

    // Listen for messages
    bc.onmessage = (event) => {
      if (event.data === "HELO") {
        // Someone else just opened a tab.
        // We reply to tell them we are the original active tab.
        bc.postMessage("ACK");
      } else if (event.data === "ACK") {
        // We received an ACK, which means someone else is already active.
        setIsLockedOut(true);
      }
    };

    return () => {
      bc.close();
    };
  }, []);

  if (isLockedOut) {
    return (
      <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
        <div className="glass-panel max-w-md p-8 text-center rounded-xl animate-in zoom-in-95 duration-300">
          <h1 className="text-2xl font-bold mb-4 text-destructive">
            Active Session Detected
          </h1>
          <p className="text-muted-foreground mb-6">
            You already have this application open in another tab. To prevent
            data corruption, please switch back to the original tab.
          </p>
          <button
            onClick={() => {
              // Force taking over by refreshing which fires HELO again,
              // or simple window.location.reload()
              window.location.reload();
            }}
            className="w-full bg-primary text-primary-foreground hover:bg-primary/90 py-2 rounded-md font-medium transition-colors"
          >
            Click Here to Take Over This Session
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
