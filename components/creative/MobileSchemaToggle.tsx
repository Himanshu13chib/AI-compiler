"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Stage5Output } from "@/lib/pipeline/schemas";
import { Smartphone, Monitor, Tablet, Eye, EyeOff, ChevronRight } from "lucide-react";

interface MobileSchemaToggleProps {
  result: Stage5Output;
}

type ViewMode = "mobile" | "tablet" | "desktop";

const VIEWPORT_CONFIG = {
  mobile: { width: "375px", label: "Mobile", icon: Smartphone, breakpoint: "< 768px" },
  tablet: { width: "768px", label: "Tablet", icon: Tablet, breakpoint: "768px – 1024px" },
  desktop: { width: "100%", label: "Desktop", icon: Monitor, breakpoint: "> 1024px" },
};

const LAYOUT_RULES = {
  mobile: {
    sidebar: "hidden",
    navbar: "bottom-nav",
    columns: 1,
    tableView: "card-stack",
    chartSize: "compact",
  },
  tablet: {
    sidebar: "collapsible",
    navbar: "top-nav",
    columns: 2,
    tableView: "scrollable-table",
    chartSize: "medium",
  },
  desktop: {
    sidebar: "always-visible",
    navbar: "top-nav",
    columns: 3,
    tableView: "full-table",
    chartSize: "full",
  },
};

export function MobileSchemaToggle({ result }: MobileSchemaToggleProps) {
  const [viewMode, setViewMode] = useState<ViewMode>("desktop");
  const [selectedPage, setSelectedPage] = useState(0);
  const [showComponents, setShowComponents] = useState(true);

  const { uiSchema } = result.masterConfig.schemas;
  const pages = uiSchema.pages;
  const currentPage = pages[selectedPage];
  const rules = LAYOUT_RULES[viewMode];
  const config = VIEWPORT_CONFIG[viewMode];

  function getComponentVisibility(componentType: string): boolean {
    if (viewMode === "mobile") {
      const hiddenOnMobile = ["sidebar", "chart-large", "data-table", "stats-grid"];
      return !hiddenOnMobile.some(h => componentType.toLowerCase().includes(h));
    }
    return true;
  }

  function getComponentNote(componentType: string): string | null {
    if (viewMode === "mobile") {
      if (componentType.toLowerCase().includes("table")) return "→ Card stack on mobile";
      if (componentType.toLowerCase().includes("chart")) return "→ Compact chart on mobile";
      if (componentType.toLowerCase().includes("sidebar")) return "→ Hidden, use bottom nav";
      if (componentType.toLowerCase().includes("grid")) return "→ Single column on mobile";
    }
    if (viewMode === "tablet") {
      if (componentType.toLowerCase().includes("sidebar")) return "→ Collapsible drawer";
      if (componentType.toLowerCase().includes("grid")) return "→ 2-column grid";
    }
    return null;
  }

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Smartphone className="w-5 h-5 text-teal-400" />
          <h3 className="text-sm font-semibold text-zinc-200">Mobile Schema Toggle</h3>
          <span className="text-xs text-zinc-500">Responsive layout analysis</span>
        </div>
        <button
          onClick={() => setShowComponents(!showComponents)}
          className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
        >
          {showComponents ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {showComponents ? "Hide" : "Show"} components
        </button>
      </div>

      {/* Viewport toggle */}
      <div className="flex gap-1 p-1 bg-zinc-800/50 rounded-xl mb-5 w-fit">
        {(Object.keys(VIEWPORT_CONFIG) as ViewMode[]).map(mode => {
          const cfg = VIEWPORT_CONFIG[mode];
          const Icon = cfg.icon;
          return (
            <button
              key={mode}
              onClick={() => setViewMode(mode)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                viewMode === mode
                  ? "bg-teal-600/30 text-teal-300 border border-teal-600/40"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {cfg.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Page list */}
        <div className="space-y-1">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">Pages ({pages.length})</p>
          {pages.map((page, i) => (
            <button
              key={i}
              onClick={() => setSelectedPage(i)}
              className={`w-full text-left flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all ${
                selectedPage === i
                  ? "bg-teal-600/20 border border-teal-600/30 text-teal-300"
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/30"
              }`}
            >
              <ChevronRight className={`w-3 h-3 transition-transform ${selectedPage === i ? "rotate-90" : ""}`} />
              <span className="flex-1 truncate">{page.name}</span>
              <span className="text-[9px] opacity-50">{page.layout}</span>
            </button>
          ))}
        </div>

        {/* Layout rules */}
        <div className="space-y-3">
          <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
            Layout Rules — {config.label} ({config.breakpoint})
          </p>
          <div className="space-y-2">
            {Object.entries(rules).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between bg-zinc-800/30 border border-zinc-700/50 rounded-lg px-3 py-2">
                <span className="text-[10px] text-zinc-500 capitalize">{key.replace(/([A-Z])/g, " $1")}</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  viewMode === "mobile"
                    ? "bg-amber-500/10 text-amber-400"
                    : viewMode === "tablet"
                    ? "bg-blue-500/10 text-blue-400"
                    : "bg-emerald-500/10 text-emerald-400"
                }`}>
                  {value}
                </span>
              </div>
            ))}
          </div>

          {/* Viewport preview */}
          <div className="bg-zinc-800/20 border border-zinc-700/50 rounded-xl p-3">
            <p className="text-[10px] text-zinc-600 mb-2">Viewport Preview</p>
            <div className="flex items-end gap-2">
              {(["mobile", "tablet", "desktop"] as ViewMode[]).map(mode => {
                const heights = { mobile: 40, tablet: 30, desktop: 20 };
                const widths = { mobile: "w-8", tablet: "w-16", desktop: "w-24" };
                return (
                  <div key={mode} className="flex flex-col items-center gap-1">
                    <motion.div
                      animate={{ opacity: viewMode === mode ? 1 : 0.3 }}
                      className={`${widths[mode]} bg-zinc-700 rounded-sm border ${
                        viewMode === mode ? "border-teal-500/50" : "border-zinc-600"
                      }`}
                      style={{ height: `${heights[mode]}px` }}
                    />
                    <span className="text-[8px] text-zinc-600">{VIEWPORT_CONFIG[mode].label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Component visibility */}
        <AnimatePresence>
          {showComponents && currentPage && (
            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
            >
              <p className="text-[10px] text-zinc-600 uppercase tracking-wider mb-2">
                {currentPage.name} — Components
              </p>
              <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                {currentPage.components.length === 0 ? (
                  <p className="text-xs text-zinc-600">No components defined</p>
                ) : (
                  currentPage.components.map((comp, i) => {
                    const visible = getComponentVisibility(comp.type);
                    const note = getComponentNote(comp.type);
                    return (
                      <motion.div
                        key={i}
                        animate={{ opacity: visible ? 1 : 0.4 }}
                        className={`flex items-start gap-2 px-2.5 py-2 rounded-lg border text-[10px] ${
                          visible
                            ? "bg-zinc-800/30 border-zinc-700/50"
                            : "bg-zinc-900/30 border-zinc-800/30"
                        }`}
                      >
                        <span className={visible ? "text-emerald-400" : "text-zinc-600"}>
                          {visible ? "✓" : "✗"}
                        </span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className={visible ? "text-zinc-300" : "text-zinc-600 line-through"}>
                              {comp.label}
                            </span>
                            <span className="text-zinc-600 opacity-60">{comp.type}</span>
                          </div>
                          {note && (
                            <p className="text-amber-400/70 mt-0.5">{note}</p>
                          )}
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Summary bar */}
      <div className="mt-4 flex items-center gap-4 pt-4 border-t border-zinc-800">
        <div className="text-[10px] text-zinc-600">
          <span className="text-zinc-400 font-medium">{config.label}</span> layout:
        </div>
        <div className="flex items-center gap-3 text-[10px]">
          <span className="text-zinc-500">
            <span className="text-zinc-300">{rules.columns}</span> col{rules.columns !== 1 ? "s" : ""}
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">
            Sidebar: <span className="text-zinc-300">{rules.sidebar}</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">
            Nav: <span className="text-zinc-300">{rules.navbar}</span>
          </span>
          <span className="text-zinc-700">·</span>
          <span className="text-zinc-500">
            Tables: <span className="text-zinc-300">{rules.tableView}</span>
          </span>
        </div>
      </div>
    </div>
  );
}
