"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Key, Cpu, Bell, Shield, Palette, Save, Eye, EyeOff, CheckCircle } from "lucide-react";

const SETTINGS_TABS = [
  { id: "api", label: "API Keys", icon: Key },
  { id: "model", label: "Model", icon: Cpu },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "security", label: "Security", icon: Shield },
  { id: "appearance", label: "Appearance", icon: Palette },
];

export function SettingsView() {
  const [activeTab, setActiveTab] = useState("api");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState("AIzaSyA0xr1szyxGkf9uNpQqAp8ViJawB6okhNo");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [temperature, setTemperature] = useState("0.7");
  const [maxTokens, setMaxTokens] = useState("8192");

  function handleSave() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="p-6 max-w-4xl space-y-5">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="font-display text-2xl font-bold text-white mb-1">Settings</h1>
        <p className="text-sm text-[#475569]">Manage your AI Compiler configuration</p>
      </motion.div>

      <div className="flex gap-5">
        {/* Sidebar tabs */}
        <div className="w-44 shrink-0 space-y-1">
          {SETTINGS_TABS.map(tab => {
            const Icon = tab.icon;
            return (
              <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm transition-all ${activeTab === tab.id ? "bg-violet-600/15 text-violet-400 border border-violet-500/20" : "text-[#475569] hover:text-white hover:bg-[rgba(255,255,255,0.04)]"}`}>
                <Icon className="w-4 h-4 shrink-0" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 bg-[#13131f] border border-[rgba(139,92,246,0.1)] rounded-xl p-6 space-y-5">
          {activeTab === "api" && (
            <>
              <div>
                <h2 className="text-sm font-semibold text-white mb-1">Gemini API Key</h2>
                <p className="text-xs text-[#475569] mb-4">Your Google Gemini API key for AI generation. Get one at <span className="text-violet-400">aistudio.google.com</span></p>
                <div className="relative">
                  <input
                    type={showKey ? "text" : "password"}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] font-mono focus:outline-none focus:border-violet-500 transition-colors pr-10"
                  />
                  <button onClick={() => setShowKey(!showKey)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#475569] hover:text-white transition-colors">
                    {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div className="p-3 bg-emerald-500/5 border border-emerald-500/15 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <span className="text-xs text-emerald-400">API key is configured and working</span>
              </div>
            </>
          )}

          {activeTab === "model" && (
            <>
              <div>
                <h2 className="text-sm font-semibold text-white mb-4">Model Configuration</h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-[#64748b] mb-2 block">Model</label>
                    <select value={model} onChange={e => setModel(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] focus:outline-none focus:border-violet-500 transition-colors">
                      <option value="gemini-2.5-flash">Gemini 2.5 Flash (Recommended)</option>
                      <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                      <option value="gemini-1.5-pro">Gemini 1.5 Pro</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748b] mb-2 block">Temperature: {temperature}</label>
                    <input type="range" min="0" max="1" step="0.1" value={temperature} onChange={e => setTemperature(e.target.value)}
                      className="w-full accent-violet-500" />
                    <div className="flex justify-between text-[10px] text-[#334155] mt-1"><span>Precise</span><span>Creative</span></div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-[#64748b] mb-2 block">Max Output Tokens</label>
                    <input type="number" value={maxTokens} onChange={e => setMaxTokens(e.target.value)}
                      className="w-full bg-[#0a0a0f] border border-[rgba(139,92,246,0.15)] rounded-lg px-4 py-2.5 text-sm text-[#94a3b8] focus:outline-none focus:border-violet-500 transition-colors" />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "notifications" && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-4">Notification Preferences</h2>
              <div className="space-y-3">
                {[
                  { label: "Pipeline completed", sub: "Get notified when a build finishes", on: true },
                  { label: "Pipeline failed", sub: "Get notified when a build fails", on: true },
                  { label: "Validation warnings", sub: "Notify on schema validation issues", on: false },
                  { label: "Weekly summary", sub: "Weekly digest of your builds", on: true },
                ].map(item => (
                  <div key={item.label} className="flex items-center justify-between py-3 border-b border-[rgba(139,92,246,0.06)] last:border-0">
                    <div>
                      <div className="text-sm text-white">{item.label}</div>
                      <div className="text-[10px] text-[#475569]">{item.sub}</div>
                    </div>
                    <div className={`w-10 h-5 rounded-full transition-all cursor-pointer ${item.on ? "bg-violet-600" : "bg-[#1e1e2e]"} relative`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-all ${item.on ? "left-5" : "left-0.5"}`} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "security" && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-4">Security Settings</h2>
              <div className="space-y-4">
                <div className="p-4 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] rounded-xl">
                  <div className="text-xs font-semibold text-white mb-1">API Key Rotation</div>
                  <div className="text-[10px] text-[#475569] mb-3">Rotate your API key periodically for security</div>
                  <button className="px-3 py-1.5 bg-amber-600/20 border border-amber-500/30 text-amber-400 text-xs rounded-lg hover:bg-amber-600/30 transition-colors">
                    Rotate Key
                  </button>
                </div>
                <div className="p-4 bg-[#0a0a0f] border border-[rgba(139,92,246,0.1)] rounded-xl">
                  <div className="text-xs font-semibold text-white mb-1">Build History</div>
                  <div className="text-[10px] text-[#475569] mb-3">Clear all locally stored build history</div>
                  <button onClick={() => { localStorage.removeItem("appcompiler_recent_builds"); }}
                    className="px-3 py-1.5 bg-red-600/20 border border-red-500/30 text-red-400 text-xs rounded-lg hover:bg-red-600/30 transition-colors">
                    Clear History
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "appearance" && (
            <div>
              <h2 className="text-sm font-semibold text-white mb-4">Appearance</h2>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-3 block">Theme</label>
                  <div className="grid grid-cols-3 gap-3">
                    {["Dark", "Darker", "OLED"].map(theme => (
                      <button key={theme} className={`p-3 rounded-xl border text-xs font-medium transition-all ${theme === "Dark" ? "border-violet-500/40 bg-violet-600/10 text-violet-400" : "border-[rgba(139,92,246,0.1)] text-[#475569] hover:border-violet-500/30"}`}>
                        {theme}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-[#64748b] mb-3 block">Accent Color</label>
                  <div className="flex gap-2">
                    {["#8b5cf6", "#6366f1", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"].map(color => (
                      <button key={color} className="w-7 h-7 rounded-full border-2 border-transparent hover:border-white/30 transition-all"
                        style={{ background: color }} />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-[rgba(139,92,246,0.08)] flex justify-end">
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all ${saved ? "bg-emerald-600 text-white" : "bg-violet-600 hover:bg-violet-500 text-white"}`}>
              {saved ? <><CheckCircle className="w-4 h-4" /> Saved!</> : <><Save className="w-4 h-4" /> Save Changes</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
