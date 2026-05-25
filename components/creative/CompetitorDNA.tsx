"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  RadarChart, PolarGrid, PolarAngleAxis, Radar,
  ResponsiveContainer, Legend, Tooltip
} from "recharts";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Swords, Loader2, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface CompetitorDNAProps {
  result: Stage5Output;
}

interface CompetitorProfile {
  name: string;
  tagline: string;
  dnaScores: {
    complexity: number;
    scalability: number;
    security: number;
    uxFocus: number;
    apiRichness: number;
    dataModel: number;
    authSophistication: number;
    realtimeCapability: number;
  };
  strengths: string[];
  weaknesses: string[];
  differentiator: string;
}

interface CompetitorDNAData {
  competitors: CompetitorProfile[];
  yourApp: CompetitorProfile;
  insights: string[];
  uniqueAdvantages: string[];
  gaps: string[];
}

const DNA_LABELS: Record<string, string> = {
  complexity: "Complexity",
  scalability: "Scalability",
  security: "Security",
  uxFocus: "UX Focus",
  apiRichness: "API Richness",
  dataModel: "Data Model",
  authSophistication: "Auth",
  realtimeCapability: "Realtime",
};

const COLORS = ["#6366f1", "#f59e0b", "#10b981", "#ef4444"];

export function CompetitorDNA({ result }: CompetitorDNAProps) {
  const [data, setData] = useState<CompetitorDNAData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompetitor, setSelectedCompetitor] = useState<number | null>(null);

  async function analyze() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/competitor-dna", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const json = await res.json();
      setData(json);
      setSelectedCompetitor(null);
    } catch {
      setError("Couldn't analyze competitors. Try again.");
    } finally {
      setLoading(false);
    }
  }

  const radarData = data
    ? Object.keys(DNA_LABELS).map(key => {
        const row: Record<string, unknown> = { dimension: DNA_LABELS[key] };
        row[data.yourApp.name] = data.yourApp.dnaScores[key as keyof typeof data.yourApp.dnaScores];
        data.competitors.forEach(c => {
          row[c.name] = c.dnaScores[key as keyof typeof c.dnaScores];
        });
        return row;
      })
    : [];

  const allProfiles = data ? [data.yourApp, ...data.competitors] : [];

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-red-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Competitor DNA</h3>
          <span className="text-xs text-zinc-500">How you stack up against the market</span>
        </div>
        <button
          onClick={analyze}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-red-600/20 border border-red-600/40 text-red-300 rounded-lg text-xs font-medium hover:bg-red-600/30 transition-colors disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Swords className="w-3.5 h-3.5" />}
          {loading ? "Analyzing..." : data ? "Re-analyze" : "Analyze Competitors"}
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
            <div className="text-4xl animate-pulse">⚔️</div>
            <p className="text-zinc-500 text-sm">Scouting the competition...</p>
          </motion.div>
        )}

        {error && !loading && (
          <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-8 text-red-400 text-sm">{error}</motion.div>
        )}

        {data && !loading && (
          <motion.div key="content" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            {/* Radar chart */}
            <div className="bg-zinc-800/20 border border-zinc-700/50 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-4">DNA Radar Comparison</h4>
              <ResponsiveContainer width="100%" height={320}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke="#3f3f46" />
                  <PolarAngleAxis
                    dataKey="dimension"
                    tick={{ fill: "#71717a", fontSize: 11 }}
                  />
                  {allProfiles.map((profile, i) => (
                    <Radar
                      key={profile.name}
                      name={profile.name}
                      dataKey={profile.name}
                      stroke={COLORS[i % COLORS.length]}
                      fill={COLORS[i % COLORS.length]}
                      fillOpacity={i === 0 ? 0.25 : 0.08}
                      strokeWidth={i === 0 ? 2.5 : 1.5}
                    />
                  ))}
                  <Legend
                    wrapperStyle={{ fontSize: "11px", color: "#a1a1aa" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#18181b",
                      border: "1px solid #3f3f46",
                      borderRadius: "8px",
                      fontSize: "12px",
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>

            {/* Profile cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allProfiles.map((profile, i) => (
                <motion.button
                  key={profile.name}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedCompetitor(selectedCompetitor === i ? null : i)}
                  className={`text-left border rounded-xl p-4 transition-all ${
                    i === 0
                      ? "bg-indigo-950/30 border-indigo-800/50 hover:border-indigo-600/60"
                      : "bg-zinc-800/20 border-zinc-700/50 hover:border-zinc-600"
                  } ${selectedCompetitor === i ? "ring-1 ring-indigo-500/50" : ""}`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: COLORS[i % COLORS.length] }}
                        />
                        <span className="text-sm font-semibold text-zinc-200">{profile.name}</span>
                        {i === 0 && (
                          <span className="text-[10px] px-1.5 py-0.5 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 rounded">
                            Your App
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-zinc-500 mt-0.5 ml-4">{profile.tagline}</p>
                    </div>
                    <div className="text-xs text-zinc-600">
                      {selectedCompetitor === i ? "▲" : "▼"}
                    </div>
                  </div>

                  <AnimatePresence>
                    {selectedCompetitor === i && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-3 space-y-3 overflow-hidden"
                      >
                        {/* Score bars */}
                        <div className="space-y-1.5">
                          {Object.entries(profile.dnaScores).map(([key, val]) => (
                            <div key={key} className="flex items-center gap-2">
                              <span className="text-[10px] text-zinc-500 w-24 shrink-0">{DNA_LABELS[key]}</span>
                              <div className="flex-1 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: `${(val / 10) * 100}%` }}
                                  transition={{ duration: 0.5, delay: 0.1 }}
                                  className="h-full rounded-full"
                                  style={{ backgroundColor: COLORS[i % COLORS.length] }}
                                />
                              </div>
                              <span className="text-[10px] text-zinc-400 w-4 text-right">{val}</span>
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingUp className="w-3 h-3 text-emerald-400" />
                              <span className="text-[10px] text-emerald-400 font-medium">Strengths</span>
                            </div>
                            {profile.strengths.map((s, j) => (
                              <p key={j} className="text-[10px] text-zinc-500">• {s}</p>
                            ))}
                          </div>
                          <div>
                            <div className="flex items-center gap-1 mb-1">
                              <TrendingDown className="w-3 h-3 text-red-400" />
                              <span className="text-[10px] text-red-400 font-medium">Weaknesses</span>
                            </div>
                            {profile.weaknesses.map((w, j) => (
                              <p key={j} className="text-[10px] text-zinc-500">• {w}</p>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-start gap-1.5">
                          <Minus className="w-3 h-3 text-zinc-500 shrink-0 mt-0.5" />
                          <p className="text-[10px] text-zinc-500 italic">{profile.differentiator}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.button>
              ))}
            </div>

            {/* Insights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="bg-zinc-800/20 border border-zinc-700/50 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-base">💡</span>
                  <span className="text-xs font-semibold text-zinc-300">Insights</span>
                </div>
                {data.insights.map((insight, i) => (
                  <p key={i} className="text-xs text-zinc-500 mb-1">• {insight}</p>
                ))}
              </div>
              <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-emerald-400">Your Advantages</span>
                </div>
                {data.uniqueAdvantages.map((adv, i) => (
                  <p key={i} className="text-xs text-zinc-500 mb-1">• {adv}</p>
                ))}
              </div>
              <div className="bg-red-950/20 border border-red-900/30 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="w-3.5 h-3.5 text-red-400" />
                  <span className="text-xs font-semibold text-red-400">Gaps to Close</span>
                </div>
                {data.gaps.map((gap, i) => (
                  <p key={i} className="text-xs text-zinc-500 mb-1">• {gap}</p>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {!data && !loading && !error && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="text-center py-10"
          >
            <div className="text-5xl mb-4">⚔️</div>
            <p className="text-zinc-500 text-sm">See how your app stacks up against real competitors</p>
            <p className="text-zinc-600 text-xs mt-1">Radar chart comparison across 8 DNA dimensions</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
