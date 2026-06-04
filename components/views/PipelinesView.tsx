"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import type { StageStatus } from "@/components/pipeline/StageNode";
import type { LogEntry } from "@/components/pipeline/LiveLog";
import {
  CheckCircle, Loader2, Clock, Hash, ExternalLink,
  LayoutGrid, Minus, Plus, Maximize2, AlignLeft, FileJson,
  Database, Shield, Code2, Rocket, ChevronRight, X, Search,
  Layout, Settings, Wrench, Package
} from "lucide-react";

interface PipelinesViewProps {
  result: Stage5Output | null;
  isCompiling: boolean;
  stageStatuses: StageStatus[];
  stageTimings: Record<number, number>;
  logs: LogEntry[];
  totalElapsed: number;
}

const PIPELINE_NODES = [
  {
    id: "intent", label: "Intent Extraction", icon: "search", color: "#8b5cf6",
    desc: "Extracting features, entities, and requirements...",
    row: 0, col: 1,
  },
  {
    id: "architect", label: "Architecture Planning", icon: "layout", color: "#6366f1",
    desc: "Designing system architecture and components...",
    row: 0, col: 2,
  },
  {
    id: "schema", label: "Schema Generation", icon: "settings", color: "#06b6d4",
    desc: "Generating UI, API, DB schemas and auth rules...",
    row: 0, col: 3,
  },
  {
    id: "validator", label: "Consistency Validator", icon: "check-circle", color: "#10b981",
    desc: "Validating cross-layer consistency and schema integrity...",
    row: 1, col: 1,
  },
  {
    id: "repair", label: "Repair Engine", icon: "wrench", color: "#f59e0b",
    desc: "Detecting issues and repairing inconsistencies automatically...",
    row: 1, col: 2,
  },
  {
    id: "runtime", label: "Runtime Executor", icon: "rocket", color: "#ef4444",
    desc: "Building runtime and generating executable application...",
    row: 1, col: 3,
  },
  {
    id: "output", label: "Executable App", icon: "package", color: "#10b981",
    desc: "Application is ready to run and deploy.",
    row: 1, col: 4,
    isOutput: true,
  },
];

const NODE_STAGE_MAP: Record<string, number> = {
  intent: 1, architect: 2, schema: 3, validator: 4, repair: 4, runtime: 5, output: 5,
};

const ICON_MAP: Record<string, any> = {
  search: Search,
  layout: Layout,
  settings: Settings,
  "check-circle": CheckCircle,
  wrench: Wrench,
  rocket: Rocket,
  package: Package,
};

function getNodeStatus(nodeId: string, stageStatuses: StageStatus[], result: Stage5Output | null): StageStatus {
  if (result) return "complete";
  const stageIdx = NODE_STAGE_MAP[nodeId];
  if (!stageIdx) return "idle";
  return stageStatuses[stageIdx - 1] || "idle";
}

export function PipelinesView({ result, isCompiling, stageStatuses, stageTimings, logs, totalElapsed }: PipelinesViewProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(result ? "schema" : null);
  const [zoom, setZoom] = useState(100);

  const totalTime = result
    ? (Object.values(result.metadata?.stageTimings || {}).reduce((a: number, b) => a + (b as number), 0) / 1000).toFixed(1)
    : (totalElapsed / 1000).toFixed(1);

  const runId = result ? `run_${result.masterConfig.intent.appName.replace(/\s+/g, "").toLowerCase().slice(0, 8)}` : "run_pending";

  const selectedNodeData = PIPELINE_NODES.find(n => n.id === selectedNode);
  const selectedStage = selectedNode ? NODE_STAGE_MAP[selectedNode] : null;
  const selectedTiming = selectedStage ? stageTimings[selectedStage] : null;

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden">
      {/* ── MAIN CANVAS ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Canvas toolbar */}
        <div className="flex items-center gap-3 px-5 py-3 border-b border-[rgba(139,92,246,0.08)]">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-violet-500" />
            <span className="text-sm font-semibold text-white">Pipeline Execution</span>
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-[#475569]">
            <Hash className="w-3 h-3" />
            <span className="font-mono">{runId}</span>
          </div>
          {(isCompiling || result) && (
            <span className="badge-live text-[10px]">
              {isCompiling ? "● Live" : "● Completed"}
            </span>
          )}

          <div className="ml-auto flex items-center gap-2">
            <button className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
              <AlignLeft className="w-3 h-3" /> Auto Layout
            </button>
            <div className="flex items-center gap-1 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-lg px-2 py-1">
              <button onClick={() => setZoom(z => Math.max(50, z - 10))} className="text-[#475569] hover:text-white p-0.5"><Minus className="w-3 h-3" /></button>
              <span className="text-xs text-[#64748b] w-10 text-center">{zoom}%</span>
              <button onClick={() => setZoom(z => Math.min(150, z + 10))} className="text-[#475569] hover:text-white p-0.5"><Plus className="w-3 h-3" /></button>
            </div>
            <button className="p-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#475569] rounded-lg hover:text-white transition-colors">
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div className="flex-1 overflow-auto p-8 relative" style={{ background: "radial-gradient(circle at 50% 50%, rgba(139,92,246,0.03) 0%, transparent 70%)" }}>
          {/* Grid dots */}
          <div className="absolute inset-0 opacity-20" style={{
            backgroundImage: "radial-gradient(circle, #334155 1px, transparent 1px)",
            backgroundSize: "28px 28px"
          }} />

          <div className="relative" style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top left" }}>
            {/* User Prompt node */}
            <div className="absolute" style={{ left: 0, top: 60 }}>
              <div className="bg-[#13131f] border border-[rgba(139,92,246,0.2)] rounded-xl p-3 w-36 cursor-pointer hover:border-violet-500/40 transition-all">
                <div className="flex items-center gap-1.5 mb-1.5">
                  <AlignLeft className="w-4 h-4 text-violet-400" />
                  <span className="text-xs font-semibold text-white">User Prompt</span>
                </div>
                <p className="text-[10px] text-[#475569] leading-relaxed line-clamp-3">
                  {result?.masterConfig.intent.appName || "Build a CRM with login, contacts, dashboard..."}
                </p>
                <div className="text-[9px] text-violet-400 mt-2">Input</div>
              </div>
              {/* Arrow right */}
              <div className="absolute top-1/2 -right-8 flex items-center">
                <div className="w-8 h-px bg-[rgba(139,92,246,0.3)]" />
                <ChevronRight className="w-3 h-3 text-violet-500/50 -ml-1" />
              </div>
            </div>

            {/* Row 1 nodes */}
            {[
              { id: "intent", left: 180, top: 0 },
              { id: "architect", left: 380, top: 0 },
              { id: "schema", left: 580, top: 0 },
            ].map(pos => {
              const node = PIPELINE_NODES.find(n => n.id === pos.id)!;
              const status = getNodeStatus(node.id, stageStatuses, result);
              const stageNum = NODE_STAGE_MAP[node.id];
              const timing = stageTimings[stageNum];
              const tokens = result ? [1245, 2341, 4562][["intent","architect","schema"].indexOf(node.id)] : null;
              return (
                <div key={node.id} className="absolute" style={{ left: pos.left, top: pos.top }}>
                  <PipelineNodeCard
                    node={node} status={status} timing={timing} tokens={tokens}
                    selected={selectedNode === node.id}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                  />
                  {pos.id !== "schema" && (
                    <div className="absolute top-1/2 -right-8 flex items-center -translate-y-1/2">
                      <div className={`w-8 h-px ${status === "complete" ? "bg-emerald-500/50" : "bg-[rgba(139,92,246,0.2)]"}`} />
                      <ChevronRight className={`w-3 h-3 -ml-1 ${status === "complete" ? "text-emerald-500/70" : "text-violet-500/30"}`} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Row 2 nodes */}
            {[
              { id: "validator", left: 180, top: 200 },
              { id: "repair", left: 380, top: 200 },
              { id: "runtime", left: 580, top: 200 },
              { id: "output", left: 780, top: 200 },
            ].map(pos => {
              const node = PIPELINE_NODES.find(n => n.id === pos.id)!;
              const status = getNodeStatus(node.id, stageStatuses, result);
              const stageNum = NODE_STAGE_MAP[node.id];
              const timing = stageTimings[stageNum];
              const tokens = result ? [2105, 1876, 3982, null][["validator","repair","runtime","output"].indexOf(node.id)] : null;
              return (
                <div key={node.id} className="absolute" style={{ left: pos.left, top: pos.top }}>
                  <PipelineNodeCard
                    node={node} status={status} timing={timing} tokens={tokens}
                    selected={selectedNode === node.id}
                    onClick={() => setSelectedNode(selectedNode === node.id ? null : node.id)}
                    isOutput={node.isOutput}
                  />
                  {pos.id !== "output" && (
                    <div className="absolute top-1/2 -right-8 flex items-center -translate-y-1/2">
                      <div className={`w-8 h-px ${status === "complete" ? "bg-emerald-500/50" : "bg-[rgba(139,92,246,0.2)]"}`} />
                      <ChevronRight className={`w-3 h-3 -ml-1 ${status === "complete" ? "text-emerald-500/70" : "text-violet-500/30"}`} />
                    </div>
                  )}
                </div>
              );
            })}

            {/* Vertical connector schema → validator */}
            <div className="absolute" style={{ left: 660, top: 160, width: 1, height: 40, background: "rgba(139,92,246,0.2)" }} />
            <div className="absolute" style={{ left: 260, top: 160, width: 1, height: 40, background: "rgba(139,92,246,0.2)" }} />

            {/* Output label */}
            {result && (
              <div className="absolute text-[9px] text-[#475569]" style={{ left: 780, top: 340 }}>Output</div>
            )}
          </div>

          {/* Execution Timeline */}
          {(result || isCompiling) && (
            <div className="absolute bottom-0 left-0 right-0 bg-[#0f0f1a] border-t border-[rgba(139,92,246,0.08)] p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[#64748b]">Execution Timeline</span>
                <span className="text-xs text-[#475569]">Total Time: {totalTime}s</span>
              </div>
              <div className="relative h-8">
                <div className="timeline-bar w-full h-full rounded-lg opacity-60" />
                {/* Stage markers */}
                {[0, 2.4, 5.5, 11.3, 14.5, 17.2, 23.5].map((t, i) => (
                  <div key={i} className="absolute top-0 bottom-0 flex flex-col justify-end" style={{ left: `${(t / 23.5) * 100}%` }}>
                    <div className="w-px h-3 bg-white/20" />
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-1">
                {["0s", "2.4s", "5.5s", "11.3s", "14.5s", "17.2s", "23.5s"].map(t => (
                  <span key={t} className="text-[9px] text-[#334155]">{t}</span>
                ))}
              </div>
              <div className="flex justify-between mt-0.5">
                {["", "Intent Extraction", "Architecture Planning", "Schema Generation", "Consistency Validator", "Repair Engine", "Runtime Executor"].map((l, i) => (
                  <span key={i} className="text-[8px] text-[#1e293b] text-center" style={{ width: i === 0 ? "20px" : "auto" }}>{l}</span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── RIGHT PANEL — Node Details ── */}
      {selectedNode && selectedNodeData && (
        <motion.div
          initial={{ x: 300, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: 300, opacity: 0 }}
          className="w-72 shrink-0 border-l border-[rgba(139,92,246,0.08)] flex flex-col overflow-y-auto"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.08)]">
            <div className="flex items-center gap-2">
              {(() => {
                const IconComponent = ICON_MAP[selectedNodeData.icon];
                return IconComponent ? <IconComponent className="w-4 h-4 text-violet-400" /> : null;
              })()}
              <span className="text-sm font-semibold text-white">{selectedNodeData.label}</span>
            </div>
            <div className="flex items-center gap-2">
              {result && <span className="badge-completed text-[10px]">Completed</span>}
              <button onClick={() => setSelectedNode(null)} className="text-[#475569] hover:text-white transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-4 text-xs">
            <p className="text-[#64748b] leading-relaxed">{selectedNodeData.desc}</p>

            {/* Metrics */}
            <div>
              <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-2">Metrics</div>
              <div className="space-y-2">
                {[
                  { label: "Duration", value: selectedTiming ? `${(selectedTiming / 1000).toFixed(1)}s` : "—" },
                  { label: "Tokens Used", value: result ? "4,562" : "—" },
                  { label: "Model", value: "Gemini 2.5 Flash" },
                  { label: "Temperature", value: "0.2" },
                  { label: "Attempts", value: "1" },
                ].map(m => (
                  <div key={m.label} className="flex items-center justify-between">
                    <span className="text-[#475569]">{m.label}</span>
                    <span className="text-[#94a3b8] font-mono">{m.value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Input */}
            {result && (
              <div>
                <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-2">Input</div>
                <div className="flex items-center gap-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] rounded-lg px-3 py-2">
                  <FileJson className="w-3.5 h-3.5 text-violet-400" />
                  <span className="text-[#64748b]">architecture.json</span>
                  <span className="ml-auto text-[#334155]">2.1 KB</span>
                </div>
              </div>
            )}

            {/* Output */}
            {result && (
              <div>
                <div className="text-[10px] text-[#334155] uppercase tracking-wider mb-2">Output</div>
                <div className="space-y-1.5">
                  {[
                    { icon: Code2, name: "ui_schema.json", size: "12.4 KB", color: "text-violet-400" },
                    { icon: Code2, name: "api_schema.json", size: "8.7 KB", color: "text-blue-400" },
                    { icon: Database, name: "db_schema.sql", size: "6.2 KB", color: "text-amber-400" },
                    { icon: Shield, name: "auth_rules.json", size: "3.1 KB", color: "text-emerald-400" },
                  ].map(f => {
                    const Icon = f.icon;
                    return (
                      <div key={f.name} className="flex items-center gap-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] rounded-lg px-3 py-2">
                        <Icon className={`w-3.5 h-3.5 ${f.color}`} />
                        <span className="text-[#64748b] flex-1">{f.name}</span>
                        <span className="text-[#334155]">{f.size}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Logs */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="text-[10px] text-[#334155] uppercase tracking-wider">Logs</div>
                <button className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                  View all logs <ExternalLink className="w-2.5 h-2.5" />
                </button>
              </div>
              <div className="space-y-1 max-h-40 overflow-y-auto">
                {logs.filter(l => l.stage === (selectedStage || 3)).slice(-8).map(log => (
                  <div key={log.id} className="flex gap-2 text-[10px]">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1 shrink-0" />
                    <span className="text-[#475569]">{log.message}</span>
                  </div>
                ))}
                {logs.filter(l => l.stage === (selectedStage || 3)).length === 0 && (
                  <div className="text-[10px] text-[#334155]">No logs yet</div>
                )}
              </div>
              <button className="mt-2 w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] text-[#475569] text-[10px] rounded-lg hover:text-white transition-colors">
                View Full Logs <ExternalLink className="w-3 h-3" />
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

function PipelineNodeCard({ node, status, timing, tokens, selected, onClick, isOutput }: {
  node: typeof PIPELINE_NODES[0];
  status: StageStatus;
  timing?: number;
  tokens?: number | null;
  selected: boolean;
  onClick: () => void;
  isOutput?: boolean;
}) {
  const isDone = status === "complete";
  const isRunning = status === "running";
  const IconComponent = ICON_MAP[node.icon];

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={onClick}
      className={`pipeline-node cursor-pointer transition-all w-44 ${
        isDone ? "completed" : isRunning ? "running" : ""
      } ${selected ? "ring-1 ring-violet-500/50" : ""}`}
      style={{ borderColor: selected ? node.color + "60" : undefined }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{ background: node.color + "18", border: `1px solid ${node.color}30` }}>
          {IconComponent && <IconComponent className="w-4 h-4" style={{ color: node.color }} />}
        </div>
        <span className="text-xs font-semibold text-white leading-tight">{node.label}</span>
      </div>
      <p className="text-[10px] text-[#475569] leading-relaxed mb-2">{node.desc}</p>

      {isDone && (
        <div className="flex items-center gap-1 mb-2">
          <CheckCircle className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] text-emerald-400">Completed</span>
        </div>
      )}
      {isRunning && (
        <div className="flex items-center gap-1 mb-2">
          <Loader2 className="w-3 h-3 text-violet-400 animate-spin" />
          <span className="text-[10px] text-violet-400">Running...</span>
        </div>
      )}

      <div className="flex items-center gap-3 text-[10px] text-[#334155]">
        {timing && (
          <span className="flex items-center gap-1">
            <Clock className="w-2.5 h-2.5" />
            {(timing / 1000).toFixed(1)}s
          </span>
        )}
        {tokens && (
          <span className="flex items-center gap-1">
            <Hash className="w-2.5 h-2.5" />
            {tokens.toLocaleString()}
          </span>
        )}
      </div>

      {isOutput && isDone && (
        <button className="mt-2 w-full flex items-center justify-center gap-1.5 px-2 py-1.5 bg-emerald-600/20 border border-emerald-500/30 text-emerald-400 text-[10px] rounded-lg hover:bg-emerald-600/30 transition-colors">
          Open App <ExternalLink className="w-2.5 h-2.5" />
        </button>
      )}
    </motion.div>
  );
}
