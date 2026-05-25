"use client";

import { motion } from "framer-motion";
import {
  Zap, CheckCircle, Clock, TrendingUp, TrendingDown,
  GitBranch, Building2, Play, BarChart3, ArrowRight,
  Plus, Code2, Cpu, Activity
} from "lucide-react";
import {
  AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, XAxis, YAxis
} from "recharts";

const ACTIVITY_DATA = [
  { day: "Mon", builds: 4 }, { day: "Tue", builds: 7 }, { day: "Wed", builds: 5 },
  { day: "Thu", builds: 9 }, { day: "Fri", builds: 6 }, { day: "Sat", builds: 3 },
  { day: "Sun", builds: 8 },
];

const RECENT_PROJECTS = [
  { name: "CRM Pro", type: "CRM", status: "active", endpoints: 24, tables: 11, time: "2h ago" },
  { name: "E-Shop", type: "E-commerce", status: "active", endpoints: 31, tables: 14, time: "5h ago" },
  { name: "TaskFlow", type: "SaaS", status: "draft", endpoints: 18, tables: 8, time: "1d ago" },
  { name: "HealthBook", type: "Healthcare", status: "active", endpoints: 42, tables: 19, time: "2d ago" },
];

const QUICK_ACTIONS = [
  { label: "New Project", icon: Plus, color: "bg-violet-600 hover:bg-violet-500", text: "text-white", desc: "Start from scratch" },
  { label: "Workspace", icon: Code2, color: "bg-[#13131f] hover:bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)]", text: "text-white", desc: "Open AI workspace" },
  { label: "Pipelines", icon: GitBranch, color: "bg-[#13131f] hover:bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)]", text: "text-white", desc: "View executions" },
  { label: "Evaluation", icon: BarChart3, color: "bg-[#13131f] hover:bg-[#1a1a2e] border border-[rgba(139,92,246,0.15)]", text: "text-white", desc: "Run benchmarks" },
];

interface DashboardViewProps {
  onViewChange: (v: string) => void;
  recentBuilds: { appName: string; tagline: string; prompt: string; timestamp: number }[];
}

export function DashboardView({ onViewChange, recentBuilds }: DashboardViewProps) {
  return (
    <div className="p-6 space-y-6 max-w-7xl">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Welcome back 👋</h1>
        <p className="text-sm text-[#475569]">Here's what's happening with your AI Compiler projects.</p>
      </motion.div>

      {/* KPI row */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}
        className="grid grid-cols-4 gap-4">
        {[
          { label: "Total Builds", value: "248", delta: "+22 this week", up: true, icon: Cpu, color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
          { label: "Success Rate", value: "92.4%", delta: "+3.1% vs last week", up: true, icon: CheckCircle, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { label: "Avg Build Time", value: "18.6s", delta: "-2.1s vs last week", up: true, icon: Clock, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { label: "Active Projects", value: String(Math.max(recentBuilds.length, 4)), delta: "+2 this month", up: true, icon: Activity, color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
        ].map((kpi, i) => {
          const Icon = kpi.icon;
          return (
            <motion.div key={kpi.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 + i * 0.05 }}
              className={`metric-card border ${kpi.bg} flex items-center gap-4`}>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${kpi.bg}`}>
                <Icon className={`w-5 h-5 ${kpi.color}`} />
              </div>
              <div>
                <div className={`text-2xl font-bold font-display ${kpi.color}`}>{kpi.value}</div>
                <div className="text-[10px] text-[#475569]">{kpi.label}</div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 mt-0.5">
                  <TrendingUp className="w-2.5 h-2.5" /> {kpi.delta}
                </div>
              </div>
            </motion.div>
          );
        })}
      </motion.div>

      <div className="grid grid-cols-12 gap-4">
        {/* Activity chart */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
          className="col-span-8 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-semibold text-white">Build Activity</div>
              <div className="text-[10px] text-[#475569]">Builds per day this week</div>
            </div>
            <span className="text-[10px] px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg">This Week</span>
          </div>
          <ResponsiveContainer width="100%" height={160}>
            <AreaChart data={ACTIVITY_DATA}>
              <defs>
                <linearGradient id="buildGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e1e2e" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: "#475569" }} />
              <YAxis tick={{ fontSize: 10, fill: "#475569" }} />
              <Tooltip contentStyle={{ background: "#13131f", border: "1px solid rgba(139,92,246,0.2)", borderRadius: 8, fontSize: 11 }} />
              <Area type="monotone" dataKey="builds" stroke="#8b5cf6" fill="url(#buildGrad)" strokeWidth={2} dot={{ fill: "#8b5cf6", r: 3 }} />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Quick actions */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="col-span-4 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-5">
          <div className="text-sm font-semibold text-white mb-4">Quick Actions</div>
          <div className="space-y-2">
            {QUICK_ACTIONS.map(action => {
              const Icon = action.icon;
              return (
                <button key={action.label} onClick={() => onViewChange(action.label.toLowerCase().replace(" ", ""))}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${action.color}`}>
                  <Icon className={`w-4 h-4 ${action.text} shrink-0`} />
                  <div className="text-left">
                    <div className={`text-xs font-semibold ${action.text}`}>{action.label}</div>
                    <div className="text-[10px] text-[#475569]">{action.desc}</div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-[#475569] ml-auto" />
                </button>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* Recent projects */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
        className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-[rgba(139,92,246,0.08)]">
          <div className="text-sm font-semibold text-white">Recent Projects</div>
          <button onClick={() => onViewChange("projects")} className="text-xs text-violet-400 hover:text-violet-300 flex items-center gap-1 transition-colors">
            View all <ArrowRight className="w-3 h-3" />
          </button>
        </div>
        <div className="divide-y divide-[rgba(139,92,246,0.06)]">
          {(recentBuilds.length > 0
            ? recentBuilds.slice(0, 4).map(b => ({ name: b.appName, type: "App", status: "active", endpoints: 0, tables: 0, time: new Date(b.timestamp).toLocaleDateString() }))
            : RECENT_PROJECTS
          ).map((proj, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-3 hover:bg-[rgba(139,92,246,0.03)] transition-colors cursor-pointer"
              onClick={() => onViewChange("workspace")}>
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center text-xs font-bold text-white shrink-0">
                {proj.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-white">{proj.name}</div>
                <div className="text-[10px] text-[#475569]">{proj.type}</div>
              </div>
              <span className={`text-[10px] px-2 py-0.5 rounded-full border ${proj.status === "active" ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-[#1e1e2e] text-[#475569] border-[#1e293b]"}`}>
                {proj.status}
              </span>
              {proj.endpoints > 0 && (
                <>
                  <span className="text-[10px] text-[#334155]">{proj.endpoints} endpoints</span>
                  <span className="text-[10px] text-[#334155]">{proj.tables} tables</span>
                </>
              )}
              <span className="text-[10px] text-[#334155]">{proj.time}</span>
              <ArrowRight className="w-3.5 h-3.5 text-[#334155]" />
            </div>
          ))}
        </div>
      </motion.div>

      {/* Pipeline status */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="grid grid-cols-3 gap-4">
        {[
          { label: "Pipeline Health", value: "98.6%", icon: Zap, color: "text-emerald-400", sub: "All systems operational" },
          { label: "Avg Consistency Score", value: "94/100", icon: CheckCircle, color: "text-violet-400", sub: "Across all builds" },
          { label: "Total API Endpoints", value: "1,240+", icon: GitBranch, color: "text-blue-400", sub: "Generated this month" },
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4 flex items-center gap-4">
              <Icon className={`w-8 h-8 ${stat.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold font-display ${stat.color}`}>{stat.value}</div>
                <div className="text-xs font-medium text-white">{stat.label}</div>
                <div className="text-[10px] text-[#475569]">{stat.sub}</div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
