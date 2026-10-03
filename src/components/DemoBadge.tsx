import { useEffect, useState } from "react";
import { Sparkles, Zap } from "lucide-react";
import { getGroqKey, isDemoMode, openAiSettings } from "@/lib/demoMode";

const DemoBadge = () => {
  const [hasKey, setHasKey] = useState(() => Boolean(getGroqKey()));

  useEffect(() => {
    const refresh = () => setHasKey(Boolean(getGroqKey()));
    window.addEventListener("skillquest:ai-key-changed", refresh);
    return () => window.removeEventListener("skillquest:ai-key-changed", refresh);
  }, []);

  if (!isDemoMode) return null;

  return (
    <button
      type="button"
      onClick={() => openAiSettings()}
      title={hasKey ? "Live Groq AI active — click to manage your API key" : "Click to add your free Groq API key for live AI"}
      className={`fixed bottom-4 right-4 z-50 flex items-center gap-2 rounded-full border px-3.5 py-2 text-xs font-medium shadow-elevated backdrop-blur transition-all hover:scale-105 ${
        hasKey
          ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
          : "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
      }`}
    >
      {hasKey ? (
        <>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
          </span>
          <Zap className="h-3.5 w-3.5" />
          Live Groq AI
        </>
      ) : (
        <>
          <span className="h-2 w-2 rounded-full bg-amber-500" />
          <Sparkles className="h-3.5 w-3.5" />
          Offline AI
          <span className="hidden sm:inline text-[10px] opacity-80">· add free key</span>
        </>
      )}
    </button>
  );
};

export default DemoBadge;
