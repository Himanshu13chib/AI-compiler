"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import {
  Plus, Search, Filter, Grid3X3, List, ArrowRight,
  Clock, Database, Globe, Shield, Trash2, ExternalLink,
  GitBranch, CheckCircle, AlertCircle, MoreHorizontal
} from "lucide-react";

interface ProjectsViewProps {
  recentBuilds: { appName: string; tagline: string; prompt: string; result: Stage5Output; timestamp: number }[];
  onViewChange: (v: string) => void;
  onLoadBuild: (build: { prompt: string; result: Stage5Output }) => void;
}

const DEMO_PROJECTS = [
  { appName: "CRM Pro", tagline: "Customer relationship management for sales teams", type: "CRM", status: "active", endpoints: 24, tables: 11, pages: 8, score: 96, timestamp: Date.now() - 7200000 },
  { appName: "E-Shop Platform", tagline: "Full-featured e-commerce with Stripe payments", type: "E-commerce", status: "active", endpoints: 31, tables: 14, pages: 12, score: 92, timestamp: Date.now() - 18000000 },
  { appName: "TaskFlow", tagline: "Project management tool like Linear", type: "SaaS", status: "draft", endpoints: 18, tables: 8, pages: 6, score: 88, timestamp: Date.now() - 86400000 },
  { appName: "HealthBook", tagline: "Healthcare appointment booking system", type: "Healthcare", status: "active", endpoints: 42, tables: 19, pages: 14, score: 94, timestamp: Date.now() - 172800000 },
  { appName: "LearnHub", tagline: "Social learning platform with courses", type: "EdTech", status: "active", endpoints: 28, tables: 13, pages: 10, score: 91, timestamp: Date.now() - 259200000 },
  { appName: "HRSuite", tagline: "HR management with payroll and leave tracking", type: "HRTech", status: "draft", endpoints: 35, tables: 16, pages: 11, score: 89, timestamp: Date.now() - 345600000 },
];

const TYPE_COLORS: Record<string, string> = {
  CRM: "bg-violet-500/15 text-violet-400 border-violet-500/25",
  "E-commerce": "bg-blue-500/15 text-blue-400 border-blue-500/25",
  SaaS: "bg-cyan-500/15 text-cyan-400 border-cyan-500/25",
  Healthcare: "bg-emerald-500/15 text-emerald-400 border-emerald-500/25",
  EdTech: "bg-amber-500/15 text-amber-400 border-amber-500/25",
  HRTech: "bg-pink-500/15 text-pink-400 border-pink-500/25",
  App: "bg-indigo-500/15 text-indigo-400 border-indigo-500/25",
};

export function ProjectsView({ recentBuilds, onViewChange, onLoadBuild }: ProjectsViewProps) {
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("all");

  // Merge real builds with demo projects
  const allProjects = [
    ...recentBuilds.map(b => ({
      appName: b.appName,
      tagline: b.tagline,
      type: b.result.masterConfig.intent.appType,
      status: "active" as const,
      endpoints: b.result.masterConfig.schemas.apiSchema.endpoints.length,
      tables: b.result.masterConfig.schemas.dbSchema.tables.length,
      pages: b.result.masterConfig.schemas.uiSchema.pages.length,
      score: b.result.masterConfig.validation.consistencyScore,
      timestamp: b.timestamp,
      realBuild: b,
    })),
    ...DEMO_PROJECTS.map(p => ({ ...p, realBuild: null })),
  ];

  const filtered = allProjects.filter(p => {
    const matchSearch = !search || p.appName.toLowerCase().includes(search.toLowerCase()) || p.tagline.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === "all" || p.status === filter;
    return matchSearch && matchFilter;
  });

  function timeAgo(ts: number) {
    const diff = Date.now() - ts;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  }

  return (
    <div className="p-6 space-y-5 max-w-7xl">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Projects</h1>
          <p className="text-sm text-[#475569]">{allProjects.length} projects · {allProjects.filter(p => p.status === "active").length} active</p>
        </div>
        <button onClick={() => onViewChange("workspace")}
          className="flex items-center gap-2 px-4 py-2.5 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-xl transition-all shadow-[0_0_20px_rgba(139,92,246,0.25)]">
          <Plus className="w-4 h-4" /> New Project
        </button>
      </motion.div>

      {/* Filters bar */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="flex items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#475569]" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search projects..."
            className="w-full bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-lg pl-9 pr-4 py-2 text-sm text-[#94a3b8] placeholder-[#334155] focus:outline-none focus:border-violet-500 transition-colors" />
        </div>
        <div className="flex items-center gap-1 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-lg p-1">
          {["all", "active", "draft"].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-all ${filter === f ? "bg-violet-600 text-white" : "text-[#475569] hover:text-white"}`}>
              {f}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-lg p-1 ml-auto">
          <button onClick={() => setViewMode("grid")} className={`p-1.5 rounded-md transition-all ${viewMode === "grid" ? "bg-[#0a0a0f] text-white" : "text-[#475569] hover:text-white"}`}>
            <Grid3X3 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewMode("list")} className={`p-1.5 rounded-md transition-all ${viewMode === "list" ? "bg-[#0a0a0f] text-white" : "text-[#475569] hover:text-white"}`}>
            <List className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>

      {/* Grid view */}
      {viewMode === "grid" ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4">
          {/* New project card */}
          <button onClick={() => onViewChange("workspace")}
            className="bg-[#13131f] border border-dashed border-[rgba(139,92,246,0.2)] rounded-xl p-6 flex flex-col items-center justify-center gap-3 hover:border-violet-500/40 hover:bg-[rgba(139,92,246,0.03)] transition-all group min-h-[200px]">
            <div className="w-12 h-12 rounded-xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center group-hover:bg-violet-600/20 transition-all">
              <Plus className="w-6 h-6 text-violet-400" />
            </div>
            <div className="text-sm font-semibold text-[#64748b] group-hover:text-white transition-colors">New Project</div>
            <div className="text-[10px] text-[#334155]">Start building with AI</div>
          </button>

          {filtered.map((proj, i) => (
            <motion.div key={proj.appName + i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.04 }}
              className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-5 hover:border-violet-500/30 transition-all cursor-pointer group"
              onClick={() => proj.realBuild ? onLoadBuild(proj.realBuild) : onViewChange("workspace")}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-sm font-bold text-white shrink-0">
                  {proj.appName.charAt(0)}
                </div>
                <div className="flex items-center gap-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full border ${proj.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-[#1e1e2e] text-[#475569] border-[#1e293b]"}`}>
                    {proj.status}
                  </span>
                  <button className="opacity-0 group-hover:opacity-100 transition-opacity text-[#475569] hover:text-white p-1">
                    <MoreHorizontal className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mb-3">
                <div className="text-sm font-semibold text-white mb-1">{proj.appName}</div>
                <div className="text-[10px] text-[#475569] line-clamp-2">{proj.tagline}</div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded border ${TYPE_COLORS[proj.type] || TYPE_COLORS["App"]}`}>
                {proj.type}
              </span>

              <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[rgba(139,92,246,0.08)]">
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{proj.endpoints}</div>
                  <div className="text-[9px] text-[#334155]">APIs</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{proj.tables}</div>
                  <div className="text-[9px] text-[#334155]">Tables</div>
                </div>
                <div className="text-center">
                  <div className="text-sm font-bold text-white">{proj.pages}</div>
                  <div className="text-[9px] text-[#334155]">Pages</div>
                </div>
              </div>

              <div className="flex items-center justify-between mt-3">
                <div className="flex items-center gap-1 text-[10px] text-[#334155]">
                  <Clock className="w-3 h-3" /> {timeAgo(proj.timestamp)}
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <div className={`w-1.5 h-1.5 rounded-full ${proj.score >= 90 ? "bg-emerald-400" : proj.score >= 75 ? "bg-amber-400" : "bg-red-400"}`} />
                  <span className="text-[#64748b]">{proj.score}/100</span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      ) : (
        /* List view */
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[rgba(139,92,246,0.08)] text-[10px] font-semibold text-[#475569]">
            <div className="col-span-4">Project</div>
            <div className="col-span-2">Type</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-1">APIs</div>
            <div className="col-span-1">Tables</div>
            <div className="col-span-1">Score</div>
            <div className="col-span-2">Last Modified</div>
          </div>
          {filtered.map((proj, i) => (
            <div key={proj.appName + i}
              className="grid grid-cols-12 gap-2 px-5 py-3 border-b border-[rgba(139,92,246,0.05)] hover:bg-[rgba(139,92,246,0.03)] transition-colors cursor-pointer items-center"
              onClick={() => proj.realBuild ? onLoadBuild(proj.realBuild) : onViewChange("workspace")}>
              <div className="col-span-4 flex items-center gap-3">
                <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                  {proj.appName.charAt(0)}
                </div>
                <div>
                  <div className="text-xs font-medium text-white">{proj.appName}</div>
                  <div className="text-[10px] text-[#334155] truncate max-w-[180px]">{proj.tagline}</div>
                </div>
              </div>
              <div className="col-span-2">
                <span className={`text-[10px] px-2 py-0.5 rounded border ${TYPE_COLORS[proj.type] || TYPE_COLORS["App"]}`}>{proj.type}</span>
              </div>
              <div className="col-span-1">
                <span className={`text-[10px] px-2 py-0.5 rounded-full border ${proj.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-[#1e1e2e] text-[#475569] border-[#1e293b]"}`}>
                  {proj.status}
                </span>
              </div>
              <div className="col-span-1 text-xs text-[#64748b]">{proj.endpoints}</div>
              <div className="col-span-1 text-xs text-[#64748b]">{proj.tables}</div>
              <div className="col-span-1">
                <div className="flex items-center gap-1.5">
                  <div className="flex-1 h-1 bg-[#0a0a0f] rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${proj.score >= 90 ? "bg-emerald-500" : proj.score >= 75 ? "bg-amber-500" : "bg-red-500"}`} style={{ width: `${proj.score}%` }} />
                  </div>
                  <span className="text-[10px] text-[#64748b]">{proj.score}</span>
                </div>
              </div>
              <div className="col-span-2 text-[10px] text-[#334155]">{timeAgo(proj.timestamp)}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  );
}
