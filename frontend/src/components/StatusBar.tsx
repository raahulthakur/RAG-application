"use client";

import { useEffect, useState } from "react";
import { healthCheck } from "@/lib/api";

export function StatusBar() {
  const [status, setStatus] = useState<"checking" | "online" | "offline">(
    "checking"
  );

  useEffect(() => {
    let mounted = true;
    const check = async () => {
      try {
        await healthCheck();
        if (mounted) setStatus("online");
      } catch {
        if (mounted) setStatus("offline");
      }
    };
    check();
    const interval = setInterval(check, 30_000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs text-white/50">
      <span
        className={`w-1.5 h-1.5 rounded-full ${
          status === "online"
            ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]"
            : status === "offline"
            ? "bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.8)]"
            : "bg-yellow-400 animate-pulse"
        }`}
      />
      <span>
        {status === "online"
          ? "Backend connected"
          : status === "offline"
          ? "Backend offline"
          : "Connecting…"}
      </span>
    </div>
  );
}
