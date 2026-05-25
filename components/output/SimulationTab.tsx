"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { CheckCircle, XCircle, AlertCircle, Play, Database, Shield, Globe } from "lucide-react";
import { useState } from "react";

interface SimulationTabProps {
  result: Stage5Output;
}

function ScoreBar({ score }: { score: number }) {
  const color = score >= 80 ? "bg-emerald-500" : score >= 60 ? "bg-amber-500" : "bg-red-500";
  return (
    <div className="flex items-center gap-3">
      <div className="flex-1 h-2 bg-zinc-800 rounded-full overflow-hidden">
        <motion.div
          className={`h-full ${color} rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <span className="text-sm font-bold text-white w-10 text-right">{score}%</span>
    </div>
  );
}

export function SimulationTab({ result }: SimulationTabProps) {
  const { simulationResults, executabilityScore } = result;
  const [expandedFlow, setExpandedFlow] = useState<string | null>(simulationResults[0]?.flow || null);

  const totalSteps = simulationResults.reduce((s, r) => s + r.steps.length, 0);
  const passedSteps = simulationResults.reduce((s, r) => s + r.steps.filter(st => st.status === "pass").length, 0);
  const passedFlows = simulationResults.filter(r => r.overallStatus === "pass").length;

  return (
    <div className="space-y-6">
      {/* Score overview */}
      <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Play className="w-5 h-5 text-indigo-400" />
            <h3 className="text-sm font-semibold text-zinc-200">Executability Score</h3>
          </div>
          <span className={`text-2xl font-bold ${executabilityScore >= 80 ? "text-emerald-400" : executabilityScore >= 60 ? "text-amber-400" : "text-red-400"}`}>
            {executabilityScore}/100
          </span>
        </div>
        
        <ScoreBar score={executabilityScore} />
        
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="text-xl font-bold text-white">{simulationResults.length}</div>
            <div className="text-xs text-zinc-500">Flows Simulated</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="text-xl font-bold text-emerald-400">{passedFlows}</div>
            <div className="text-xs text-zinc-500">Flows Passed</div>
          </div>
          <div className="bg-zinc-800/50 rounded-xl p-3">
            <div className="text-xl font-bold text-white">{passedSteps}/{totalSteps}</div>
            <div className="text-xs text-zinc-500">Steps Passed</div>
          </div>
        </div>
      </div>

      {/* Flow results */}
      <div className="space-y-3">
        {simulationResults.map((flowResult) => {
          const passCount = flowResult.steps.filter(s => s.status === "pass").length;
          const isExpanded = expandedFlow === flowResult.flow;
          
          return (
            <motion.div
              key={flowResult.flow}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedFlow(isExpanded ? null : flowResult.flow)}
                className="w-full flex items-center gap-3 p-4 text-left hover:bg-zinc-800/30 transition-colors"
              >
                {flowResult.overallStatus === "pass" ? (
                  <CheckCircle className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : flowResult.overallStatus === "partial" ? (
                  <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                )}
                
                <div className="flex-1">
                  <div className="text-sm font-medium text-zinc-200">{flowResult.flow}</div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {passCount}/{flowResult.steps.length} steps passed
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <div className="w-24 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${
                        flowResult.overallStatus === "pass" ? "bg-emerald-500" :
                        flowResult.overallStatus === "partial" ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: `${(passCount / flowResult.steps.length) * 100}%` }}
                    />
                  </div>
                  <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    flowResult.overallStatus === "pass" ? "bg-emerald-500/20 text-emerald-300" :
                    flowResult.overallStatus === "partial" ? "bg-amber-500/20 text-amber-300" :
                    "bg-red-500/20 text-red-300"
                  }`}>
                    {flowResult.overallStatus}
                  </span>
                </div>
              </button>
              
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  className="border-t border-zinc-800"
                >
                  <div className="p-4 space-y-2">
                    {flowResult.steps.map((step, i) => (
                      <div
                        key={i}
                        className={`flex items-start gap-3 p-3 rounded-xl border text-xs ${
                          step.status === "pass"
                            ? "bg-emerald-950/20 border-emerald-900/30"
                            : "bg-red-950/20 border-red-900/30"
                        }`}
                      >
                        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
                          <span className="text-zinc-600 w-4 text-right">{i + 1}.</span>
                          {step.status === "pass" ? (
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                          ) : (
                            <XCircle className="w-3.5 h-3.5 text-red-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-zinc-200">{step.action}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-1.5 mt-1.5">
                            <div className="flex items-center gap-1 text-[10px]">
                              <Globe className="w-3 h-3 text-blue-400 shrink-0" />
                              <code className="text-blue-300 truncate">{step.apiEndpoint}</code>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Database className="w-3 h-3 text-amber-400 shrink-0" />
                              <code className="text-amber-300 truncate">{step.dbOperation}</code>
                            </div>
                            <div className="flex items-center gap-1 text-[10px]">
                              <Shield className="w-3 h-3 text-emerald-400 shrink-0" />
                              <span className="text-zinc-400 truncate">{step.roleCheck}</span>
                            </div>
                          </div>
                          {step.reason && (
                            <div className="text-[10px] text-red-400 mt-1">⚠ {step.reason}</div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
