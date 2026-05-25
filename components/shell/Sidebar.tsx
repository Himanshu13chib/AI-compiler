"use client";

import { useState } from "react";
import {
  LayoutDashboard, FolderOpen, Code2, GitBranch, Building2,
  Play, BarChart3, Settings, HelpCircle, ChevronDown, Cpu
} from "lucide-react";

interface SidebarProps {
  activeView: string;
  onViewChange: (view: string) => void;
  projectName?: string;
}

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "projects", label: "Projects", icon: FolderOpen },
  { id: "workspace", label: "Workspace", icon: Code2 },
  { id: "pipelines", label: "Pipelines", icon: GitBranch },
  { id: "architecture", label: "Architecture", icon: Building2 },
  { id: "runtime", label: "Runtime", icon: Play },
  { id: "evaluation", label: "Evaluation", icon: BarChart3 },
  { id: "settings", label: "Settings", icon: Settings },
];

export function Sidebar({ activeView, onViewChange, projectName = "New Project" }: SidebarProps) {
  return (
    <div className="sidebar">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-4 border-b border-[rgba(139,92,246,0.08)]">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
          <Cpu className="w-4 h-4 text-white" />
        </div>
        <div>
          <div className="text-sm font-bold text-white">AI Compiler</div>
          <div className="text-[10px] text-[#475569]">AI Software Generation</div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Current project */}
      <div className="px-3 pb-3 border-t border-[rgba(139,92,246,0.08)] pt-3">
        <div className="bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-lg p-3 mb-3">
          <div className="text-[10px] text-[#475569] mb-1">Current Project</div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span className="text-sm font-semibold text-white truncate">{projectName}</span>
          </div>
          <div className="text-[10px] text-[#475569] mt-1">● Active</div>
        </div>
        <button className="nav-item text-[#475569]">
          <HelpCircle className="w-4 h-4" />
          Need Help?
        </button>
      </div>
    </div>
  );
}
