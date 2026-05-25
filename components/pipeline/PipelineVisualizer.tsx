"use client";

import { motion } from "framer-motion";
import { StageNode, type StageStatus } from "./StageNode";
import { LiveLog, type LogEntry } from "./LiveLog";
import { Clock, Zap } from "lucide-react";

interface PipelineVisualizerProps {
  stageStatuses: StageStatus[];
  stageTimings: Record<number, number>;
  logs: LogEntry[];
  totalElapsed: number;
}

const STAGE_NAMES = [
  "Intent Extractor",
  "System Architect",
  "Schema Generator",
  "Validation + Repair",
  "Assembler + Sim",
];

export function PipelineVisualizer({
  stageStatuses,
  stageTimings,
  logs,
  totalElapsed,
}: PipelineVisualizerProps) {
  const activeStage = stageStatuses.findIndex(s => s === "running") + 1;
  const completedCount = stageStatuses.filter(s => s === "complete").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-zinc-900/80 backdrop-blur border border-zinc-800 rounded-2xl p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-sm font-semibold text-zinc-200">Pipeline Execution</h3>
        </div>
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-indigo-400" />
            <span>{completedCount}/5 stages</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3 h-3 text-zinc-400" />
            <span>{(totalElapsed / 1000).toFixed(1)}s elapsed</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
          animate={{ width: `${(completedCount / 5) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stage nodes */}
      <div className="flex items-center justify-center overflow-x-auto pb-2">
        <div className="flex items-center">
          {STAGE_NAMES.map((name, i) => (
            <StageNode
              key={i}
              stage={i + 1}
              name={name}
              status={stageStatuses[i] || "idle"}
              timeMs={stageTimings[i + 1]}
              isLast={i === STAGE_NAMES.length - 1}
            />
          ))}
        </div>
      </div>

      {/* Active stage info */}
      {activeStage > 0 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex items-center gap-2 text-xs text-indigo-400 bg-indigo-950/50 border border-indigo-900 rounded-lg px-3 py-2"
        >
          <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
          <span>Stage {activeStage}: {STAGE_NAMES[activeStage - 1]} is running...</span>
        </motion.div>
      )}

      {/* Live log */}
      <LiveLog logs={logs} maxHeight="180px" />
    </motion.div>
  );
}
