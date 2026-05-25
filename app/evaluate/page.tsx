"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { EVAL_DATASET } from "@/lib/evaluation/dataset";
import { calculateAggregateMetrics, type PromptResult } from "@/lib/evaluation/metrics";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Play, CheckCircle, XCircle, Clock, Loader2, BarChart3, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function EvaluatePage() {
  const [results, setResults] = useState<PromptResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  function viewInEditor(compiledConfig: any, promptText: string) {
    if (!compiledConfig) return;
    const activeBuild = {
      prompt: promptText,
      result: compiledConfig
    };
    localStorage.setItem("appcompiler_active_build", JSON.stringify(activeBuild));
    
    // Save to history too just in case
    try {
      const saved = localStorage.getItem("appcompiler_recent_builds");
      const recent = saved ? JSON.parse(saved) : [];
      const filtered = recent.filter((b: any) => b.appName.toLowerCase() !== compiledConfig.masterConfig.intent.appName.toLowerCase());
      const newBuild = {
        appName: compiledConfig.masterConfig.intent.appName,
        tagline: compiledConfig.masterConfig.intent.tagline,
        prompt: promptText,
        result: compiledConfig,
        timestamp: Date.now()
      };
      const next = [newBuild, ...filtered].slice(0, 10);
      localStorage.setItem("appcompiler_recent_builds", JSON.stringify(next));
    } catch (e) {
      console.error(e);
    }
    
    window.location.href = "/";
  }

  async function runBenchmark() {
    setRunning(true);
    setResults([]);
    setCurrentIndex(0);
    setProgress(0);

    try {
      const response = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });

      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "prompt_start") {
              setCurrentIndex(event.index);
            } else if (event.type === "prompt_failed") {
              setResults(prev => [...prev, event.result]);
              setProgress(((event.index + 1) / EVAL_DATASET.length) * 100);
            } else if (event.type === "prompt_complete") {
              const res = event.result;
              setResults(prev => [...prev, res]);
              setProgress(((event.index + 1) / EVAL_DATASET.length) * 100);
              
              // Automatically save successful runs in localStorage history
              if (res.success && res.compiledConfig) {
                try {
                  const saved = localStorage.getItem("appcompiler_recent_builds");
                  const recent = saved ? JSON.parse(saved) : [];
                  const filtered = recent.filter((b: any) => b.appName.toLowerCase() !== res.compiledConfig.masterConfig.intent.appName.toLowerCase());
                  const newBuild = {
                    appName: res.compiledConfig.masterConfig.intent.appName,
                    tagline: res.compiledConfig.masterConfig.intent.tagline,
                    prompt: EVAL_DATASET[event.index].prompt,
                    result: res.compiledConfig,
                    timestamp: Date.now()
                  };
                  const next = [newBuild, ...filtered].slice(0, 10);
                  localStorage.setItem("appcompiler_recent_builds", JSON.stringify(next));
                } catch (e) {
                  console.error("Failed to save benchmark config to recent builds", e);
                }
              }
            }
          } catch { /* ignore */ }
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
      setCurrentIndex(-1);
    }
  }

  const metrics = results.length > 0 ? calculateAggregateMetrics(results) : null;

  const latencyData = results.map(r => ({
    name: r.label.substring(0, 12),
    time: Math.round(r.totalTimeMs / 1000),
    success: r.success,
  }));

  const failureData = metrics
    ? Object.entries(metrics.failureBreakdown).map(([name, value]) => ({ name, value }))
    : [];

  const COLORS = ["#ef4444", "#f59e0b", "#6366f1", "#10b981", "#ec4899"];

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="fixed inset-0 bg-[linear-gradient(to_right,#18181b_1px,transparent_1px),linear-gradient(to_bottom,#18181b_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-30 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-4 py-12">
        <div className="flex items-center gap-4 mb-8">
          <Link href="/" className="flex items-center gap-1.5 text-zinc-500 hover:text-zinc-300 text-sm transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-400" />
              Evaluation Dashboard
            </h1>
            <p className="text-zinc-500 text-sm">Run all 20 prompts through the full pipeline and measure performance</p>
          </div>
          <div className="ml-auto">
            <button
              onClick={runBenchmark}
              disabled={running}
              className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 disabled:text-zinc-600 text-white font-semibold rounded-xl transition-all"
            >
              {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              {running ? `Running ${currentIndex + 1}/${EVAL_DATASET.length}...` : "Run Benchmark"}
            </button>
          </div>
        </div>

        {/* Progress */}
        {running && (
          <div className="mb-6 bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
            <div className="flex justify-between text-xs text-zinc-400 mb-2">
              <span>Running: {EVAL_DATASET[currentIndex]?.label || "..."}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-zinc-800 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-indigo-500 rounded-full"
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>
        )}

        {/* Aggregate metrics */}
        {metrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { label: "Success Rate", value: `${metrics.successRate.toFixed(1)}%`, color: metrics.successRate >= 80 ? "text-emerald-400" : "text-amber-400" },
              { label: "Avg Latency", value: `${(metrics.avgLatency / 1000).toFixed(1)}s`, color: "text-blue-400" },
              { label: "Avg Consistency", value: `${metrics.avgConsistencyScore.toFixed(0)}/100`, color: "text-indigo-400" },
              { label: "Avg Executability", value: `${metrics.avgExecutabilityScore.toFixed(0)}/100`, color: "text-purple-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-center">
                <div className={`text-2xl font-bold ${color}`}>{value}</div>
                <div className="text-xs text-zinc-500 mt-1">{label}</div>
              </div>
            ))}
          </div>
        )}

        {/* Charts */}
        {results.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h3 className="text-sm font-semibold text-zinc-300 mb-4">Latency by Prompt (seconds)</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={latencyData}>
                  <XAxis dataKey="name" tick={{ fontSize: 9, fill: "#71717a" }} />
                  <YAxis tick={{ fontSize: 9, fill: "#71717a" }} />
                  <Tooltip contentStyle={{ background: "#18181b", border: "1px solid #3f3f46", borderRadius: 8, fontSize: 11 }} />
                  <Bar dataKey="time" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {failureData.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-zinc-300 mb-4">Failure Breakdown</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={failureData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                      {failureData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Legend wrapperStyle={{ fontSize: 10 }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Results table */}
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="px-4 py-3 border-b border-zinc-800 text-xs font-semibold text-zinc-400 grid grid-cols-12 gap-2">
            <div className="col-span-1">#</div>
            <div className="col-span-3">Prompt</div>
            <div className="col-span-1">Type</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Time</div>
            <div className="col-span-2">Consistency</div>
            <div className="col-span-2">Executability</div>
          </div>
          {EVAL_DATASET.map((prompt, i) => {
            const result = results.find(r => r.id === prompt.id);
            const isCurrent = running && currentIndex === i;
            return (
              <div
                key={prompt.id}
                className={`px-4 py-3 border-b border-zinc-800/50 text-xs grid grid-cols-12 gap-2 items-center transition-colors ${
                  isCurrent ? "bg-indigo-950/30" : "hover:bg-zinc-800/20"
                }`}
              >
                <div className="col-span-1 text-zinc-600">{i + 1}</div>
                <div className="col-span-3 text-zinc-300 font-medium">{prompt.label}</div>
                <div className="col-span-1">
                  <span className={`px-1.5 py-0.5 rounded text-[10px] ${
                    prompt.category === "real"
                      ? "bg-blue-500/10 text-blue-400"
                      : "bg-amber-500/10 text-amber-400"
                  }`}>
                    {prompt.category}
                  </span>
                </div>
                <div className="col-span-1">
                  {isCurrent ? (
                    <Loader2 className="w-3.5 h-3.5 text-indigo-400 animate-spin" />
                  ) : result ? (
                    result.success
                      ? (
                        <button
                          onClick={() => viewInEditor((result as any).compiledConfig, prompt.prompt)}
                          className="flex items-center gap-1 text-emerald-400 hover:text-emerald-300 font-semibold cursor-pointer group"
                          title="Click to view full architecture in main editor"
                        >
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-400 group-hover:scale-110 transition-transform animate-pulse" />
                          <span className="text-[10px] underline opacity-0 group-hover:opacity-100 transition-opacity">View</span>
                        </button>
                      )
                      : <XCircle className="w-3.5 h-3.5 text-red-400" />
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full border border-zinc-700" />
                  )}
                </div>
                <div className="col-span-2 text-zinc-500 flex items-center gap-1">
                  {result && <><Clock className="w-3 h-3" />{(result.totalTimeMs / 1000).toFixed(1)}s</>}
                </div>
                <div className="col-span-2">
                  {result?.success && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${result.consistencyScore}%` }} />
                      </div>
                      <span className="text-zinc-400 w-6">{result.consistencyScore}</span>
                    </div>
                  )}
                  {result && !result.success && <span className="text-red-400 text-[10px]">{result.failureType}</span>}
                </div>
                <div className="col-span-2">
                  {result?.success && (
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${result.executabilityScore}%` }} />
                      </div>
                      <span className="text-zinc-400 w-6">{result.executabilityScore}</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
