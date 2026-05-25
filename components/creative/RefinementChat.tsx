"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { MessageSquare, Send, Loader2, ChevronDown, ChevronUp, AlertTriangle, Plus } from "lucide-react";

interface RefinementChatProps {
  result: Stage5Output;
}

interface HistoryEntry {
  instruction: string;
  summary: string;
}

interface Change {
  layer: string;
  type: "add" | "modify" | "remove";
  target: string;
  description: string;
  patch: Record<string, unknown>;
}

interface RefinementResult {
  summary: string;
  changes: Change[];
  warnings: string[];
  newFeatures: string[];
}

const LAYER_COLORS: Record<string, string> = {
  intent: "text-purple-400 bg-purple-950/30 border-purple-900/40",
  architecture: "text-blue-400 bg-blue-950/30 border-blue-900/40",
  api: "text-green-400 bg-green-950/30 border-green-900/40",
  database: "text-amber-400 bg-amber-950/30 border-amber-900/40",
  auth: "text-red-400 bg-red-950/30 border-red-900/40",
  ui: "text-cyan-400 bg-cyan-950/30 border-cyan-900/40",
};

const TYPE_ICONS: Record<string, string> = {
  add: "➕",
  modify: "✏️",
  remove: "🗑️",
};

const QUICK_REFINEMENTS = [
  "Add Stripe payment integration",
  "Add real-time notifications with WebSockets",
  "Add multi-tenant support with workspaces",
  "Add audit logging for all user actions",
  "Add rate limiting to all API endpoints",
  "Add email verification flow",
  "Add soft delete to all entities",
  "Add full-text search capability",
];

export function RefinementChat({ result }: RefinementChatProps) {
  const [instruction, setInstruction] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [lastResult, setLastResult] = useState<RefinementResult | null>(null);
  const [expandedChange, setExpandedChange] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const storageKey = `refine_history_${result.masterConfig.intent.appName.replace(/\s+/g, "_").toLowerCase()}`;

  // Load history from localStorage when result/appName changes
  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load refinement history", e);
      }
    } else {
      setHistory([]);
    }
    setLastResult(null);
  }, [result, storageKey]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [lastResult, loading]);

  async function refine() {
    const trimmed = instruction.trim();
    if (!trimmed || loading) return;

    setLoading(true);
    setError(null);
    setInstruction("");

    try {
      const res = await fetch("/api/refine", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result, instruction: trimmed, history }),
      });
      if (!res.ok) throw new Error("Refinement failed");
      const data: RefinementResult = await res.json();
      setLastResult(data);
      
      const newHistory = [...history, { instruction: trimmed, summary: data.summary }];
      setHistory(newHistory);
      localStorage.setItem(storageKey, JSON.stringify(newHistory));
      
      setExpandedChange(null);
    } catch {
      setError("Refinement failed. Try again.");
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare className="w-5 h-5 text-cyan-400" />
        <h3 className="text-sm font-semibold text-zinc-200">Incremental Refinement</h3>
        <span className="text-xs text-zinc-500">Surgical updates via chat</span>
        {history.length > 0 && (
          <span className="ml-auto text-[10px] px-2 py-0.5 bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 rounded-full">
            {history.length} refinement{history.length !== 1 ? "s" : ""} applied
          </span>
        )}
      </div>

      {/* History */}
      {history.length > 0 && (
        <div className="mb-4 space-y-2">
          {history.map((entry, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-start gap-3"
            >
              <div className="flex flex-col items-end gap-1 flex-1">
                <div className="bg-indigo-600/20 border border-indigo-600/30 rounded-xl rounded-tr-sm px-3 py-2 max-w-[80%] ml-auto">
                  <p className="text-xs text-indigo-200">{entry.instruction}</p>
                </div>
                <div className="bg-zinc-800/50 border border-zinc-700/50 rounded-xl rounded-tl-sm px-3 py-2 max-w-[80%]">
                  <p className="text-xs text-zinc-400">✓ {entry.summary}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Latest result */}
      <AnimatePresence>
        {lastResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-4 space-y-3"
          >
            <div className="flex items-center gap-2">
              <span className="text-sm">🔧</span>
              <span className="text-sm font-medium text-zinc-200">{lastResult.summary}</span>
            </div>

            {/* Changes */}
            <div className="space-y-2">
              {lastResult.changes.map((change, i) => (
                <div key={i} className={`border rounded-lg overflow-hidden ${LAYER_COLORS[change.layer] || "text-zinc-400 bg-zinc-800/30 border-zinc-700/40"}`}>
                  <button
                    onClick={() => setExpandedChange(expandedChange === i ? null : i)}
                    className="w-full flex items-center gap-2 px-3 py-2 text-left"
                  >
                    <span className="text-xs">{TYPE_ICONS[change.type]}</span>
                    <span className="text-xs font-medium flex-1">{change.target}</span>
                    <span className="text-[10px] opacity-60 capitalize">{change.layer}</span>
                    {expandedChange === i ? (
                      <ChevronUp className="w-3 h-3 opacity-60" />
                    ) : (
                      <ChevronDown className="w-3 h-3 opacity-60" />
                    )}
                  </button>
                  <AnimatePresence>
                    {expandedChange === i && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="px-3 pb-3 space-y-2">
                          <p className="text-[11px] opacity-80">{change.description}</p>
                          {Object.keys(change.patch).length > 0 && (
                            <pre className="text-[10px] bg-black/30 rounded p-2 overflow-x-auto opacity-70">
                              {JSON.stringify(change.patch, null, 2)}
                            </pre>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>

            {/* Warnings */}
            {lastResult.warnings.length > 0 && (
              <div className="bg-amber-950/20 border border-amber-900/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <AlertTriangle className="w-3 h-3 text-amber-400" />
                  <span className="text-[10px] font-semibold text-amber-400">Side Effects</span>
                </div>
                {lastResult.warnings.map((w, i) => (
                  <p key={i} className="text-[10px] text-amber-300/70">• {w}</p>
                ))}
              </div>
            )}

            {/* New features */}
            {lastResult.newFeatures.length > 0 && (
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-lg p-3">
                <div className="flex items-center gap-1.5 mb-1">
                  <Plus className="w-3 h-3 text-emerald-400" />
                  <span className="text-[10px] font-semibold text-emerald-400">New Features Added</span>
                </div>
                {lastResult.newFeatures.map((f, i) => (
                  <p key={i} className="text-[10px] text-emerald-300/70">• {f}</p>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <div className="mb-3 text-xs text-red-400 bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2">
          {error}
        </div>
      )}

      {/* Quick refinements */}
      {history.length === 0 && !lastResult && (
        <div className="mb-4">
          <p className="text-xs text-zinc-600 mb-2">Quick refinements:</p>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_REFINEMENTS.map((q, i) => (
              <button
                key={i}
                onClick={() => setInstruction(q)}
                className="text-[10px] px-2 py-1 bg-zinc-800/50 border border-zinc-700 text-zinc-500 rounded-lg hover:border-cyan-600/50 hover:text-cyan-400 transition-all"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="flex gap-2">
        <input
          ref={inputRef}
          value={instruction}
          onChange={e => setInstruction(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); refine(); } }}
          placeholder="e.g. Add Stripe payments, Add audit logging, Remove the analytics module..."
          className="flex-1 bg-black/40 border border-zinc-700 rounded-xl px-4 py-2.5 text-sm text-zinc-200 placeholder-zinc-600 focus:outline-none focus:border-cyan-600 transition-colors"
          disabled={loading}
        />
        <button
          onClick={refine}
          disabled={loading || !instruction.trim()}
          className="flex items-center gap-2 px-4 py-2.5 bg-cyan-600/20 border border-cyan-600/40 text-cyan-300 rounded-xl text-sm font-medium hover:bg-cyan-600/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </button>
      </div>
      <p className="text-[10px] text-zinc-700 mt-2">Press Enter to refine · Changes are descriptive (re-compile to apply)</p>
      <div ref={bottomRef} />
    </div>
  );
}
