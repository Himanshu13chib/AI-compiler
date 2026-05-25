"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { AlertCircle, AlertTriangle, Info, CheckCircle, Wrench, Zap } from "lucide-react";

interface ValidationTabProps {
  result: Stage5Output;
}

const SEVERITY_CONFIG = {
  critical: { icon: AlertCircle, color: "text-red-400", bg: "bg-red-950/30 border-red-900/50", badge: "bg-red-500/20 text-red-300 border-red-500/30" },
  warning: { icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-950/30 border-amber-900/50", badge: "bg-amber-500/20 text-amber-300 border-amber-500/30" },
  suggestion: { icon: Info, color: "text-blue-400", bg: "bg-blue-950/30 border-blue-900/50", badge: "bg-blue-500/20 text-blue-300 border-blue-500/30" },
};

const LAYER_COLORS: Record<string, string> = {
  ui: "text-purple-400",
  api: "text-blue-400",
  db: "text-amber-400",
  auth: "text-emerald-400",
  cross: "text-pink-400",
};

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const circumference = 2 * Math.PI * 45;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-32">
      <svg className="w-32 h-32 -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="45" fill="none" stroke="#27272a" strokeWidth="8" />
        <motion.circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.5, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-3xl font-bold text-white">{score}</span>
        <span className="text-xs text-zinc-500">/100</span>
      </div>
    </div>
  );
}

export function ValidationTab({ result }: ValidationTabProps) {
  const { validation } = result.masterConfig;

  const allIssues = [
    ...validation.criticalIssues,
    ...validation.warnings,
    ...validation.suggestions,
  ];

  return (
    <div className="space-y-6">
      {/* Score overview */}
      <div className="flex flex-col md:flex-row items-center gap-6 bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
        <ScoreRing score={validation.consistencyScore} />
        
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            {validation.passed ? (
              <CheckCircle className="w-5 h-5 text-emerald-400" />
            ) : (
              <AlertCircle className="w-5 h-5 text-red-400" />
            )}
            <span className={`font-semibold ${validation.passed ? "text-emerald-300" : "text-red-300"}`}>
              {validation.passed ? "All critical checks passed" : "Critical issues found"}
            </span>
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Critical", count: validation.criticalIssues.length, color: "text-red-400" },
              { label: "Warnings", count: validation.warnings.length, color: "text-amber-400" },
              { label: "Suggestions", count: validation.suggestions.length, color: "text-blue-400" },
            ].map(({ label, count, color }) => (
              <div key={label} className="text-center bg-zinc-800/50 rounded-xl p-3">
                <div className={`text-2xl font-bold ${color}`}>{count}</div>
                <div className="text-xs text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </div>
        
        <div className="space-y-2 min-w-[200px]">
          <div className="flex items-center gap-2 text-xs">
            <Zap className="w-3.5 h-3.5 text-emerald-400" />
            <span className="text-zinc-400">{validation.autoFixed.length} auto-fixed</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <Wrench className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-400">{validation.aiRepaired.filter(r => r.success).length} AI-repaired</span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <AlertCircle className="w-3.5 h-3.5 text-red-400" />
            <span className="text-zinc-400">{validation.unresolvedIssues.length} unresolved</span>
          </div>
        </div>
      </div>

      {/* Auto-fixed */}
      {validation.autoFixed.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-emerald-400 mb-2 flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5" /> Auto-Fixed ({validation.autoFixed.length})
          </h3>
          <div className="space-y-1">
            {validation.autoFixed.map((fix, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-emerald-950/20 border border-emerald-900/30 rounded-lg px-3 py-2">
                <CheckCircle className="w-3 h-3 text-emerald-400 shrink-0" />
                <span className="text-zinc-300">{fix.description}</span>
                <span className={`ml-auto text-[10px] ${LAYER_COLORS[fix.layer] || "text-zinc-500"}`}>[{fix.layer}]</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Repaired */}
      {validation.aiRepaired.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-indigo-400 mb-2 flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> AI Repair Log ({validation.aiRepaired.length})
          </h3>
          <div className="space-y-1">
            {validation.aiRepaired.map((repair, i) => (
              <div key={i} className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 border ${
                repair.success
                  ? "bg-indigo-950/20 border-indigo-900/30"
                  : "bg-red-950/20 border-red-900/30"
              }`}>
                {repair.success ? (
                  <CheckCircle className="w-3 h-3 text-indigo-400 shrink-0" />
                ) : (
                  <AlertCircle className="w-3 h-3 text-red-400 shrink-0" />
                )}
                <span className="text-zinc-300 flex-1">{repair.issue}</span>
                <span className={`text-[10px] ${LAYER_COLORS[repair.layer] || "text-zinc-500"}`}>[{repair.layer}]</span>
                <span className="text-zinc-600 text-[10px]">{repair.attempts} attempt{repair.attempts !== 1 ? "s" : ""}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All issues */}
      {allIssues.length > 0 && (
        <div>
          <h3 className="text-xs font-semibold text-zinc-300 mb-2">All Issues ({allIssues.length})</h3>
          <div className="space-y-2">
            {allIssues.map((issue) => {
              const config = SEVERITY_CONFIG[issue.type];
              const Icon = config.icon;
              return (
                <motion.div
                  key={issue.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`border rounded-xl p-3 ${config.bg}`}
                >
                  <div className="flex items-start gap-2">
                    <Icon className={`w-4 h-4 ${config.color} shrink-0 mt-0.5`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] px-1.5 py-0.5 rounded border ${config.badge}`}>
                          {issue.type}
                        </span>
                        <span className={`text-[10px] ${LAYER_COLORS[issue.layer] || "text-zinc-500"}`}>
                          [{issue.layer}]
                        </span>
                      </div>
                      <p className="text-xs text-zinc-300 mt-1">{issue.description}</p>
                      {issue.suggestedFix && (
                        <p className="text-[10px] text-zinc-500 mt-1">
                          <span className="text-zinc-600">Fix: </span>{issue.suggestedFix}
                        </p>
                      )}
                      {issue.affectedItems.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {issue.affectedItems.map(item => (
                            <code key={item} className="text-[9px] px-1.5 py-0.5 bg-zinc-800 text-zinc-400 rounded">
                              {item}
                            </code>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
