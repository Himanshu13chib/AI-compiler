"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Baby, Sparkles, Loader2, RefreshCw } from "lucide-react";

interface ELI5ModeProps {
  result: Stage5Output;
}

interface ELI5Data {
  appSummary: string;
  whatItDoes: string;
  howItWorks: string[];
  whoUsesIt: string[];
  coolParts: string[];
  analogy: string;
}

const EMOJI_MAP: Record<number, string> = {
  0: "🌟",
  1: "🎯",
  2: "🚀",
  3: "💡",
  4: "🎨",
  5: "🔮",
};

export function ELI5Mode({ result }: ELI5ModeProps) {
  const [data, setData] = useState<ELI5Data | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function explain() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error("Failed to explain");
      const json = await res.json();
      setData(json);
    } catch {
      setError("Couldn't generate explanation. Try again!");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Baby className="w-5 h-5 text-pink-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Explain Like I&apos;m 5</h3>
          <span className="text-xs text-zinc-500">No jargon, just vibes</span>
        </div>
        <button
          onClick={explain}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-pink-600/20 border border-pink-600/40 text-pink-300 rounded-lg text-xs font-medium hover:bg-pink-600/30 transition-colors disabled:opacity-50"
        >
          {loading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : data ? (
            <RefreshCw className="w-3.5 h-3.5" />
          ) : (
            <Sparkles className="w-3.5 h-3.5" />
          )}
          {loading ? "Thinking..." : data ? "Re-explain" : "Explain it!"}
        </button>
      </div>

      <AnimatePresence mode="wait">
        {loading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-12 gap-3"
          >
            <div className="text-4xl animate-bounce">🤔</div>
            <p className="text-zinc-500 text-sm">Making it super simple...</p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div
            key="error"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-8 text-red-400 text-sm"
          >
            {error}
          </motion.div>
        )}

        {data && !loading && (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-5"
          >
            {/* Big summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-pink-950/40 to-purple-950/40 border border-pink-900/30 rounded-xl p-5 text-center"
            >
              <div className="text-4xl mb-3">🎉</div>
              <p className="text-zinc-200 text-base font-medium leading-relaxed">{data.appSummary}</p>
            </motion.div>

            {/* What it does */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">📖</span>
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">What it does</span>
              </div>
              <p className="text-zinc-400 text-sm leading-relaxed">{data.whatItDoes}</p>
            </motion.div>

            {/* The big analogy */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-amber-950/20 border border-amber-900/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💡</span>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">Think of it like...</span>
              </div>
              <p className="text-zinc-300 text-sm leading-relaxed italic">&ldquo;{data.analogy}&rdquo;</p>
            </motion.div>

            {/* How it works */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <span className="text-lg">⚙️</span>
                <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">How it works</span>
              </div>
              <div className="space-y-2">
                {data.howItWorks.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-xs text-indigo-400 font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-zinc-400 text-sm">{step}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Two columns: who uses it + cool parts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 }}
                className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">👥</span>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Who uses it</span>
                </div>
                <div className="space-y-2">
                  {data.whoUsesIt.map((user, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm">{["👤", "👩‍💼", "🧑‍💻", "👨‍🔬"][i % 4]}</span>
                      <p className="text-zinc-400 text-xs">{user}</p>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">✨</span>
                  <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">Cool parts</span>
                </div>
                <div className="space-y-2">
                  {data.coolParts.map((part, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <span className="text-sm">{EMOJI_MAP[i] || "⭐"}</span>
                      <p className="text-zinc-400 text-xs">{part}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}

        {!data && !loading && !error && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <div className="text-5xl mb-4">🧒</div>
            <p className="text-zinc-500 text-sm">
              Click &ldquo;Explain it!&rdquo; to get a jargon-free explanation of your app
            </p>
            <p className="text-zinc-600 text-xs mt-1">Perfect for showing non-technical stakeholders</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
