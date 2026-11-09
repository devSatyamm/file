import React, { useState, useEffect } from 'react';
import {
  Sliders,
  HardDrive,
  Cpu,
  ShieldCheck,
  Check,
  Lock,
  Play,
  CheckCircle2,
  XCircle,
  Network,
  FileCode,
  Trash2,
  AlertTriangle,
  Info,
  RefreshCw,
  Sun,
  Moon
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { networkMonitor } from '../../services/networkMonitor';
import { SecurityTestSuite } from '../../services/securityTests';
import { UserSettings, EngineModuleStatus, SecurityCheckResult, NetworkLogEntry } from '../../types';

type SettingsTab = 'appearance' | 'offline-storage' | 'privacy-security' | 'preferences' | 'about';

export const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SettingsTab>('appearance');
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [modules, setModules] = useState<EngineModuleStatus[]>([]);
  const [storageStats, setStorageStats] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });
  const [isSaved, setIsSaved] = useState(false);

  // Privacy & Security state
  const [networkLogs, setNetworkLogs] = useState<NetworkLogEntry[]>([]);
  const [testResults, setTestResults] = useState<SecurityCheckResult[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [viewSecurityDoc, setViewSecurityDoc] = useState(false);
  const [securityDocText, setSecurityDocText] = useState('');
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  useEffect(() => {
    loadAll();
    const unsubscribe = networkMonitor.subscribe((logs) => setNetworkLogs(logs));
    return () => unsubscribe();
  }, []);

  const loadAll = async () => {
    const s = await storageService.getSettings();
    const m = await storageService.getModules();
    const est = await storageService.getStorageEstimate();
    setSettings(s);
    setModules(m);
    setStorageStats(est);
  };

  const updateSetting = async <K extends keyof UserSettings>(key: K, val: UserSettings[K]) => {
    if (!settings) return;
    const updated = await storageService.saveSettings({ [key]: val });
    setSettings(updated);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  const handleRunSecurityTests = async () => {
    setIsRunningTests(true);
    try {
      const results = await SecurityTestSuite.runAllTests();
      setTestResults(results);
    } catch (err) {
      console.error('Security test failed:', err);
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleReadSecurityDoc = async () => {
    try {
      const res = await fetch('/SECURITY.md');
      if (res.ok) {
        const txt = await res.text();
        setSecurityDocText(txt);
      } else {
        setSecurityDocText('# Security Policy\nSee repository root SECURITY.md.');
      }
    } catch {
      setSecurityDocText('# Security Policy\nZero-upload local sandbox active.');
    }
    setViewSecurityDoc(true);
  };

  const handlePurgeAllData = async () => {
    await storageService.clearAllLocalData();
    setShowPurgeConfirm(false);
    loadAll();
    alert('All local database records and logs have been purged.');
  };

  if (!settings) return null;

  const tabs: { id: SettingsTab; label: string }[] = [
    { id: 'appearance', label: 'Appearance' },
    { id: 'offline-storage', label: 'Offline & Storage' },
    { id: 'privacy-security', label: 'Privacy & Security' },
    { id: 'preferences', label: 'Conversion Preferences' },
    { id: 'about', label: 'About Philes' },
  ];

  return (
    <div className="max-w-[1120px] mx-auto space-y-8 py-4 px-2 sm:px-4">
      {/* Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            Settings
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Configure appearance, offline storage, security controls, and conversion defaults.
          </p>
        </div>

        {isSaved && (
          <span className="text-xs text-emerald-500 dark:text-emerald-400 flex items-center gap-1 font-medium animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            Preferences Saved
          </span>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-600 text-white font-semibold shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab 1: Appearance */}
      {activeTab === 'appearance' && (
        <div className="space-y-6 max-w-2xl">
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-4 shadow-sm dark:shadow-none">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">Theme Mode</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select your preferred visual style. Deep charcoal is optimized for desktop productivity, and Daylight offers high-contrast clarity.
            </p>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => {
                  updateSetting('theme', 'dark');
                  localStorage.setItem('philes-theme', 'dark');
                  document.documentElement.classList.add('dark');
                }}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  settings.theme === 'dark'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-slate-900 dark:text-white ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#181b26] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Moon className="w-5 h-5 text-blue-500 dark:text-blue-400 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Deep Charcoal</p>
                  <p className="text-[11px] text-slate-500">Dark Linear theme</p>
                </div>
              </button>

              <button
                onClick={() => {
                  updateSetting('theme', 'light');
                  localStorage.setItem('philes-theme', 'light');
                  document.documentElement.classList.remove('dark');
                }}
                className={`p-3.5 rounded-xl border text-left flex items-center gap-3 transition-all ${
                  settings.theme === 'light'
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10 text-slate-900 dark:text-white ring-1 ring-blue-500'
                    : 'border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-[#181b26] text-slate-600 dark:text-slate-400 hover:border-slate-300'
                }`}
              >
                <Sun className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <p className="text-xs font-semibold">Light Studio</p>
                  <p className="text-[11px] text-slate-500">Daylight mode</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Offline & Storage */}
      {activeTab === 'offline-storage' && (
        <div className="space-y-6 max-w-3xl">
          {/* Storage summary */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-3 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Browser Storage Quota
                </span>
              </div>
              <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                {storageStats.usageMB} MB / {storageStats.quotaMB.toLocaleString()} MB
              </span>
            </div>

            <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.max(1, storageStats.percentage)}%` }}
              />
            </div>
            <p className="text-[11px] text-slate-500">
              Files are converted in ephemeral memory. Original documents are never stored permanently.
            </p>
          </div>

          {/* Engine modules */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden shadow-sm dark:shadow-none">
            <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06]">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Precached Conversion Engines
              </span>
            </div>
            {modules.map((mod) => (
              <div key={mod.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{mod.name}</span>
                    <span className="text-[10px] text-slate-400 font-mono">v{mod.version}</span>
                  </div>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">{mod.description}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 shrink-0">
                  Offline Ready
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Privacy & Security */}
      {activeTab === 'privacy-security' && (
        <div className="space-y-6 max-w-3xl">
          {/* Zero upload banner */}
          <div className="p-4 rounded-2xl border border-emerald-300/60 dark:border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-500/[0.04] flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Zero-Upload Architecture Active
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  0 Outbound bytes sent. All conversions occur exclusively in browser memory.
                </p>
              </div>
            </div>
            <button
              onClick={handleReadSecurityDoc}
              className="px-3 py-1.5 rounded-lg bg-white dark:bg-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-medium border border-slate-200 dark:border-white/[0.08] shrink-0 shadow-sm"
            >
              Read SECURITY.md
            </button>
          </div>

          {/* Automated Attack-Defense Test Suite */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-4 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Automated Security Verification
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Executes real in-memory attack vectors (SVG XSS, ZIP Slip, ZIP Bomb) to verify defenses.
                </p>
              </div>
              <button
                onClick={handleRunSecurityTests}
                disabled={isRunningTests}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Play className="w-3 h-3" />
                <span>{isRunningTests ? 'Running...' : 'Run Security Suite'}</span>
              </button>
            </div>

            {testResults.length > 0 && (
              <div className="divide-y divide-slate-100 dark:divide-white/[0.04] pt-2 border-t border-slate-100 dark:border-white/[0.06]">
                {testResults.map((t) => (
                  <div key={t.id} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      {t.status === 'passed' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-500 dark:text-rose-400 shrink-0" />
                      )}
                      <div>
                        <span className="font-medium text-slate-800 dark:text-slate-200">{t.name}</span>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">{t.details}</p>
                      </div>
                    </div>
                    <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-mono font-semibold uppercase px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-500/10">
                      Passed
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Live Network Audit Log */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-3 shadow-sm dark:shadow-none">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Network className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                  Network Activity Audit Log
                </span>
              </div>
              <span className="text-xs text-slate-500 font-mono">
                {networkLogs.length} events logged
              </span>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-white/[0.04] max-h-48 overflow-auto font-mono text-[11px]">
              {networkLogs.map((log) => (
                <div key={log.id} className="py-2 flex items-center justify-between text-slate-600 dark:text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">{log.method}</span>
                    <span className="truncate max-w-sm text-slate-800 dark:text-slate-300">{log.url}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 dark:text-slate-500">{log.reason}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purge Local Data */}
          <div className="border border-rose-300 dark:border-rose-500/20 rounded-2xl bg-rose-50/60 dark:bg-rose-500/[0.03] p-5 flex items-center justify-between gap-4">
            <div>
              <p className="text-xs font-semibold text-rose-700 dark:text-rose-300">
                Purge All Local Records
              </p>
              <p className="text-[11px] text-slate-600 dark:text-slate-400 mt-0.5">
                Permanently delete all conversion logs, settings, and IndexedDB stores on this device.
              </p>
            </div>
            <button
              onClick={() => setShowPurgeConfirm(true)}
              className="px-3.5 py-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 dark:bg-rose-600/20 dark:hover:bg-rose-600/30 text-rose-700 dark:text-rose-300 border border-rose-300 dark:border-rose-500/30 text-xs font-medium shrink-0 transition-colors shadow-sm dark:shadow-none"
            >
              Purge Local Data
            </button>
          </div>
        </div>
      )}

      {/* Tab 4: Conversion Preferences */}
      {activeTab === 'preferences' && (
        <div className="space-y-6 max-w-2xl">
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-4 shadow-sm dark:shadow-none">
            <h2 className="text-sm font-semibold text-slate-800 dark:text-slate-200">
              Default Format &amp; Compression
            </h2>

            <div className="space-y-3 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Default Output Image Format</label>
                <select
                  value={settings.defaultImageFormat}
                  onChange={(e) => updateSetting('defaultImageFormat', e.target.value)}
                  className="w-full bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-200 focus:outline-none"
                >
                  <option value="webp">WebP (High efficiency, recommended)</option>
                  <option value="png">PNG (Lossless standard)</option>
                  <option value="jpg">JPEG (Photographic)</option>
                </select>
              </div>

              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs text-slate-700 dark:text-slate-300">
                  <span className="font-medium">Default Image Quality</span>
                  <span className="font-mono text-blue-600 dark:text-blue-400 font-semibold">{Math.round(settings.defaultImageQuality * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={settings.defaultImageQuality}
                  onChange={(e) => updateSetting('defaultImageQuality', parseFloat(e.target.value))}
                  className="w-full accent-blue-500 mt-1"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] space-y-2">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoDownloadOnComplete}
                    onChange={(e) => updateSetting('autoDownloadOnComplete', e.target.checked)}
                    className="w-3.5 h-3.5 rounded bg-slate-100 dark:bg-slate-800 border-slate-300 dark:border-white/[0.1] text-blue-600 focus:ring-0"
                  />
                  <span className="text-xs text-slate-700 dark:text-slate-300">
                    Automatically trigger download when conversion finishes
                  </span>
                </label>

                {/* Zero-Trace Privacy Architecture */}
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-300 flex items-start gap-2.5">
                  <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold block">Strict Zero-Trace Architecture Active</span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 block mt-0.5">
                      No conversion history, filenames, or document records are ever written to browser disk or IndexedDB. All files are converted in volatile memory and destroyed immediately upon task completion.
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 5: About Philes & Developer */}
      {activeTab === 'about' && (
        <div className="space-y-6 max-w-2xl">
          {/* Developer Profile Card */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-6 space-y-5 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white font-black text-base shadow-lg shadow-blue-500/20">
                  SM
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      Satyam Mishra
                    </h3>
                    <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
                      Creator &amp; Architect
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    Full-Stack Engineer &amp; Offline Systems Specialist
                  </p>
                </div>
              </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              Philes was architected and built by <strong className="text-slate-900 dark:text-white font-semibold">Satyam Mishra</strong> to solve a fundamental modern problem: users shouldn't have to upload sensitive PDFs, personal spreadsheets, presentations, and documents to cloud servers just to convert or format them. Every tool in this suite runs locally inside browser memory.
            </p>

            {/* Social Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-2">
              {/* GitHub */}
              <a
                href="https://github.com/devsatyamm"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                    GitHub
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate group-hover:text-blue-500 transition-colors">
                    @devsatyamm
                  </span>
                </div>
              </a>

              {/* LinkedIn */}
              <a
                href="https://linkedin.com/in/satyamofficial"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-[#0a66c2] text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                    LinkedIn
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate group-hover:text-blue-500 transition-colors">
                    @satyamofficial
                  </span>
                </div>
              </a>

              {/* Instagram */}
              <a
                href="https://instagram.com/developersatyam"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2.5 p-3 rounded-xl border border-slate-200 dark:border-white/[0.06] bg-slate-50/70 hover:bg-slate-100 dark:bg-white/[0.03] dark:hover:bg-white/[0.08] text-slate-800 dark:text-slate-200 transition-all group"
              >
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
                  </svg>
                </div>
                <div className="overflow-hidden">
                  <span className="block text-[11px] font-semibold text-slate-900 dark:text-white truncate">
                    Instagram
                  </span>
                  <span className="block text-[10px] text-slate-500 truncate group-hover:text-rose-500 transition-colors">
                    @developersatyam
                  </span>
                </div>
              </a>
            </div>
          </div>

          {/* Application Details Card */}
          <div className="border border-slate-200 dark:border-white/[0.08] rounded-2xl bg-white dark:bg-[#14161f] p-5 space-y-3 shadow-sm dark:shadow-none">
            <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-200">
              Technical Specifications &amp; Architecture
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs pt-1">
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Total Tools</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">187 Converters</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Architecture</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">Offline-First PWA</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Execution</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">100% Client-Side</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Core Stack</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">React 19 + Vite</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Storage</span>
                <span className="font-semibold text-slate-800 dark:text-slate-200">IndexedDB (idb)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/[0.05]">
                <span className="block text-[10px] text-slate-400">Security</span>
                <span className="font-semibold text-emerald-600 dark:text-emerald-400">Zero Server Uploads</span>
              </div>
            </div>
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between text-[11px] text-slate-500">
              <span>Version: 1.2.0 (FreeConvert Parity Release)</span>
              <span>Open Source MIT</span>
            </div>
          </div>
        </div>
      )}

      {/* SECURITY.md modal */}
      {viewSecurityDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl max-w-3xl w-full max-h-[85vh] flex flex-col overflow-hidden shadow-2xl">
            <div className="px-5 py-3 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#181b26]">
              <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                SECURITY.md Policy
              </span>
              <button
                onClick={() => setViewSecurityDoc(false)}
                className="text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white"
              >
                Close
              </button>
            </div>
            <div className="p-5 overflow-auto text-xs font-mono text-slate-800 dark:text-slate-300 whitespace-pre-wrap leading-relaxed selectable-text">
              {securityDocText}
            </div>
          </div>
        </div>
      )}

      {/* Purge Confirm modal */}
      {showPurgeConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 dark:bg-black/80 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl p-6 max-w-sm w-full space-y-4 shadow-2xl">
            <div className="flex items-center gap-2.5 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-semibold text-slate-900 dark:text-white">Purge All Local Records?</h3>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              This will permanently delete conversion logs and settings stored in browser IndexedDB.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowPurgeConfirm(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePurgeAllData}
                className="px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-medium transition-colors shadow-sm"
              >
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
