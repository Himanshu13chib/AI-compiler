"use client";

import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

export interface LogEntry {
  id: string;
  stage: number;
  message: string;
  timestamp: number;
}

interface LiveLogProps {
  logs: LogEntry[];
  maxHeight?: string;
}

const STAGE_COLORS = [
  "text-indigo-400",
  "text-violet-400",
  "text-cyan-400",
  "text-amber-400",
  "text-emerald-400",
];

export function LiveLog({ logs, maxHeight = "200px" }: LiveLogProps) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [logs]);

  return (
    <div
      className="bg-black/60 rounded-xl border border-zinc-800 font-mono text-xs overflow-y-auto"
      style={{ maxHeight }}
    >
      <div className="sticky top-0 bg-zinc-900/90 border-b border-zinc-800 px-3 py-1.5 flex items-center gap-2">
        <div className="flex gap-1">
          <div className="w-2.5 h-2.5 rounded-full bg-red-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
        </div>
        <span className="text-zinc-500 text-[10px]">pipeline.log</span>
        <div className="ml-auto flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-zinc-600 text-[10px]">LIVE</span>
        </div>
      </div>
      
      <div className="p-3 space-y-0.5">
        <AnimatePresence initial={false}>
          {logs.map((log) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.2 }}
              className="flex gap-2 items-start"
            >
              <span className="text-zinc-600 shrink-0">
                {new Date(log.timestamp).toLocaleTimeString("en", { hour12: false, hour: "2-digit", minute: "2-digit", second: "2-digit" })}
              </span>
              <span className={`shrink-0 ${STAGE_COLORS[log.stage - 1] || "text-zinc-400"}`}>
                [S{log.stage}]
              </span>
              <span className="text-zinc-300 break-all">{log.message}</span>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
