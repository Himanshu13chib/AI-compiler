"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { EVAL_DATASET } from "@/lib/evaluation/dataset";
import { calculateAggregateMetrics, type PromptResult } from "@/lib/evaluation/metrics";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, ScatterChart, Scatter,
  PieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
  Play, CheckCircle, XCircle, Clock, Loader2, Download,
  TrendingUp, TrendingDown, Info, AlertCircle
} from "lucide-react";

const FAILURE_COLORS = ["#8b5cf6", "#ef4444", "#f59e0b", "#06b6d4", "#475569"];
const TT = { contentStyle: { background: "#13131f", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 11, color: "#94a3b8" } };

function NoData({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-1.5 text-[#334155]">
      <Info className="w-4 h-4" />
      <span className="text-[10px] text-center">Run benchmark to see {label}</span>
    </div>
  );
}

export function EvaluationView() {
  const [results, setResults] = useState<PromptResult[]>([]);
  const [running, setRunning] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [progress, setProgress] = useState(0);

  const hasData = results.length > 0;
  const metrics = hasData ? calculateAggregateMetrics(results) : null;

  // ── All chart data derived from real results ──────────────────────────────

  const successOverTime = useMemo(() =>
    results.map((r, i) => {
      const soFar = results.slice(0, i + 1);
      return {
        label: r.label.slice(0, 10),
        rate: parseFloat(((soFar.filter(x => x.success).length / soFar.length) * 100).toFixed(1)),
      };
    }), [results]);

  const latencyDist = useMemo(() => {
    const b = [
      { range: "0-10s", count: 0 }, { range: "10-20s", count: 0 },
      { range: "20-30s", count: 0 }, { range: "30-40s", count: 0 }, { range: "40s+", count: 0 },
    ];
    results.forEach(r => {
      const s = r.totalTimeMs / 1000;
      if (s < 10) b[0].count++;
      else if (s < 20) b[1].count++;
      else if (s < 30) b[2].count++;
      else if (s < 40) b[3].count++;
      else b[4].count++;
    });
    return b;
  }, [results]);

  const failureTypes = useMemo(() => {
    if (!metrics || !Object.keys(metrics.failureBreakdown).length) return [];
    const total = Object.values(metrics.failureBreakdown).reduce((a, b) => a + b, 0);
    return Object.entries(metrics.failureBreakdown).map(([name, count], i) => ({
      name, value: Math.round((count / total) * 100), color: FAILURE_COLORS[i % FAILURE_COLORS.length],
    }));
  }, [metrics]);

  const complexityScatter = useMemo(() =>
    results.map(r => ({
      complexity: EVAL_DATASET.find(p => p.id === r.id)?.expectedComplexity ?? 5,
      score: r.success ? r.consistencyScore : 0,
      label: r.label,
    })), [results]);

  const latencyByPrompt = useMemo(() =>
    results.map(r => ({
      name: r.label.slice(0, 12),
      time: parseFloat((r.totalTimeMs / 1000).toFixed(1)),
    })), [results]);

  const topPipelines = useMemo(() =>
    results.filter(r => r.success)
      .sort((a, b) => b.consistencyScore - a.consistencyScore)
      .slice(0, 5)
      .map(r => ({ name: r.label, rate: r.consistencyScore, time: (r.totalTimeMs / 1000).toFixed(1) + "s" })),
    [results]);

  // ── Benchmark runner ──────────────────────────────────────────────────────

  async function runBenchmark() {
    setRunning(true);
    setResults([]);
    setCurrentIndex(0);
    setProgress(0);
    try {
      const res = await fetch("/api/evaluate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      if (!res.body) throw new Error("No stream");
      const reader = res.body.getReader();
      const dec = new TextDecoder();
      let buf = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += dec.decode(value, { stream: true });
        const lines = buf.split("\n\n");
        buf = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const ev = JSON.parse(line.slice(6));
            if (ev.type === "prompt_start") setCurrentIndex(ev.index);
            else if (ev.type === "prompt_complete" || ev.type === "prompt_failed") {
              setResults(prev => [...prev, ev.result]);
              setProgress(((ev.index + 1) / EVAL_DATASET.length) * 100);
            }
          } catch {}
        }
      }
    } catch {}
    finally { setRunning(false); setCurrentIndex(-1); }
  }

  function exportCSV() {
    if (!hasData) return;
    const header = "id,label,category,success,timeMs,consistencyScore,executabilityScore,failureType\n";
    const rows = results.map(r =>
      `${r.id},${r.label},${r.category},${r.success},${r.totalTimeMs},${r.consistencyScore},${r.executabilityScore},${r.failureType || ""}`
    ).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "eval-results.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="p-5 space-y-4">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Evaluation Dashboard</h2>
          <p className="text-xs text-[#475569]">
            {hasData
              ? `${results.length} / ${EVAL_DATASET.length} prompts evaluated — all readings are real`
              : "Run the benchmark to see real performance metrics"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {hasData && (
            <button onClick={exportCSV}
              className="flex items-center gap-1.5 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
              <Download className="w-3.5 h-3.5" /> Export CSV
            </button>
          )}
          <button onClick={runBenchmark} disabled={running}
            className="flex items-center gap-2 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-[#1e1e2e] disabled:text-[#334155] text-white text-xs font-semibold rounded-lg transition-all">
            {running ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
            {running ? `Running ${currentIndex + 1} / ${EVAL_DATASET.length}…` : "Run Benchmark"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      {running && (
        <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-3">
          <div className="flex justify-between text-xs text-[#64748b] mb-2">
            <span>Running: {EVAL_DATASET[currentIndex]?.label || "…"}</span>
            <span>{Math.round(progress)}%</span>
          </div>
          <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden">
            <motion.div className="h-full bg-violet-600 rounded-full"
              animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
          </div>
        </div>
      )}

      {/* No-data banner */}
      {!hasData && !running && (
        <div className="flex items-center gap-3 px-4 py-3 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl text-xs text-[#475569]">
          <AlertCircle className="w-4 h-4 text-violet-400 shrink-0" />
          No benchmark data yet. Click <span className="text-violet-400 font-semibold mx-1">Run Benchmark</span>
          to evaluate all {EVAL_DATASET.length} prompts through the real AI pipeline.
          Results will populate every chart and table below in real time.
        </div>
      )}

      {/* KPI cards — real values when available */}
      <div className="grid grid-cols-5 gap-3">
        {[
          {
            label: "Success Rate",
            value: metrics ? `${metrics.successRate.toFixed(1)}%` : "—",
            sub: metrics ? `${results.filter(r => r.success).length} / ${results.length} passed` : "run benchmark",
            up: true, color: "text-emerald-400",
          },
          {
            label: "Avg. Latency",
            value: metrics ? `${(metrics.avgLatency / 1000).toFixed(1)}s` : "—",
            sub: metrics ? `fastest: ${(metrics.fastestRun / 1000).toFixed(1)}s` : "run benchmark",
            up: false, color: "text-blue-400",
          },
          {
            label: "Avg. Consistency",
            value: metrics ? `${metrics.avgConsistencyScore.toFixed(0)}/100` : "—",
            sub: metrics ? "cross-layer score" : "run benchmark",
            up: true, color: "text-violet-400",
          },
          {
            label: "Avg. Executability",
            value: metrics ? `${metrics.avgExecutabilityScore.toFixed(0)}/100` : "—",
            sub: metrics ? "flow simulation" : "run benchmark",
            up: true, color: "text-cyan-400",
          },
          {
            label: "Total Evaluated",
            value: hasData ? String(results.length) : "0",
            sub: `of ${EVAL_DATASET.length} prompts`,
            up: true, color: "text-white",
          },
        ].map(kpi => (
          <div key={kpi.label} className="metric-card">
            <div className="text-[10px] text-[#475569] mb-1">{kpi.label}</div>
            <div className={`text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</div>
            <div className="text-[10px] text-[#334155] mt-1">{kpi.sub}</div>
          </div>
        ))}
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-12 gap-4">

        {/* Success Rate Over Time — real cumulative */}
        <div className="col-span-5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-[#64748b]">Success Rate Over Time</span>
            {hasData && <span className="text-[10px] text-emerald-400 font-semibold">● Live</span>}
          </div>
          <div className="h-36">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={successOverTime}>
                  <defs>
                    <linearGradient id="sg" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="label" tick={{ fontSize: 8, fill: "#475569" }} />
                  <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: "#475569" }} />
                  <Tooltip {...TT} />
                  <Area type="monotone" dataKey="rate" stroke="#8b5cf6" fill="url(#sg)" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 2 }} />
                </AreaChart>
              </ResponsiveContainer>
            ) : <NoData label="success rate trend" />}
          </div>
        </div>

        {/* Failure Types — real breakdown */}
        <div className="col-span-4 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748b] block mb-3">Failure Types</span>
          <div className="h-36 flex items-center gap-4">
            {failureTypes.length > 0 ? (
              <>
                <ResponsiveContainer width={110} height={110}>
                  <PieChart>
                    <Pie data={failureTypes} cx="50%" cy="50%" innerRadius={30} outerRadius={50} dataKey="value" paddingAngle={2}>
                      {failureTypes.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-1.5 flex-1">
                  {failureTypes.map(f => (
                    <div key={f.name} className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: f.color }} />
                      <span className="text-[10px] text-[#64748b] flex-1 truncate">{f.name}</span>
                      <span className="text-[10px] text-[#475569]">{f.value}%</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="w-full"><NoData label="failure breakdown" /></div>
            )}
          </div>
        </div>

        {/* Latency Distribution — real buckets */}
        <div className="col-span-3 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748b] block mb-3">Latency Distribution</span>
          <div className="h-36">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyDist}>
                  <XAxis dataKey="range" tick={{ fontSize: 8, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 8, fill: "#475569" }} />
                  <Tooltip {...TT} />
                  <Bar dataKey="count" fill="#6366f1" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData label="latency buckets" />}
          </div>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-12 gap-4">

        {/* Complexity vs Consistency Score — real scatter */}
        <div className="col-span-4 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748b] block mb-3">Complexity vs Consistency Score</span>
          <div className="h-36">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
                  <XAxis dataKey="complexity" name="Complexity" type="number" domain={[0, 10]} tick={{ fontSize: 8, fill: "#475569" }} label={{ value: "Complexity", position: "insideBottom", offset: -2, fontSize: 8, fill: "#475569" }} />
                  <YAxis dataKey="score" name="Score" domain={[0, 100]} tick={{ fontSize: 8, fill: "#475569" }} />
                  <Tooltip {...TT} cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
                    if (!payload?.length) return null;
                    const d = payload[0].payload;
                    return <div style={TT.contentStyle} className="px-2 py-1 text-[10px]">{d.label}<br />Complexity: {d.complexity} · Score: {d.score}</div>;
                  }} />
                  <Scatter data={complexityScatter} fill="#8b5cf6" opacity={0.8} />
                </ScatterChart>
              </ResponsiveContainer>
            ) : <NoData label="complexity scatter" />}
          </div>
        </div>

        {/* Per-prompt latency bar — real */}
        <div className="col-span-4 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748b] block mb-3">Latency by Prompt (seconds)</span>
          <div className="h-36">
            {hasData ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={latencyByPrompt}>
                  <XAxis dataKey="name" tick={{ fontSize: 7, fill: "#475569" }} />
                  <YAxis tick={{ fontSize: 8, fill: "#475569" }} />
                  <Tooltip {...TT} />
                  <Bar dataKey="time" fill="#06b6d4" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <NoData label="per-prompt latency" />}
          </div>
        </div>

        {/* Top Performing Pipelines — real */}
        <div className="col-span-4 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <span className="text-xs font-semibold text-[#64748b] block mb-3">Top Performing Pipelines</span>
          {topPipelines.length > 0 ? (
            <div className="space-y-2">
              {topPipelines.map((p, i) => (
                <div key={p.name} className="flex items-center gap-2">
                  <span className="text-[10px] text-[#334155] w-4 shrink-0">{i + 1}</span>
                  <span className="text-[10px] text-[#64748b] flex-1 truncate">{p.name}</span>
                  <span className="text-[10px] text-emerald-400 font-semibold">{p.rate}%</span>
                  <span className="text-[10px] text-[#334155]">{p.time}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-28"><NoData label="top pipelines" /></div>
          )}
        </div>
      </div>

      {/* Results table — always shown, fills in as benchmark runs */}
      <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.08)]">
          <span className="text-xs font-semibold text-white">Benchmark Results</span>
          <span className="text-[10px] text-[#475569]">
            {hasData ? `${results.filter(r => r.success).length} passed · ${results.filter(r => !r.success).length} failed` : "Not run yet"}
          </span>
        </div>
        <div className="grid grid-cols-12 gap-2 px-4 py-2 border-b border-[rgba(139,92,246,0.06)] text-[10px] font-semibold text-[#475569]">
          <div className="col-span-1">#</div>
          <div className="col-span-3">Prompt</div>
          <div className="col-span-1">Type</div>
          <div className="col-span-1">Status</div>
          <div className="col-span-2">Time</div>
          <div className="col-span-2">Consistency</div>
          <div className="col-span-2">Executability</div>
        </div>
        {EVAL_DATASET.map((prompt, i) => {
          const r = results.find(res => res.id === prompt.id);
          const isCurrent = running && currentIndex === i;
          return (
            <div key={prompt.id}
              className={`grid grid-cols-12 gap-2 px-4 py-2.5 border-b border-[rgba(139,92,246,0.04)] items-center text-[10px] transition-colors ${isCurrent ? "bg-violet-950/20" : "hover:bg-[rgba(139,92,246,0.03)]"}`}>
              <div className="col-span-1 text-[#334155]">{i + 1}</div>
              <div className="col-span-3 text-[#94a3b8] font-medium">{prompt.label}</div>
              <div className="col-span-1">
                <span className={`px-1.5 py-0.5 rounded text-[9px] ${prompt.category === "real" ? "bg-blue-500/10 text-blue-400" : "bg-amber-500/10 text-amber-400"}`}>
                  {prompt.category}
                </span>
              </div>
              <div className="col-span-1">
                {isCurrent
                  ? <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
                  : r
                    ? r.success
                      ? <CheckCircle className="w-3 h-3 text-emerald-400" />
                      : <XCircle className="w-3 h-3 text-red-400" />
                    : <div className="w-3 h-3 rounded-full border border-[#1e293b]" />}
              </div>
              <div className="col-span-2 text-[#475569] flex items-center gap-1">
                {r && <><Clock className="w-2.5 h-2.5" />{(r.totalTimeMs / 1000).toFixed(1)}s</>}
              </div>
              <div className="col-span-2">
                {r?.success ? (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
                      <div className="h-full bg-violet-500 rounded-full" style={{ width: `${r.consistencyScore}%` }} />
                    </div>
                    <span className="text-[#64748b] w-5 text-right">{r.consistencyScore}</span>
                  </div>
                ) : r && !r.success ? (
                  <span className="text-red-400 text-[9px]">{r.failureType || "failed"}</span>
                ) : null}
              </div>
              <div className="col-span-2">
                {r?.success && (
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
                      <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${r.executabilityScore}%` }} />
                    </div>
                    <span className="text-[#64748b] w-5 text-right">{r.executabilityScore}</span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Real vs Edge summary — only after run */}
      {metrics && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Real Product Prompts (10)</div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold font-display text-emerald-400">{metrics.realPromptSuccessRate.toFixed(1)}%</div>
              <div className="flex-1 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${metrics.realPromptSuccessRate}%` }} />
              </div>
            </div>
          </div>
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Edge Case Prompts (10)</div>
            <div className="flex items-center gap-4">
              <div className="text-3xl font-bold font-display text-amber-400">{metrics.edgeCaseSuccessRate.toFixed(1)}%</div>
              <div className="flex-1 h-2 bg-[#0a0a0f] rounded-full overflow-hidden">
                <div className="h-full bg-amber-500 rounded-full" style={{ width: `${metrics.edgeCaseSuccessRate}%` }} />
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
