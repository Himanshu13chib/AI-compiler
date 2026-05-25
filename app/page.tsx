"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sidebar } from "@/components/shell/Sidebar";
import { TopBar } from "@/components/shell/TopBar";
import { LandingView } from "@/components/views/LandingView";
import { WorkspaceView } from "@/components/views/WorkspaceView";
import { PipelinesView } from "@/components/views/PipelinesView";
import { ArchitectureView } from "@/components/views/ArchitectureView";
import { ValidationView } from "@/components/views/ValidationView";
import { RuntimeView } from "@/components/views/RuntimeView";
import { EvaluationView } from "@/components/views/EvaluationView";
import { DashboardView } from "@/components/views/DashboardView";
import { ProjectsView } from "@/components/views/ProjectsView";
import { SettingsView } from "@/components/views/SettingsView";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import type { StageStatus } from "@/components/pipeline/StageNode";
import type { LogEntry } from "@/components/pipeline/LiveLog";

export default function Home() {
  const [showLanding, setShowLanding] = useState(true);
  const [activeView, setActiveView] = useState("workspace");
  const [projectName, setProjectName] = useState("New Project");

  // Pipeline state
  const [prompt, setPrompt] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);
  const [result, setResult] = useState<Stage5Output | null>(null);
  const [previousResult, setPreviousResult] = useState<Stage5Output | null>(null);
  const [stageStatuses, setStageStatuses] = useState<StageStatus[]>(Array(5).fill("idle"));
  const [stageTimings, setStageTimings] = useState<Record<number, number>>({});
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [totalElapsed, setTotalElapsed] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [recentBuilds, setRecentBuilds] = useState<{ appName: string; tagline: string; prompt: string; result: Stage5Output; timestamp: number }[]>([]);

  const startTimeRef = useRef<number>(0);
  const elapsedRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logIdRef = useRef(0);

  useEffect(() => {
    const saved = localStorage.getItem("appcompiler_recent_builds");
    if (saved) {
      try { setRecentBuilds(JSON.parse(saved)); } catch {}
    }
    const activeSaved = localStorage.getItem("appcompiler_active_build");
    if (activeSaved) {
      try {
        const active = JSON.parse(activeSaved);
        setPrompt(active.prompt);
        setResult(active.result);
        setShowLanding(false);
        localStorage.removeItem("appcompiler_active_build");
      } catch {}
    }
  }, []);

  const addLog = useCallback((stage: number, message: string) => {
    setLogs(prev => [...prev, { id: String(++logIdRef.current), stage, message, timestamp: Date.now() }]);
  }, []);

  async function compile() {
    if (!prompt.trim() || isCompiling) return;
    setIsCompiling(true);
    setError(null);
    setLogs([]);
    setStageStatuses(Array(5).fill("idle"));
    setStageTimings({});
    setResult(null);
    startTimeRef.current = Date.now();
    elapsedRef.current = setInterval(() => setTotalElapsed(Date.now() - startTimeRef.current), 100);

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      if (!response.body) throw new Error("No response body");
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try { handleSSEEvent(JSON.parse(line.slice(6))); } catch {}
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Compilation failed");
      setStageStatuses(prev => prev.map(s => s === "running" ? "error" : s));
    } finally {
      if (elapsedRef.current) clearInterval(elapsedRef.current);
      setIsCompiling(false);
    }
  }

  function handleSSEEvent(event: Record<string, unknown>) {
    const type = event.type as string;
    const stage = event.stage as number;
    if (type === "stage_start") {
      setStageStatuses(prev => { const n = [...prev]; n[stage - 1] = "running"; return n; });
      addLog(stage, `Starting ${event.name}...`);
    } else if (type === "stage_complete") {
      setStageStatuses(prev => { const n = [...prev]; n[stage - 1] = "complete"; return n; });
      if (event.timeMs) setStageTimings(prev => ({ ...prev, [stage]: event.timeMs as number }));
    } else if (type === "log") {
      addLog(stage, event.message as string);
    } else if (type === "pipeline_complete") {
      const finalResult = event.result as Stage5Output;
      setPreviousResult(result);
      setResult(finalResult);
      setProjectName(finalResult.masterConfig.intent.appName);
      setActiveView("pipelines");
      setRecentBuilds(prev => {
        const filtered = prev.filter(b => b.appName.toLowerCase() !== finalResult.masterConfig.intent.appName.toLowerCase());
        const newBuild = { appName: finalResult.masterConfig.intent.appName, tagline: finalResult.masterConfig.intent.tagline, prompt, result: finalResult, timestamp: Date.now() };
        const next = [newBuild, ...filtered].slice(0, 10);
        localStorage.setItem("appcompiler_recent_builds", JSON.stringify(next));
        return next;
      });
    } else if (type === "pipeline_error") {
      setError(event.message as string);
      setStageStatuses(prev => prev.map(s => s === "running" ? "error" : s));
    }
  }

  function downloadJSON() {
    if (!result) return;
    const blob = new Blob([JSON.stringify(result, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${result.masterConfig.intent.appName.replace(/\s+/g, "-").toLowerCase()}-config.json`;
    a.click(); URL.revokeObjectURL(url);
  }

  function downloadSQL() {
    if (!result) return;
    const sql = (result.masterConfig.schemas.dbSchema.migrations || []).map(m => `-- Migration ${m.order}: ${m.description}\n${m.sql}`).join("\n\n");
    const blob = new Blob([sql], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url;
    a.download = `${result.masterConfig.intent.appName.replace(/\s+/g, "-").toLowerCase()}-schema.sql`;
    a.click(); URL.revokeObjectURL(url);
  }

  async function downloadYAML() {
    if (!result) return;
    try {
      const response = await fetch("/api/export-openapi", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ result }) });
      if (!response.ok) throw new Error("Export failed");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a"); a.href = url;
      a.download = `${result.masterConfig.intent.appName.replace(/\s+/g, "-").toLowerCase()}-openapi.yaml`;
      a.click(); URL.revokeObjectURL(url);
    } catch {}
  }

  function copyJSON() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
  }

  if (showLanding) {
    return <LandingView onStart={() => setShowLanding(false)} />;
  }

  const sharedProps = { result, previousResult, isCompiling, stageStatuses, stageTimings, logs, totalElapsed, error, prompt, setPrompt, compile, recentBuilds, downloadJSON, downloadSQL, downloadYAML, copyJSON };

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a0f]">
      <Sidebar activeView={activeView} onViewChange={v => { setActiveView(v); }} projectName={projectName} />
      <div className="flex-1 flex flex-col overflow-hidden" style={{ marginLeft: "220px" }}>
        <TopBar projectName={projectName} activeTab={activeView} onTabChange={setActiveView} />
        <div className="flex-1 overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeView === "workspace" && (
              <motion.div key="workspace" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <WorkspaceView {...sharedProps} onViewChange={setActiveView} />
              </motion.div>
            )}
            {activeView === "pipelines" && (
              <motion.div key="pipelines" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <PipelinesView {...sharedProps} />
              </motion.div>
            )}
            {activeView === "architecture" && (
              <motion.div key="architecture" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <ArchitectureView result={result} />
              </motion.div>
            )}
            {activeView === "validation" && (
              <motion.div key="validation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <ValidationView result={result} />
              </motion.div>
            )}
            {activeView === "runtime" && (
              <motion.div key="runtime" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <RuntimeView result={result} />
              </motion.div>
            )}
            {activeView === "evaluation" && (
              <motion.div key="evaluation" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <EvaluationView />
              </motion.div>
            )}
            {activeView === "dashboard" && (
              <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <DashboardView onViewChange={setActiveView} recentBuilds={recentBuilds} />
              </motion.div>
            )}
            {activeView === "projects" && (
              <motion.div key="projects" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <ProjectsView
                  recentBuilds={recentBuilds}
                  onViewChange={setActiveView}
                  onLoadBuild={build => { setPrompt(build.prompt); setResult(build.result); setActiveView("workspace"); }}
                />
              </motion.div>
            )}
            {activeView === "settings" && (
              <motion.div key="settings" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
                <SettingsView />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
