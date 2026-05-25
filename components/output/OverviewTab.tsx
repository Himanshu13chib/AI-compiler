"use client";

import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Zap, Shield, Database, Globe, Bell, CreditCard, BarChart3, Radio } from "lucide-react";

interface OverviewTabProps {
  result: Stage5Output;
}

const PRIORITY_COLORS = {
  core: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  secondary: "bg-blue-500/20 text-blue-300 border-blue-500/30",
  "nice-to-have": "bg-zinc-500/20 text-zinc-400 border-zinc-500/30",
};

function ScoreGauge({ score, label, color }: { score: number; label: string; color: string }) {
  const circumference = 2 * Math.PI * 36;
  const offset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 80 80">
          <circle cx="40" cy="40" r="36" fill="none" stroke="#27272a" strokeWidth="6" />
          <motion.circle
            cx="40" cy="40" r="36"
            fill="none"
            stroke={color}
            strokeWidth="6"
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-xl font-bold text-white">{score}</span>
        </div>
      </div>
      <span className="text-xs text-zinc-400">{label}</span>
    </div>
  );
}

export function OverviewTab({ result }: OverviewTabProps) {
  const { intent, validation } = result.masterConfig;
  const { executabilityScore, metadata } = result;

  const techFlags = [
    { key: "hasAuth", label: "Auth", icon: Shield, active: intent.hasAuth },
    { key: "hasPayments", label: "Payments", icon: CreditCard, active: intent.hasPayments },
    { key: "hasRealtime", label: "Realtime", icon: Radio, active: intent.hasRealtime },
    { key: "hasFileUpload", label: "File Upload", icon: Database, active: intent.hasFileUpload },
    { key: "hasNotifications", label: "Notifications", icon: Bell, active: intent.hasNotifications },
    { key: "hasAnalytics", label: "Analytics", icon: BarChart3, active: intent.hasAnalytics },
  ];

  return (
    <div className="space-y-6">
      {/* App header */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-indigo-950/60 to-zinc-900/60 border border-indigo-900/50 rounded-2xl p-6"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                {intent.appType}
              </span>
              <span className="text-xs text-zinc-500">
                Generated {new Date(metadata.generatedAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-2xl font-bold text-white">{intent.appName}</h2>
            <p className="text-zinc-400 mt-1 italic">"{intent.tagline}"</p>
          </div>
          <div className="flex gap-4 shrink-0">
            <ScoreGauge score={validation.consistencyScore} label="Consistency" color="#6366f1" />
            <ScoreGauge score={executabilityScore} label="Executability" color="#10b981" />
            <ScoreGauge score={intent.complexityScore * 10} label="Complexity" color="#f59e0b" />
          </div>
        </div>
        
        <p className="text-xs text-zinc-500 mt-4 bg-zinc-900/50 rounded-lg p-3 border border-zinc-800">
          <span className="text-zinc-400 font-medium">Complexity reasoning: </span>
          {intent.complexityReasoning}
        </p>
      </motion.div>

      {/* Tech flags */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {techFlags.map(({ key, label, icon: Icon, active }) => (
          <motion.div
            key={key}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`flex flex-col items-center gap-2 p-3 rounded-xl border transition-all ${
              active
                ? "bg-indigo-950/50 border-indigo-700/50 text-indigo-300"
                : "bg-zinc-900/50 border-zinc-800 text-zinc-600"
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] font-medium">{label}</span>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? "bg-emerald-400" : "bg-zinc-700"}`} />
          </motion.div>
        ))}
      </div>

      {/* Features */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Zap className="w-4 h-4 text-indigo-400" />
          Features ({intent.features.length})
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {intent.features.map((feature, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.03 }}
              className="flex items-start gap-3 bg-zinc-900/50 border border-zinc-800 rounded-xl p-3"
            >
              <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border shrink-0 mt-0.5 ${PRIORITY_COLORS[feature.priority]}`}>
                {feature.priority}
              </span>
              <div>
                <div className="text-sm font-medium text-zinc-200">{feature.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">{feature.description}</div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* User roles */}
      <div>
        <h3 className="text-sm font-semibold text-zinc-300 mb-3 flex items-center gap-2">
          <Globe className="w-4 h-4 text-indigo-400" />
          User Roles ({intent.userRoles.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {intent.userRoles.map((role, i) => (
            <div key={i} className="flex items-center gap-2 bg-zinc-900/50 border border-zinc-800 rounded-xl px-3 py-2">
              <div className="flex gap-0.5">
                {Array.from({ length: 5 }).map((_, j) => (
                  <div
                    key={j}
                    className={`w-1.5 h-3 rounded-sm ${j < role.accessLevel ? "bg-indigo-500" : "bg-zinc-700"}`}
                  />
                ))}
              </div>
              <div>
                <div className="text-xs font-medium text-zinc-200">{role.name}</div>
                <div className="text-[10px] text-zinc-500">Level {role.accessLevel}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inferred features & assumptions */}
      {(intent.inferredFeatures.length > 0 || intent.assumptions.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {intent.inferredFeatures.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-amber-400 mb-2">🤖 AI Inferred Features</h4>
              <ul className="space-y-1">
                {intent.inferredFeatures.map((f, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="text-amber-500 mt-0.5">→</span> {f}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {intent.assumptions.length > 0 && (
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-blue-400 mb-2">💡 Assumptions Made</h4>
              <ul className="space-y-1">
                {intent.assumptions.map((a, i) => (
                  <li key={i} className="text-xs text-zinc-400 flex items-start gap-1.5">
                    <span className="text-blue-500 mt-0.5">•</span> {a}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Pipeline stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Total Time", value: `${(metadata.totalTimeMs / 1000).toFixed(1)}s` },
          { label: "Est. Tokens", value: metadata.totalTokensUsed.toLocaleString() },
          { label: "Pipeline Version", value: metadata.pipelineVersion },
          { label: "Issues Fixed", value: validation.autoFixed.length + validation.aiRepaired.filter(r => r.success).length },
        ].map(({ label, value }) => (
          <div key={label} className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-3 text-center">
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-[10px] text-zinc-500 mt-0.5">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
