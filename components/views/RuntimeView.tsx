"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Monitor, Smartphone, Tablet, RefreshCw, ExternalLink, FolderTree, FileCode, Route, Puzzle, Terminal, ChevronRight, ChevronDown } from "lucide-react";

interface RuntimeViewProps {
  result: Stage5Output | null;
}

const PREVIEW_TABS = ["Code", "Files", "Routes", "Components"];

const MOCK_CODE = `import React from 'react'
import { StandardCard } from '@/components/StandardCard'
import { Chart } from '@/components/Chart'

export default function Dashboard() {
  const [data, setData] = useState({
    totalContacts: 1234,
    activeUsers: 842,
    revenue: '$12,456',
    conversion: '3.24%'
  })

  return (
    <div className="dashboard-grid">
      <StatsCard title="Total Contacts" value={data.totalContacts} />
      <StatsCard title="Active Users" value={data.activeUsers} />
      <StatsCard title="Revenue" value={data.revenue} />
      <Chart type="line" dataKey="revenue" />
    </div>
  )
}`;

const MOCK_FILES = [
  { name: "app", type: "folder", children: [
    { name: "dashboard.tsx", type: "file" },
    { name: "contacts.tsx", type: "file" },
    { name: "analytics.tsx", type: "file" },
    { name: "login.tsx", type: "file" },
    { name: "register.tsx", type: "file" },
  ]},
  { name: "components", type: "folder", children: [
    { name: "api", type: "folder", children: [] },
    { name: "roles", type: "folder", children: [] },
  ]},
  { name: "README.md", type: "file" },
];

export function RuntimeView({ result }: RuntimeViewProps) {
  const [previewTab, setPreviewTab] = useState("Code");
  const [viewport, setViewport] = useState<"desktop" | "tablet" | "mobile">("desktop");
  const [zoom, setZoom] = useState(100);

  if (!result) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)]">
        <div className="text-center">
          <div className="text-5xl mb-4">🚀</div>
          <div className="text-sm font-semibold text-[#64748b] mb-1">No runtime preview</div>
          <div className="text-xs text-[#334155]">Generate an app to see the runtime preview</div>
        </div>
      </div>
    );
  }

  const { intent, schemas } = result.masterConfig;

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Runtime Preview</h2>
          <p className="text-xs text-[#475569]">Live preview of the generated application</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
            <ExternalLink className="w-3.5 h-3.5" /> Open in New Tab
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-4">
        {/* Left — Code/Files panel */}
        <div className="col-span-5 flex flex-col bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {/* Tabs */}
          <div className="flex items-center gap-1 px-3 py-2 border-b border-[rgba(139,92,246,0.08)]">
            {PREVIEW_TABS.map(tab => {
              const icons: Record<string, React.ReactNode> = {
                Code: <FileCode className="w-3 h-3" />,
                Files: <FolderTree className="w-3 h-3" />,
                Routes: <Route className="w-3 h-3" />,
                Components: <Puzzle className="w-3 h-3" />,
              };
              return (
                <button key={tab} onClick={() => setPreviewTab(tab)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-md text-[10px] font-medium transition-all ${previewTab === tab ? "bg-[#0a0a0f] text-white border border-[rgba(139,92,246,0.15)]" : "text-[#475569] hover:text-[#94a3b8]"}`}>
                  {icons[tab]} {tab}
                </button>
              );
            })}
          </div>

          {/* File tree / code */}
          {previewTab === "Files" ? (
            <div className="flex-1 overflow-y-auto p-3">
              <FileTree files={MOCK_FILES} />
            </div>
          ) : previewTab === "Routes" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {schemas.uiSchema.pages.map(page => (
                <div key={page.route} className="flex items-center gap-2 py-1.5 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <Route className="w-3 h-3 text-violet-400 shrink-0" />
                  <code className="text-[10px] text-[#94a3b8] font-mono">{page.route}</code>
                  <span className="text-[9px] text-[#334155] ml-auto">{page.name}</span>
                </div>
              ))}
            </div>
          ) : previewTab === "Components" ? (
            <div className="flex-1 overflow-y-auto p-3 space-y-1">
              {schemas.uiSchema.pages.flatMap(p => p.components).slice(0, 20).map((comp, i) => (
                <div key={i} className="flex items-center gap-2 py-1.5 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <Puzzle className="w-3 h-3 text-cyan-400 shrink-0" />
                  <span className="text-[10px] text-[#94a3b8]">{comp.label}</span>
                  <span className="text-[9px] text-[#334155] ml-auto font-mono">{comp.type}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <pre className="p-3 text-[10px] font-mono text-[#64748b] leading-relaxed">{MOCK_CODE}</pre>
            </div>
          )}

          {/* Status bar */}
          <div className="flex items-center gap-3 px-3 py-1.5 border-t border-[rgba(139,92,246,0.08)] bg-[#0a0a0f]">
            <span className="text-[9px] text-[#334155]">TypeScript React</span>
            <span className="text-[9px] text-[#334155]">Ln 1, Col 1</span>
            <span className="text-[9px] text-[#334155]">Spaces: 2</span>
            <span className="text-[9px] text-[#334155]">UTF-8</span>
          </div>
        </div>

        {/* Right — Live Preview */}
        <div className="col-span-7 flex flex-col bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden" style={{ height: "calc(100vh - 200px)" }}>
          {/* Viewport controls */}
          <div className="flex items-center gap-2 px-4 py-2 border-b border-[rgba(139,92,246,0.08)]">
            <span className="text-xs font-semibold text-[#64748b]">Live Preview</span>
            <div className="flex items-center gap-1 ml-3">
              {[
                { id: "desktop", icon: Monitor },
                { id: "tablet", icon: Tablet },
                { id: "mobile", icon: Smartphone },
              ].map(v => {
                const Icon = v.icon;
                return (
                  <button key={v.id} onClick={() => setViewport(v.id as typeof viewport)}
                    className={`p-1.5 rounded-md transition-all ${viewport === v.id ? "bg-[#0a0a0f] text-white border border-[rgba(139,92,246,0.2)]" : "text-[#475569] hover:text-white"}`}>
                    <Icon className="w-3.5 h-3.5" />
                  </button>
                );
              })}
            </div>
            <div className="flex items-center gap-1 ml-auto text-[10px] text-[#475569]">
              <span>{zoom}%</span>
            </div>
          </div>

          {/* Mock app preview */}
          <div className="flex-1 overflow-auto bg-[#080810] p-4">
            <div className={`mx-auto bg-[#0f0f1a] border border-[rgba(139,92,246,0.1)] rounded-xl overflow-hidden transition-all ${
              viewport === "mobile" ? "max-w-[375px]" : viewport === "tablet" ? "max-w-[768px]" : "w-full"
            }`}>
              {/* Mock app header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(139,92,246,0.08)] bg-[#13131f]">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-violet-600 flex items-center justify-center text-[8px] text-white font-bold">
                    {intent.appName.charAt(0)}
                  </div>
                  <span className="text-xs font-semibold text-white">{intent.appName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded-full bg-[#1e1e2e]" />
                  <div className="w-5 h-5 rounded-full bg-violet-600 text-[8px] text-white flex items-center justify-center font-bold">A</div>
                </div>
              </div>

              {/* Mock dashboard content */}
              <div className="flex">
                {viewport !== "mobile" && (
                  <div className="w-28 border-r border-[rgba(139,92,246,0.08)] p-2 space-y-1">
                    {["Dashboard", "Contacts", "Analytics", "Sales", "Billing", "Settings"].map(item => (
                      <div key={item} className={`text-[9px] px-2 py-1.5 rounded text-[#475569] hover:text-white cursor-pointer ${item === "Dashboard" ? "bg-violet-600/20 text-violet-400" : ""}`}>
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex-1 p-3">
                  <div className="text-xs font-semibold text-white mb-2">Dashboard</div>
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {[
                      { label: "Total Contacts", value: "1,234", delta: "+8.7%" },
                      { label: "Active Users", value: "842", delta: "+12.3%" },
                      { label: "Revenue", value: "$12,456", delta: "+6.1%" },
                      { label: "Conversion", value: "3.24%", delta: "+0.8%" },
                    ].map(stat => (
                      <div key={stat.label} className="bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg p-2">
                        <div className="text-[9px] text-[#475569]">{stat.label}</div>
                        <div className="text-sm font-bold text-white">{stat.value}</div>
                        <div className="text-[9px] text-emerald-400">{stat.delta}</div>
                      </div>
                    ))}
                  </div>
                  {/* Mini chart placeholder */}
                  <div className="bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg p-2 mb-2">
                    <div className="text-[9px] text-[#475569] mb-1">Revenue Overview</div>
                    <div className="h-12 flex items-end gap-0.5">
                      {[30, 45, 35, 60, 50, 70, 55, 80, 65, 90, 75, 85].map((h, i) => (
                        <div key={i} className="flex-1 rounded-sm bg-violet-600/40" style={{ height: `${h}%` }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Terminal */}
          <div className="border-t border-[rgba(139,92,246,0.08)]">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-[#0a0a0f]">
              <Terminal className="w-3 h-3 text-[#475569]" />
              <span className="text-[9px] text-[#334155]">Logs</span>
              <span className="text-[9px] text-[#334155]">Terminal</span>
            </div>
            <div className="px-3 py-2 font-mono text-[9px] space-y-0.5 bg-[#080810] max-h-16 overflow-y-auto">
              <div className="text-emerald-400">✓ Server started on http://localhost:3000</div>
              <div className="text-[#475569]">✓ Compiling successfully...</div>
              <div className="text-[#475569]">✓ Application built successfully</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FileTree({ files }: { files: { name: string; type: string; children?: typeof files }[] }) {
  const [open, setOpen] = useState<Record<string, boolean>>({ app: true });
  return (
    <div className="space-y-0.5">
      {files.map(f => (
        <div key={f.name}>
          <div
            className="flex items-center gap-1.5 py-1 px-1 rounded hover:bg-[rgba(139,92,246,0.05)] cursor-pointer"
            onClick={() => f.type === "folder" && setOpen(o => ({ ...o, [f.name]: !o[f.name] }))}
          >
            {f.type === "folder" ? (
              open[f.name] ? <ChevronDown className="w-3 h-3 text-[#475569]" /> : <ChevronRight className="w-3 h-3 text-[#475569]" />
            ) : <span className="w-3" />}
            <span className={`text-[10px] ${f.type === "folder" ? "text-[#94a3b8]" : "text-[#64748b]"}`}>{f.name}</span>
          </div>
          {f.type === "folder" && open[f.name] && f.children && (
            <div className="ml-4">
              <FileTree files={f.children} />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
