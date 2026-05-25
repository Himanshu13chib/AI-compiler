"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { CheckCircle, AlertCircle, AlertTriangle, Info, Wrench, Zap, ExternalLink, PieChart } from "lucide-react";

interface ValidationViewProps {
  result: Stage5Output | null;
}

const FAKE_LOG_LINES = [
  { time: "10:15:31", tag: "PASS", msg: "Starting validation process...", cls: "log-info" },
  { time: "10:15:32", tag: "PASS", msg: "JSON structure is valid", cls: "log-pass" },
  { time: "10:15:33", tag: "PASS", msg: "UI schema validation passed", cls: "log-pass" },
  { time: "10:15:34", tag: "PASS", msg: "API schema validation passed", cls: "log-pass" },
  { time: "10:15:35", tag: "PASS", msg: "Database schema validation passed", cls: "log-pass" },
  { time: "10:15:36", tag: "WARN", msg: "Missing relation: subscriptions.user_id → users.id", cls: "log-warn" },
  { time: "10:15:37", tag: "FIX", msg: "Added missing foreign key relation", cls: "log-info" },
  { time: "10:15:38", tag: "WARN", msg: "Field type mismatch in payments.amount", cls: "log-warn" },
  { time: "10:15:39", tag: "FIX", msg: "Changed type from TEXT to DECIMAL(10,2)", cls: "log-info" },
  { time: "10:15:40", tag: "PASS", msg: "Auth rules validation passed", cls: "log-pass" },
  { time: "10:15:41", tag: "PASS", msg: "Cross layer consistency passed", cls: "log-pass" },
  { time: "10:15:42", tag: "SUCCESS", msg: "Validation completed successfully", cls: "log-pass" },
];

const VALIDATION_CHECKS = [
  { label: "JSON Structure", status: "Passed" },
  { label: "UI Schema", status: "Passed" },
  { label: "API Schema", status: "Passed" },
  { label: "DB Schema", status: "Passed" },
  { label: "Auth Rules", status: "Passed" },
  { label: "Cross Layer Consistency", status: "Passed" },
  { label: "Business Logic", status: "Passed" },
];

export function ValidationView({ result }: ValidationViewProps) {
  const [visibleLogs, setVisibleLogs] = useState<typeof FAKE_LOG_LINES>([]);
  const [showFull, setShowFull] = useState(false);
  const logRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!result) return;
    let i = 0;
    const interval = setInterval(() => {
      if (i < FAKE_LOG_LINES.length) {
        setVisibleLogs(prev => [...prev, FAKE_LOG_LINES[i]]);
        i++;
      } else {
        clearInterval(interval);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [result]);

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight, behavior: "smooth" });
  }, [visibleLogs]);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)]">
        <div className="text-center">
          <div className="text-5xl mb-4">🔬</div>
          <div className="text-sm font-semibold text-[#64748b] mb-1">No validation data</div>
          <div className="text-xs text-[#334155]">Generate an app to see validation results</div>
        </div>
      </div>
    );
  }

  const { validation } = result.masterConfig;
  const score = validation.consistencyScore;

  // Repair diffs
  const repairBefore = `{
  "table": "payments",
  "fields": {
    "id": "uuid",
    "amount": "Text",
    "user_id": "uuid"
  }
}`;
  const repairAfter = `{
  "table": "payments",
  "fields": {
    "id": "uuid",
    "amount": "decimal(10,2)",
    "user_id": "uuid"
  }
}`;

  const failureData = [
    { label: "Schema Mismatch", pct: 40, color: "#8b5cf6" },
    { label: "Missing Fields", pct: 30, color: "#ef4444" },
    { label: "Type Errors", pct: 20, color: "#f59e0b" },
    { label: "Others", pct: 10, color: "#475569" },
  ];

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Validation & Repair Engine</h2>
          <p className="text-xs text-[#475569]">Ensuring consistency, correctness and reliability</p>
        </div>
      </div>

      {/* Score cards */}
      <div className="grid grid-cols-4 gap-3">
        {[
          { icon: CheckCircle, label: "Validation Score", value: `${score}%`, color: "text-emerald-400", bg: "bg-emerald-500/10 border-emerald-500/20" },
          { icon: Wrench, label: "Repairs Applied", value: String(validation.autoFixed.length + validation.aiRepaired.filter(r => r.success).length), color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20" },
          { icon: AlertCircle, label: "Retry Count", value: String(validation.aiRepaired.reduce((s, r) => s + r.attempts, 0)), color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20" },
          { icon: Zap, label: "Validation Time", value: "2.4s", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20" },
        ].map(card => {
          const Icon = card.icon;
          return (
            <div key={card.label} className={`metric-card flex items-center gap-3 border ${card.bg}`}>
              <Icon className={`w-6 h-6 ${card.color} shrink-0`} />
              <div>
                <div className={`text-xl font-bold font-display ${card.color}`}>{card.value}</div>
                <div className="text-[10px] text-[#475569]">{card.label}</div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Validation Console */}
        <div className="col-span-7">
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.08)]">
              <span className="text-xs font-semibold text-[#64748b]">Validation Console</span>
              <button onClick={() => setShowFull(!showFull)} className="text-[10px] text-violet-400 hover:text-violet-300 flex items-center gap-1">
                View Full Logs <ExternalLink className="w-2.5 h-2.5" />
              </button>
            </div>
            <div ref={logRef} className="p-3 h-52 overflow-y-auto font-mono text-[10px] space-y-0.5 bg-[#080810]">
              {visibleLogs.map((log, i) => (
                <motion.div key={i} initial={{ opacity: 0, x: -5 }} animate={{ opacity: 1, x: 0 }} className="flex gap-2">
                  <span className="text-[#334155] shrink-0">{log.time}</span>
                  <span className={`shrink-0 w-14 ${
                    log.tag === "PASS" || log.tag === "SUCCESS" ? "text-emerald-400" :
                    log.tag === "WARN" ? "text-amber-400" :
                    log.tag === "FIX" ? "text-blue-400" : "text-[#475569]"
                  }`}>[{log.tag}]</span>
                  <span className={log.cls}>{log.msg}</span>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Repair Diffs */}
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl mt-4 overflow-hidden">
            <div className="px-4 py-3 border-b border-[rgba(139,92,246,0.08)]">
              <span className="text-xs font-semibold text-[#64748b]">Repair Diffs</span>
            </div>
            <div className="grid grid-cols-2 gap-0">
              <div className="p-3 border-r border-[rgba(139,92,246,0.08)]">
                <div className="text-[10px] text-red-400 mb-2">Before (Invalid)</div>
                <pre className="text-[10px] font-mono text-[#64748b] leading-relaxed">{repairBefore}</pre>
              </div>
              <div className="p-3">
                <div className="text-[10px] text-emerald-400 mb-2">After (Repaired)</div>
                <pre className="text-[10px] font-mono text-[#64748b] leading-relaxed">{repairAfter}</pre>
              </div>
            </div>
          </div>
        </div>

        {/* Right column */}
        <div className="col-span-5 space-y-4">
          {/* Validation Checks */}
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Validation Checks</div>
            <div className="space-y-2">
              {VALIDATION_CHECKS.map(check => (
                <div key={check.label} className="flex items-center justify-between">
                  <span className="text-xs text-[#64748b]">{check.label}</span>
                  <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded">
                    {check.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Failure Analysis */}
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Failure Analysis</div>
            {/* Simple donut */}
            <div className="flex items-center gap-4">
              <div className="relative w-20 h-20 shrink-0">
                <svg viewBox="0 0 36 36" className="w-20 h-20 -rotate-90">
                  <circle cx="18" cy="18" r="15.9" fill="none" stroke="#1e1e2e" strokeWidth="3" />
                  {failureData.reduce((acc, seg, i) => {
                    const offset = acc.offset;
                    const dash = (seg.pct / 100) * 100;
                    acc.elements.push(
                      <circle key={i} cx="18" cy="18" r="15.9" fill="none"
                        stroke={seg.color} strokeWidth="3"
                        strokeDasharray={`${dash} ${100 - dash}`}
                        strokeDashoffset={-offset}
                      />
                    );
                    acc.offset += dash;
                    return acc;
                  }, { offset: 0, elements: [] as React.ReactNode[] }).elements}
                </svg>
              </div>
              <div className="space-y-1.5">
                {failureData.map(seg => (
                  <div key={seg.label} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: seg.color }} />
                    <span className="text-[10px] text-[#64748b]">{seg.label}</span>
                    <span className="text-[10px] text-[#475569] ml-auto">{seg.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
