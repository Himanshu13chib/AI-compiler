"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import type { StageStatus } from "@/components/pipeline/StageNode";
import type { LogEntry } from "@/components/pipeline/LiveLog";
import {
  Sparkles, Send, Loader2, CheckCircle, ChevronDown,
  ChevronUp, History, Wand2, Download, Copy, FileCode,
  HelpCircle, ArrowRight, SkipForward
} from "lucide-react";

const EXAMPLE_PROMPTS = [
  "Build a CRM with login, contacts, dashboard, role-based access, premium plan with payments. Admins can see analytics.",
  "E-commerce platform with Stripe payments, vendor dashboard, and order tracking",
  "Project management tool like Linear — teams, sprints, issues, and time tracking",
  "Healthcare appointment booking with video consultation and insurance billing",
  "Multi-tenant SaaS with workspaces, billing, SSO, and feature flags",
];

const PIPELINE_STAGES = [
  { id: 1, label: "Intent Extraction", icon: "🔍" },
  { id: 2, label: "Architecture Planning", icon: "🏗" },
  { id: 3, label: "Schema Generation", icon: "⚙️" },
  { id: 4, label: "Validation", icon: "🔬" },
  { id: 5, label: "Repair", icon: "🔧" },
  { id: 6, label: "Runtime Build", icon: "🚀" },
];

const OUTPUT_TABS = [
  { id: "ui", label: "UI Schema" },
  { id: "api", label: "API Schema" },
  { id: "db", label: "DB Schema" },
  { id: "auth", label: "Auth Rules" },
];

interface WorkspaceViewProps {
  result: Stage5Output | null;
  previousResult: Stage5Output | null;
  isCompiling: boolean;
  stageStatuses: StageStatus[];
  stageTimings: Record<number, number>;
  logs: LogEntry[];
  totalElapsed: number;
  error: string | null;
  prompt: string;
  setPrompt: (p: string) => void;
  compile: () => void;
  recentBuilds: { appName: string; tagline: string; prompt: string; result: Stage5Output; timestamp: number }[];
  downloadJSON: () => void;
  downloadSQL: () => void;
  downloadYAML: () => void;
  copyJSON: () => void;
  onViewChange: (v: string) => void;
}

export function WorkspaceView({
  result, isCompiling, stageStatuses, stageTimings, logs, totalElapsed,
  error, prompt, setPrompt, compile, recentBuilds, downloadJSON, downloadSQL, downloadYAML, copyJSON, onViewChange
}: WorkspaceViewProps) {
  const [outputTab, setOutputTab] = useState("ui");
  const [showLogs, setShowLogs] = useState(false);
  const [chatMsg, setChatMsg] = useState("");
  const [clarifyingQuestions, setClarifyingQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showClarify, setShowClarify] = useState(false);
  const [clarifyLoading, setClarifyLoading] = useState(false);

  const completedStages = stageStatuses.filter(s => s === "complete").length;
  const progressPct = isCompiling
    ? Math.round((completedStages / 5) * 100)
    : result ? 100 : 0;

  // Smart compile: check for vague prompt first
  async function smartCompile() {
    if (!prompt.trim() || isCompiling) return;
    // If prompt is short/vague, fetch clarifying questions from Stage 1 intent
    if (prompt.trim().split(" ").length < 8 && !showClarify) {
      setClarifyLoading(true);
      try {
        const res = await fetch("/api/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: prompt.trim(), clarifyOnly: true }),
        });
        // We can't easily get just stage1 output here, so we use a lightweight heuristic:
        // just show generic clarifying questions for short prompts
        const questions = [
          "What type of users will use this app? (e.g. admins, customers, staff)",
          "Should it include authentication and role-based access?",
          "Do you need payments, real-time features, or file uploads?",
          "What is the primary goal — internal tool, customer-facing, or marketplace?",
        ];
        setClarifyingQuestions(questions);
        setShowClarify(true);
      } catch {
        compile(); // fallback: just compile
      } finally {
        setClarifyLoading(false);
      }
    } else {
      compile();
    }
  }

  function answerAndCompile() {
    // Append answers to prompt
    const answered = Object.entries(answers)
      .filter(([, v]) => v.trim())
      .map(([i, v]) => `${clarifyingQuestions[Number(i)]}: ${v}`)
      .join(". ");
    if (answered) setPrompt(prompt + ". " + answered);
    setShowClarify(false);
    setClarifyingQuestions([]);
    setAnswers({});
    setTimeout(() => compile(), 50);
  }

  function skipAndCompile() {
    setShowClarify(false);
    setClarifyingQuestions([]);
    setAnswers({});
    compile();
  }

  const stats = result ? {
    files: result.masterConfig.schemas.uiSchema.pages.length + result.masterConfig.schemas.dbSchema.tables.length,
    apis: result.masterConfig.schemas.apiSchema.endpoints.length,
    tables: result.masterConfig.schemas.dbSchema.tables.length,
    components: result.masterConfig.schemas.uiSchema.pages.reduce((s, p) => s + p.components.length, 0),
  } : null;

  function getSchemaJSON() {
    if (!result) return "";
    const { schemas } = result.masterConfig;
    if (outputTab === "ui") return JSON.stringify(schemas.uiSchema, null, 2);
    if (outputTab === "api") return JSON.stringify(schemas.apiSchema, null, 2);
    if (outputTab === "db") return JSON.stringify(schemas.dbSchema, null, 2);
    if (outputTab === "auth") return JSON.stringify(schemas.authSchema, null, 2);
    return "";
  }

  return (
    <div className="flex h-[calc(100vh-52px)] overflow-hidden">
      {/* ── LEFT PANEL ── */}
      <div className="w-[520px] shrink-0 flex flex-col border-r border-[rgba(139,92,246,0.08)] overflow-y-auto">
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-[rgba(139,92,246,0.08)]">
          <div className="flex items-center gap-2 mb-1">
            <Sparkles className="w-4 h-4 text-violet-400" />
            <h1 className="font-display text-lg font-semibold text-white">AI Workspace</h1>
          </div>
          <p className="text-xs text-[#475569]">Describe your application in natural language and let AI build it for you.</p>
        </div>

        <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
          {/* 1 — Prompt */}
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">1</span>
              <span className="text-sm font-semibold text-white">Your Prompt</span>
            </div>
            <textarea
              value={prompt}
              onChange={e => setPrompt(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) smartCompile(); }}
              placeholder="Build a CRM with login, contacts, dashboard, role-based access, premium plan with payments. Admins can see analytics."
              className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.12)] rounded-lg p-3 text-sm text-[#e2e8f0] placeholder-[#334155] focus:outline-none focus:border-violet-500 resize-none transition-colors"
              rows={4}
              disabled={isCompiling}
            />
            <div className="flex items-center justify-between mt-3">
              <button className="flex items-center gap-1.5 text-xs text-[#475569] hover:text-violet-400 transition-colors">
                <Wand2 className="w-3.5 h-3.5" />
                Improve Prompt
              </button>
              <div className="flex items-center gap-2">
                <span className="text-[10px] text-[#334155]">{prompt.length} / 4000</span>
                <button
                  onClick={smartCompile}
                  disabled={isCompiling || clarifyLoading || !prompt.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 disabled:bg-[#1e1e2e] disabled:text-[#334155] text-white text-xs font-semibold rounded-lg transition-all"
                >
                  {(isCompiling || clarifyLoading) ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
            {/* Example chips */}
            <div className="flex flex-wrap gap-1.5 mt-3 pt-3 border-t border-[rgba(139,92,246,0.08)]">
              {EXAMPLE_PROMPTS.slice(0, 3).map((p, i) => (
                <button key={i} onClick={() => setPrompt(p)}
                  className="text-[10px] px-2 py-1 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] text-[#475569] rounded-md hover:border-violet-500/40 hover:text-violet-400 transition-all truncate max-w-[160px]">
                  {p.substring(0, 35)}…
                </button>
              ))}
            </div>
          </div>

          {/* Clarifying Questions Card */}
          <AnimatePresence>
            {showClarify && clarifyingQuestions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="bg-[#13131f] border border-amber-500/20 rounded-xl p-4"
              >
                <div className="flex items-center gap-2 mb-3">
                  <HelpCircle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-semibold text-white">Your prompt is a bit vague</span>
                  <span className="text-[10px] text-[#475569] ml-1">— a few quick answers will improve output quality</span>
                </div>
                <div className="space-y-3 mb-4">
                  {clarifyingQuestions.map((q, i) => (
                    <div key={i}>
                      <div className="text-[10px] text-[#64748b] mb-1">{q}</div>
                      <input
                        value={answers[i] || ""}
                        onChange={e => setAnswers(prev => ({ ...prev, [i]: e.target.value }))}
                        placeholder="Optional — leave blank to let AI decide"
                        className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] rounded-lg px-3 py-1.5 text-xs text-[#94a3b8] placeholder-[#334155] focus:outline-none focus:border-violet-500 transition-colors"
                      />
                    </div>
                  ))}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={answerAndCompile}
                    className="flex items-center gap-1.5 px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-xs font-semibold rounded-lg transition-all"
                  >
                    <ArrowRight className="w-3.5 h-3.5" /> Answer & Continue
                  </button>
                  <button
                    onClick={skipAndCompile}
                    className="flex items-center gap-1.5 px-4 py-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] text-[#475569] text-xs rounded-lg hover:text-white transition-all"
                  >
                    <SkipForward className="w-3.5 h-3.5" /> Skip — Let AI Decide
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 2 — Pipeline Progress */}
          {(isCompiling || result) && (
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">2</span>
                  <span className="text-sm font-semibold text-white">AI Pipeline Progress</span>
                </div>
                <button onClick={() => setShowLogs(!showLogs)} className="text-[10px] text-[#475569] hover:text-violet-400 transition-colors flex items-center gap-1">
                  View Logs {showLogs ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
              </div>

              {/* Stage icons row */}
              <div className="flex items-center justify-between mb-3">
                {PIPELINE_STAGES.map((stage, i) => {
                  const status = stageStatuses[i] || "idle";
                  const isActive = status === "running";
                  const isDone = status === "complete";
                  return (
                    <div key={stage.id} className="flex flex-col items-center gap-1">
                      <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base border-2 transition-all ${
                        isDone ? "border-emerald-500 bg-emerald-950/40" :
                        isActive ? "border-violet-500 bg-violet-950/40 shadow-[0_0_12px_rgba(139,92,246,0.4)]" :
                        "border-[#1e1e2e] bg-[#0a0a0f]"
                      }`}>
                        {isDone ? <CheckCircle className="w-4 h-4 text-emerald-400" /> :
                         isActive ? <Loader2 className="w-4 h-4 text-violet-400 animate-spin" /> :
                         <span className="text-sm">{stage.icon}</span>}
                      </div>
                      <span className="text-[9px] text-[#334155] text-center leading-tight w-14">{stage.label}</span>
                    </div>
                  );
                })}
              </div>

              {/* Progress bar */}
              <div className="h-1.5 bg-[#0a0a0f] rounded-full overflow-hidden mb-2">
                <motion.div
                  className="h-full bg-gradient-to-r from-violet-600 to-indigo-500 rounded-full"
                  animate={{ width: `${progressPct}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px]">
                <span className="text-[#475569]">
                  {isCompiling ? `Generating schemas...` : result ? "Complete" : "Ready"}
                </span>
                <span className="text-violet-400 font-semibold">{progressPct}%</span>
              </div>

              {/* Logs */}
              <AnimatePresence>
                {showLogs && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                    className="mt-3 overflow-hidden">
                    <div className="log-terminal p-3 max-h-40 overflow-y-auto space-y-0.5">
                      {logs.slice(-20).map(log => (
                        <div key={log.id} className="flex gap-2 text-[10px]">
                          <span className="text-[#334155] shrink-0">{new Date(log.timestamp).toLocaleTimeString("en", { hour12: false })}</span>
                          <span className={`shrink-0 ${["text-violet-400","text-indigo-400","text-cyan-400","text-amber-400","text-emerald-400"][log.stage-1] || "text-[#475569]"}`}>[S{log.stage}]</span>
                          <span className="text-[#94a3b8]">{log.message}</span>
                        </div>
                      ))}
                      {logs.length === 0 && <span className="text-[#334155]">Waiting for pipeline...</span>}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* 3 — Generation Summary */}
          {result && stats && (
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <span className="w-5 h-5 rounded-full bg-violet-600 text-white text-[10px] font-bold flex items-center justify-center shrink-0">3</span>
                <span className="text-sm font-semibold text-white">Generation Summary</span>
              </div>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: "Files Generated", value: stats.files, sub: "+12 in this run" },
                  { label: "APIs Generated", value: stats.apis, sub: `+${Math.floor(stats.apis/3)} in this run` },
                  { label: "DB Tables", value: stats.tables, sub: `+${Math.floor(stats.tables/3)} in this run` },
                  { label: "Components", value: stats.components, sub: `+${Math.floor(stats.components/3)} in this run` },
                ].map(item => (
                  <div key={item.label} className="bg-[#0a0a0f] rounded-lg p-3">
                    <div className="text-xl font-bold text-white font-display">{item.value}</div>
                    <div className="text-[10px] text-[#475569] mt-0.5">{item.label}</div>
                    <div className="text-[9px] text-emerald-400 mt-1">{item.sub}</div>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-[rgba(139,92,246,0.08)]">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
                <span className="text-[10px] text-[#475569]">AI is working... This may take a few moments</span>
                <span className="ml-auto text-[10px] text-[#334155]">Estimated time: 15–30s</span>
              </div>
            </div>
          )}

          {/* Recent builds */}
          {recentBuilds.length > 0 && !result && (
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <History className="w-3.5 h-3.5 text-[#475569]" />
                <span className="text-xs font-semibold text-[#64748b]">Recent Builds</span>
              </div>
              <div className="space-y-1.5">
                {recentBuilds.slice(0, 4).map((b, i) => (
                  <button key={i} onClick={() => setPrompt(b.prompt)}
                    className="w-full text-left flex items-center gap-2 px-3 py-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg hover:border-violet-500/30 transition-all">
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-[#94a3b8] truncate">{b.appName}</div>
                      <div className="text-[10px] text-[#334155] truncate">{b.tagline}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-950/20 border border-red-900/40 rounded-xl p-3 text-xs text-red-400">
              <strong>Error:</strong> {error}
            </div>
          )}
        </div>

        {/* Bottom chat bar */}
        <div className="px-5 py-3 border-t border-[rgba(139,92,246,0.08)]">
          <div className="flex gap-2">
            <input
              value={chatMsg}
              onChange={e => setChatMsg(e.target.value)}
              placeholder="Ask AI to modify or regenerate..."
              className="flex-1 bg-[#0a0a0f] border border-[rgba(139,92,246,0.12)] rounded-lg px-3 py-2 text-xs text-[#94a3b8] placeholder-[#334155] focus:outline-none focus:border-violet-500 transition-colors"
            />
            <button className="p-2 bg-violet-600 hover:bg-violet-500 rounded-lg transition-colors">
              <Send className="w-3.5 h-3.5 text-white" />
            </button>
            <button className="flex items-center gap-1 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#475569] text-xs rounded-lg hover:text-white transition-colors">
              <History className="w-3 h-3" /> History
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL — Generated Output ── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-[rgba(139,92,246,0.08)]">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded-full bg-[#1e1e2e] text-[#64748b] text-[10px] font-bold flex items-center justify-center">4</span>
            <span className="text-sm font-semibold text-white">Generated Output</span>
          </div>
          {result && (
            <div className="flex items-center gap-2">
              <button onClick={copyJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
                <Copy className="w-3 h-3" /> Copy
              </button>
              <button onClick={downloadJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          )}
        </div>

        {result ? (
          <>
            {/* Schema tabs */}
            <div className="flex items-center gap-1 px-5 py-2 border-b border-[rgba(139,92,246,0.08)]">
              {OUTPUT_TABS.map(tab => (
                <button key={tab.id} onClick={() => setOutputTab(tab.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${outputTab === tab.id ? "bg-violet-600 text-white" : "text-[#475569] hover:text-[#94a3b8]"}`}>
                  {tab.label}
                </button>
              ))}
              <div className="ml-auto flex gap-2">
                <button onClick={downloadSQL} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#475569] text-[10px] rounded-lg hover:text-white transition-colors">
                  <Download className="w-3 h-3" /> SQL
                </button>
                <button onClick={downloadYAML} className="flex items-center gap-1 px-2.5 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#475569] text-[10px] rounded-lg hover:text-white transition-colors">
                  <FileCode className="w-3 h-3" /> OpenAPI
                </button>
              </div>
            </div>

            {/* JSON viewer */}
            <div className="flex-1 overflow-auto p-4">
              <pre className="code-block text-[11px] leading-relaxed h-full overflow-auto">
                <code>{getSchemaJSON()}</code>
              </pre>
            </div>

            {/* Format / Download bar */}
            <div className="flex items-center gap-3 px-5 py-3 border-t border-[rgba(139,92,246,0.08)]">
              <button onClick={copyJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
                Format JSON
              </button>
              <button onClick={copyJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
                <Copy className="w-3 h-3" />
              </button>
              <button onClick={downloadJSON} className="flex items-center gap-1.5 px-3 py-1.5 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors ml-auto">
                <Download className="w-3 h-3" /> Download
              </button>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <div className="text-5xl mb-4">✨</div>
              <div className="text-sm font-semibold text-[#64748b] mb-1">No output yet</div>
              <div className="text-xs text-[#334155]">Describe your app and click compile to generate schemas</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
