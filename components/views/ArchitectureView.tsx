"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Download, Share2, LayoutDashboard, Database, Globe, Shield, GitBranch, ArrowRight, ChevronRight } from "lucide-react";

interface ArchitectureViewProps {
  result: Stage5Output | null;
}

const ARCH_TABS = ["Overview", "Database", "API Endpoints", "Auth & Roles", "Data Flow"];

export function ArchitectureView({ result }: ArchitectureViewProps) {
  const [activeTab, setActiveTab] = useState("Overview");

  if (!result) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-52px)]">
        <div className="text-center">
          <div className="text-5xl mb-4">🏗</div>
          <div className="text-sm font-semibold text-[#64748b] mb-1">No architecture yet</div>
          <div className="text-xs text-[#334155]">Generate an app from the Workspace to see architecture</div>
        </div>
      </div>
    );
  }

  const { intent, architecture, schemas } = result.masterConfig;

  return (
    <div className="p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-lg font-semibold text-white">Architecture Viewer</h2>
          <p className="text-xs text-[#475569]">Visualize the generated system architecture</p>
        </div>
        <div className="flex items-center gap-2">
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
            <Download className="w-3.5 h-3.5" /> Export
          </button>
          <button className="flex items-center gap-1.5 px-3 py-2 bg-[#13131f] border border-[rgba(139,92,246,0.1)] text-[#64748b] text-xs rounded-lg hover:text-white transition-colors">
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg p-1 w-fit">
        {ARCH_TABS.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${activeTab === tab ? "bg-[#13131f] text-white border border-[rgba(139,92,246,0.2)]" : "text-[#475569] hover:text-[#94a3b8]"}`}>
            {tab}
          </button>
        ))}
      </div>

      {activeTab === "Overview" && (
        <div className="grid grid-cols-12 gap-4">
          {/* System Overview */}
          <div className="col-span-3 space-y-3">
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="text-xs font-semibold text-[#64748b] mb-3">System Overview</div>
              <p className="text-[10px] text-[#475569] mb-4 leading-relaxed">High level overview of the generated application architecture.</p>
              {[
                { icon: LayoutDashboard, label: "Pages", value: schemas.uiSchema.pages.length, color: "text-violet-400" },
                { icon: Globe, label: "API Endpoints", value: schemas.apiSchema.endpoints.length, color: "text-blue-400" },
                { icon: Database, label: "Database Tables", value: schemas.dbSchema.tables.length, color: "text-amber-400" },
                { icon: Shield, label: "User Roles", value: schemas.authSchema.roles.length, color: "text-emerald-400" },
              ].map(item => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                    <div className={`w-8 h-8 rounded-lg bg-[#0a0a0f] flex items-center justify-center ${item.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-base font-bold text-white font-display">{item.value}</div>
                      <div className="text-[10px] text-[#475569]">{item.label}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Architecture Diagram */}
          <div className="col-span-6">
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4 h-full">
              <div className="text-xs font-semibold text-[#64748b] mb-4">Architecture Diagram</div>
              <div className="flex items-start justify-between gap-3">
                {/* Frontend */}
                <div className="flex-1 bg-[#0a0a0f] border border-violet-500/20 rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-violet-400 mb-1">Frontend (UI)</div>
                  <div className="text-[9px] text-[#334155] mb-2">React + Tailwind</div>
                  {schemas.uiSchema.pages.slice(0, 5).map(p => (
                    <div key={p.name} className="text-[9px] text-[#475569] py-0.5 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-violet-500/50" />
                      {p.name}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-1 pt-8">
                  <ArrowRight className="w-4 h-4 text-[#334155]" />
                </div>

                {/* Backend */}
                <div className="flex-1 bg-[#0a0a0f] border border-blue-500/20 rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-blue-400 mb-1">Backend (API)</div>
                  <div className="text-[9px] text-[#334155] mb-2">Node.js + Express</div>
                  {["REST API", "Authentication", "Business Logic", "File Handling"].map(item => (
                    <div key={item} className="text-[9px] text-[#475569] py-0.5 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-blue-500/50" />
                      {item}
                    </div>
                  ))}
                </div>

                <div className="flex flex-col items-center justify-center gap-1 pt-8">
                  <ArrowRight className="w-4 h-4 text-[#334155]" />
                </div>

                {/* Database */}
                <div className="flex-1 bg-[#0a0a0f] border border-amber-500/20 rounded-xl p-3">
                  <div className="text-[10px] font-semibold text-amber-400 mb-1">Database</div>
                  <div className="text-[9px] text-[#334155] mb-2">PostgreSQL</div>
                  {schemas.dbSchema.tables.slice(0, 5).map(t => (
                    <div key={t.name} className="text-[9px] text-[#475569] py-0.5 flex items-center gap-1">
                      <div className="w-1 h-1 rounded-full bg-amber-500/50" />
                      {t.name}
                    </div>
                  ))}
                </div>
              </div>

              {/* External Services */}
              <div className="mt-3 bg-[#0a0a0f] border border-emerald-500/20 rounded-xl p-3">
                <div className="text-[10px] font-semibold text-emerald-400 mb-2">External Services</div>
                <div className="flex flex-wrap gap-2">
                  {[
                    intent.hasPayments && "Payment Gateway",
                    "Email Service",
                    intent.hasFileUpload && "File Storage",
                    intent.hasAnalytics && "Analytics Service",
                  ].filter(Boolean).map(s => (
                    <span key={s as string} className="text-[9px] text-[#475569] px-2 py-0.5 bg-[#13131f] border border-[rgba(139,92,246,0.08)] rounded">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Data Flow */}
          <div className="col-span-3">
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4 h-full">
              <div className="text-xs font-semibold text-[#64748b] mb-3">Data Flow</div>
              <div className="space-y-2">
                {["User Request", "API Gateway", "Authentication", "Business Logic", "Database Query", "Response"].map((step, i) => (
                  <div key={step} className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${
                      i === 0 ? "bg-violet-500" : i === 5 ? "bg-emerald-500" : "bg-[#334155]"
                    }`} />
                    <span className="text-[10px] text-[#64748b]">{step}</span>
                    {i < 5 && <div className="w-px h-3 bg-[#1e293b] ml-0.5 absolute" style={{ marginTop: "16px", marginLeft: "3px" }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "Database" && (
        <div className="grid grid-cols-12 gap-4">
          <div className="col-span-4">
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="text-xs font-semibold text-[#64748b] mb-3">Database Schema ({schemas.dbSchema.tables.length} Tables)</div>
              <div className="space-y-1">
                {schemas.dbSchema.tables.map(t => (
                  <div key={t.name} className="flex items-center gap-2 py-1.5 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                    <Database className="w-3 h-3 text-amber-400 shrink-0" />
                    <span className="text-xs text-[#94a3b8] font-mono flex-1">{t.name}</span>
                    <span className="text-[10px] text-[#334155]">{t.columns.length} cols</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="col-span-8">
            <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
              <div className="text-xs font-semibold text-[#64748b] mb-3">Entity Relationships</div>
              <div className="grid grid-cols-2 gap-3">
                {architecture.entities.slice(0, 6).map(entity => (
                  <div key={entity.name} className="bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg p-3">
                    <div className="text-xs font-semibold text-white mb-1">{entity.name}</div>
                    <div className="text-[10px] text-[#475569] mb-2">{entity.description}</div>
                    <div className="flex flex-wrap gap-1">
                      {entity.relations.map((r, i) => (
                        <span key={i} className="text-[9px] px-1.5 py-0.5 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded">
                          {r.type} {r.target}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "API Endpoints" && (
        <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[#64748b] mb-3">API Endpoints ({schemas.apiSchema.endpoints.length})</div>
          <div className="space-y-1.5">
            {schemas.apiSchema.endpoints.slice(0, 20).map(ep => {
              const methodColors: Record<string, string> = {
                GET: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30",
                POST: "bg-blue-500/15 text-blue-400 border-blue-500/30",
                PUT: "bg-amber-500/15 text-amber-400 border-amber-500/30",
                PATCH: "bg-orange-500/15 text-orange-400 border-orange-500/30",
                DELETE: "bg-red-500/15 text-red-400 border-red-500/30",
              };
              return (
                <div key={ep.id} className="flex items-center gap-3 py-2 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${methodColors[ep.method] || "bg-zinc-500/15 text-zinc-400 border-zinc-500/30"}`}>
                    {ep.method}
                  </span>
                  <code className="text-xs text-[#94a3b8] font-mono flex-1">{ep.path}</code>
                  <span className="text-[10px] text-[#334155] hidden md:block">{ep.summary}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeTab === "Auth & Roles" && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Roles & Permissions ({schemas.authSchema.roles.length} Roles)</div>
            <div className="space-y-2">
              {schemas.authSchema.roles.map(role => (
                <div key={role.name} className="flex items-center justify-between py-2 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                  <div>
                    <div className="text-xs font-semibold text-white">{role.name}</div>
                    <div className="text-[10px] text-[#475569]">{role.description}</div>
                  </div>
                  <button className="text-[10px] text-violet-400 hover:text-violet-300">Edit review</button>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
            <div className="text-xs font-semibold text-[#64748b] mb-3">Tech Stack</div>
            <div className="grid grid-cols-2 gap-2">
              {["React", "Node.js", "PostgreSQL", "Tailwind CSS", "Express.js", "JWT", "Stripe", "AWS S3"].map(tech => (
                <div key={tech} className="flex items-center gap-2 bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-lg px-3 py-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-violet-500" />
                  <span className="text-xs text-[#64748b]">{tech}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === "Data Flow" && (
        <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-4">
          <div className="text-xs font-semibold text-[#64748b] mb-4">System Flows ({architecture.flows.length})</div>
          <div className="grid grid-cols-2 gap-4">
            {architecture.flows.slice(0, 6).map(flow => (
              <div key={flow.name} className="bg-[#0a0a0f] border border-[rgba(139,92,246,0.08)] rounded-xl p-3">
                <div className="text-xs font-semibold text-white mb-1">{flow.name}</div>
                <div className="text-[10px] text-[#475569] mb-2">Trigger: {flow.trigger}</div>
                <div className="space-y-1">
                  {flow.steps.slice(0, 3).map((step, i) => (
                    <div key={i} className="flex items-center gap-2 text-[10px] text-[#334155]">
                      <span className="w-4 h-4 rounded-full bg-[#13131f] border border-[rgba(139,92,246,0.1)] flex items-center justify-center text-[8px] text-violet-400 shrink-0">{step.order}</span>
                      {step.action}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
