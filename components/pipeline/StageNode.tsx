"use client";

import { motion } from "framer-motion";
import { CheckCircle, Loader2, AlertCircle, Circle, Wrench } from "lucide-react";

export type StageStatus = "idle" | "running" | "complete" | "error" | "repairing";

interface StageNodeProps {
  stage: number;
  name: string;
  status: StageStatus;
  timeMs?: number;
  isLast?: boolean;
}

const STATUS_CONFIG: Record<StageStatus, { color: string; glow: string; icon: React.ReactNode; label: string }> = {
  idle: {
    color: "border-zinc-700 bg-zinc-900 text-zinc-500",
    glow: "",
    icon: <Circle className="w-5 h-5" />,
    label: "Waiting",
  },
  running: {
    color: "border-indigo-500 bg-indigo-950 text-indigo-300",
    glow: "shadow-[0_0_20px_rgba(99,102,241,0.5)]",
    icon: <Loader2 className="w-5 h-5 animate-spin" />,
    label: "Running",
  },
  complete: {
    color: "border-emerald-500 bg-emerald-950 text-emerald-300",
    glow: "shadow-[0_0_20px_rgba(16,185,129,0.4)]",
    icon: <CheckCircle className="w-5 h-5" />,
    label: "Complete",
  },
  error: {
    color: "border-red-500 bg-red-950 text-red-300",
    glow: "shadow-[0_0_20px_rgba(239,68,68,0.4)]",
    icon: <AlertCircle className="w-5 h-5" />,
    label: "Error",
  },
  repairing: {
    color: "border-amber-500 bg-amber-950 text-amber-300",
    glow: "shadow-[0_0_20px_rgba(245,158,11,0.5)]",
    icon: <Wrench className="w-5 h-5 animate-bounce" />,
    label: "Repairing",
  },
};

// Removed emoji icons for professional appearance

export function StageNode({ stage, name, status, timeMs, isLast }: StageNodeProps) {
  const config = STATUS_CONFIG[status];

  return (
    <div className="flex items-center gap-0">
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: stage * 0.1 }}
        className="flex flex-col items-center"
      >
        {/* Node */}
        <motion.div
          className={`relative flex flex-col items-center justify-center w-32 h-32 rounded-xl border-2 transition-all duration-500 ${config.color} ${config.glow}`}
          animate={status === "running" ? { scale: [1, 1.03, 1] } : {}}
          transition={{ repeat: Infinity, duration: 1.5 }}
        >
          {/* Stage number badge */}
          <div className="absolute -top-3 -right-3 w-7 h-7 rounded-full bg-zinc-800 border-2 border-zinc-600 flex items-center justify-center text-xs font-bold text-zinc-300">
            {stage}
          </div>
          
          {/* Status icon */}
          <div className="mb-2">{config.icon}</div>
          
          {/* Name */}
          <div className="text-xs font-semibold text-center px-2 leading-tight mb-1">{name}</div>
          
          {/* Time */}
          {timeMs && (
            <div className="text-xs text-zinc-400 font-mono mt-1">{(timeMs / 1000).toFixed(2)}s</div>
          )}
          
          {/* Running pulse ring */}
          {status === "running" && (
            <motion.div
              className="absolute inset-0 rounded-xl border-2 border-indigo-400"
              animate={{ scale: [1, 1.15], opacity: [0.8, 0] }}
              transition={{ repeat: Infinity, duration: 1.2 }}
            />
          )}
        </motion.div>
        
        {/* Status label */}
        <div className="mt-3 text-xs font-medium text-zinc-400">{config.label}</div>
      </motion.div>

      {/* Connector line */}
      {!isLast && (
        <div className="relative flex items-center w-16 h-1 mx-2">
          <div className="w-full h-0.5 bg-zinc-700" />
          {status === "complete" && (
            <motion.div
              className="absolute left-0 h-0.5 bg-emerald-500"
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ duration: 0.5 }}
            />
          )}
          {status === "running" && (
            <motion.div
              className="absolute left-0 h-0.5 bg-indigo-500"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
              style={{ width: "50%" }}
            />
          )}
        </div>
      )}
    </div>
  );
}
