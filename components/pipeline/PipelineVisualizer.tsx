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
      className="bg-zinc-900/90 backdrop-blur border border-zinc-800 rounded-xl p-8 space-y-8 w-full max-w-full"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse" />
          <h3 className="text-base font-semibold text-zinc-100">Pipeline Execution</h3>
        </div>
        <div className="flex items-center gap-6 text-sm text-zinc-400">
          <div className="flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-400" />
            <span>{completedCount}/5 stages</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-zinc-400" />
            <span className="font-mono">{(totalElapsed / 1000).toFixed(2)}s elapsed</span>
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full"
          animate={{ width: `${(completedCount / 5) * 100}%` }}
          transition={{ duration: 0.5 }}
        />
      </div>

      {/* Stage nodes */}
      <div className="flex items-center justify-center w-full py-4">
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
          className="flex items-center gap-3 text-sm text-indigo-400 bg-indigo-950/50 border border-indigo-900 rounded-lg px-4 py-3"
        >
          <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
          <span>Stage {activeStage}: {STAGE_NAMES[activeStage - 1]} is running...</span>
        </motion.div>
      )}

      {/* Live log */}
      <LiveLog logs={logs} maxHeight="200px" />
    </motion.div>
  );
}
