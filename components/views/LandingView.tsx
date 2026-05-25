"use client";

import { motion } from "framer-motion";
import {
  MessageSquare, Brain, Layers, Shield, Rocket, CheckCircle,
  Play, Zap, Moon, Sun
} from "lucide-react";

interface LandingViewProps {
  onStart: () => void;
}

const PIPELINE_STEPS = [
  { icon: MessageSquare, label: "User Prompt", sub: "Natural language input", color: "#8b5cf6" },
  { icon: Brain, label: "Intent Extraction", sub: "Understanding requirements", color: "#6366f1" },
  { icon: Layers, label: "System Design", sub: "Architecture & planning", color: "#3b82f6" },
  { icon: Zap, label: "Schema Generation", sub: "UI, API, DB, Auth schemas", color: "#06b6d4" },
  { icon: Shield, label: "Validation Engine", sub: "Consistency & correctness", color: "#10b981" },
  { icon: Rocket, label: "Executable App", sub: "Ready to run application", color: "#f59e0b" },
];

const STATS = [
  { value: "10K+", label: "Apps Generated", icon: Rocket, color: "#8b5cf6" },
  { value: "98.6%", label: "Validation Success", icon: CheckCircle, color: "#10b981" },
  { value: "120ms", label: "Avg Pipeline Time", icon: Zap, color: "#f59e0b" },
  { value: "99.9%", label: "Runtime Reliability", icon: Shield, color: "#06b6d4" },
];

const TRUSTED = ["Acme Corp", "Novatech", "Hyperion", "Devscale"];

export function LandingView({ onStart }: LandingViewProps) {
  return (
    <div className="min-h-screen bg-[#0a0a0f] relative overflow-hidden">
      {/* Background orbs */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-[radial-gradient(circle,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] rounded-full bg-[radial-gradient(circle,rgba(139,92,246,0.06)_0%,transparent_70%)]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-[radial-gradient(circle,rgba(6,182,212,0.05)_0%,transparent_70%)]" />
      </div>

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-8 py-5 border-b border-[rgba(139,92,246,0.08)]">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-base font-bold text-white">AI Compiler</span>
        </div>
        <div className="flex items-center gap-8 text-sm text-[#64748b]">
          <a href="#" className="hover:text-white transition-colors">Features</a>
          <a href="#" className="hover:text-white transition-colors">How It Works</a>
          <a href="#" className="hover:text-white transition-colors">Use Cases</a>
          <a href="#" className="hover:text-white transition-colors">Pricing</a>
          <a href="#" className="hover:text-white transition-colors">Docs</a>
        </div>
        <div className="flex items-center gap-3">
          <button className="p-2 text-[#64748b] hover:text-white transition-colors">
            <Moon className="w-4 h-4" />
          </button>
          <button
            onClick={onStart}
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            Dashboard
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex items-start justify-between px-8 pt-16 pb-8 max-w-7xl mx-auto">
        {/* Left */}
        <div className="flex-1 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 bg-[rgba(139,92,246,0.1)] border border-[rgba(139,92,246,0.2)] rounded-full text-xs text-violet-400 mb-8"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-violet-400 pulse-dot" />
            AI SOFTWARE COMPILER
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="font-display text-[52px] font-bold leading-[1.1] tracking-tight mb-6"
          >
            <span className="text-white">From Intent to</span>
            <br />
            <span className="text-white">Intelligent Apps.</span>
            <br />
            <span className="gradient-text">Automatically.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-[#64748b] text-base leading-relaxed mb-8 max-w-md"
          >
            Describe your idea in natural language and our AI Compiler
            designs, validates and builds production-ready full-stack
            applications for you.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="flex items-center gap-3 text-sm text-[#475569] mb-10"
          >
            {["Intent", "Architecture", "Schemas", "Validation", "Runtime"].map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="text-[#64748b]">{step}</span>
                {i < 4 && <span className="text-[#2d2d4a]">›</span>}
              </span>
            ))}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-4 mb-12"
          >
            <button
              onClick={onStart}
              className="flex items-center gap-2 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white font-semibold rounded-xl transition-all shadow-[0_0_30px_rgba(139,92,246,0.3)] hover:shadow-[0_0_40px_rgba(139,92,246,0.5)]"
            >
              <Zap className="w-4 h-4" />
              Start Building
            </button>
            <button className="flex items-center gap-2 px-6 py-3 bg-[rgba(255,255,255,0.04)] border border-[rgba(255,255,255,0.08)] text-white font-semibold rounded-xl hover:bg-[rgba(255,255,255,0.07)] transition-all">
              <Play className="w-4 h-4" />
              Watch Demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-[10px] text-[#2d2d4a] uppercase tracking-widest mb-3">TRUSTED BY BUILDERS AT</div>
            <div className="flex items-center gap-6">
              {TRUSTED.map(name => (
                <span key={name} className="text-sm text-[#3d3d5a] font-medium">{name}</span>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right — Pipeline diagram */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 max-w-sm ml-16"
        >
          <div className="relative">
            <div className="absolute top-3 right-3 flex items-center gap-1.5 text-[10px] text-emerald-400">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
              AI Pipeline
            </div>
            <div className="space-y-2">
              {PIPELINE_STEPS.map((step, i) => {
                const Icon = step.icon;
                return (
                  <motion.div
                    key={step.label}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.08 }}
                    className="flex items-center gap-3 bg-[#13131f] border border-[rgba(139,92,246,0.12)] rounded-xl px-4 py-3"
                  >
                    <div
                      className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${step.color}18`, border: `1px solid ${step.color}30` }}
                    >
                      <Icon className="w-4 h-4" style={{ color: step.color }} />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-white">{step.label}</div>
                      <div className="text-[11px] text-[#475569]">{step.sub}</div>
                    </div>
                    {i < PIPELINE_STEPS.length - 1 && (
                      <div className="absolute left-[calc(50%-1px)] mt-12 w-px h-2 bg-[rgba(139,92,246,0.2)]" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          </div>
        </motion.div>
      </div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="relative z-10 grid grid-cols-4 gap-4 px-8 pb-12 max-w-7xl mx-auto"
      >
        {STATS.map(stat => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-5 flex items-center gap-4"
            >
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                style={{ background: `${stat.color}15`, border: `1px solid ${stat.color}25` }}
              >
                <Icon className="w-5 h-5" style={{ color: stat.color }} />
              </div>
              <div>
                <div className="text-xl font-bold text-white">{stat.value}</div>
                <div className="text-xs text-[#475569]">{stat.label}</div>
              </div>
            </div>
          );
        })}
      </motion.div>
    </div>
  );
}
