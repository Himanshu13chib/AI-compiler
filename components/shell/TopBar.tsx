"use client";

import { Bell, ChevronDown, Coins } from "lucide-react";

interface TopBarProps {
  projectName?: string;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const TABS = ["Workspace", "Pipelines", "Architecture", "Runtime", "Evaluation"];

export function TopBar({ projectName = "New Project", activeTab, onTabChange }: TopBarProps) {
  return (
    <div className="topbar">
      {/* Project selector */}
      <div className="flex flex-col mr-4">
        <span className="text-[10px] text-[#475569]">Project</span>
        <button className="flex items-center gap-1 text-sm font-semibold text-white hover:text-violet-300 transition-colors">
          {projectName}
          <ChevronDown className="w-3.5 h-3.5 text-[#475569]" />
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 flex-1">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => onTabChange(tab.toLowerCase())}
            className={`tab-btn ${activeTab === tab.toLowerCase() ? "active" : ""}`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Right side */}
      <div className="flex items-center gap-3 ml-auto">
        <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[rgba(16,185,129,0.1)] border border-[rgba(16,185,129,0.2)] rounded-lg">
          <Coins className="w-3.5 h-3.5 text-emerald-400" />
          <span className="text-xs font-semibold text-emerald-400">12,450</span>
          <span className="text-[10px] text-[#475569]">Credits</span>
        </div>
        <button className="relative p-1.5 text-[#475569] hover:text-white transition-colors">
          <Bell className="w-4 h-4" />
          <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 bg-violet-500 rounded-full" />
        </button>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-500 to-indigo-500 flex items-center justify-center text-xs font-bold text-white">
          AK
        </div>
      </div>
    </div>
  );
}
