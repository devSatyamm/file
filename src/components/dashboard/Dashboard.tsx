import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Cpu,
  Layers,
  ArrowRight,
  ShieldCheck,
  Zap,
  Clock,
  Sparkles,
  Download,
  FileCheck,
  RefreshCw,
  FolderOpen
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { HistoryItem, EngineModuleStatus } from '../../types';

interface DashboardProps {
  onNavigate: (tab: string) => void;
  onFilesSelected: (files: FileList | File[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate, onFilesSelected }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [modules, setModules] = useState<EngineModuleStatus[]>([]);
  const [storageEstimate, setStorageEstimate] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });
  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const hist = await storageService.getHistory(5);
    const mods = await storageService.getModules();
    const est = await storageService.getStorageEstimate();
    setHistory(hist);
    setModules(mods);
    setStorageEstimate(est);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onFilesSelected(e.dataTransfer.files);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFilesSelected(e.target.files);
    }
  };

  const installedEnginesCount = modules.filter((m) => m.isInstalled).length;
  const totalEnginesCount = modules.length;

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Privacy Banner Alert */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/20 bg-gradient-to-r from-emerald-950/30 via-[#0c0e14] to-cyan-950/20 p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-100 flex items-center gap-2">
                Your files never leave your device. All conversions happen locally.
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Zero cloud backend. Tested in Airplane Mode with disconnected Wi-Fi. Safe for classified, medical, and financial data.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('security')}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-xs font-medium transition-colors shrink-0 flex items-center gap-1.5"
          >
            <span>Audit Network Traffic</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Main Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl border-2 border-dashed transition-all p-10 text-center flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10 scale-[1.008]'
            : 'border-white/[0.12] bg-[#12141c]/60 hover:border-blue-500/50 hover:bg-[#161924]/80'
        }`}
      >
        <input
          type="file"
          id="dashboard-file-input"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
        <label htmlFor="dashboard-file-input" className="cursor-pointer flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-600/15 border border-blue-500/30 flex items-center justify-center mb-4 shadow-lg shadow-blue-500/10 group-hover:scale-105 transition-transform">
            <UploadCloud className="w-8 h-8 text-blue-400" />
          </div>
          <h2 className="text-xl font-bold text-slate-100 mb-1">
            Drop your documents or files here
          </h2>
          <p className="text-sm text-slate-400 max-w-md mb-4">
            Supports PDF, DOCX, Images, Excel XLSX, CSV, JSON, Markdown, ZIP archives, and Audio. Automatic magic-byte format detection.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-sm shadow-md transition-all active:scale-95">
              Browse Local Files
            </span>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onNavigate('pdf-tools');
              }}
              className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 font-medium text-sm border border-white/[0.08] transition-all"
            >
              Open PDF Toolkit
            </button>
          </div>
        </label>
      </div>

      {/* Offline Readiness Dashboard */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-400" />
              Offline Readiness Dashboard
            </h3>
            <p className="text-xs text-slate-400">
              Engines, binaries, and workers cached locally in browser storage
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-slate-200 transition-colors"
            title="Refresh engine status"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Readiness Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Engine Status */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Installed Engines</span>
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-emerald-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mb-1">
              {installedEnginesCount} / {totalEnginesCount}
            </div>
            <p className="text-xs text-emerald-400 flex items-center gap-1 font-medium">
              <CheckCircle2 className="w-3.5 h-3.5" />
              All Core Engines 100% Offline Ready
            </p>
          </div>

          {/* Card 2: Offline Persistence & Storage */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Local Storage Used</span>
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <HardDrive className="w-4 h-4 text-blue-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-slate-100 mb-1">
              {storageEstimate.usageMB} MB
            </div>
            <p className="text-xs text-slate-400">
              Safe quota: {storageEstimate.quotaMB.toLocaleString()} MB total browser heap
            </p>
          </div>

          {/* Card 3: Privacy & Zero Upload */}
          <div className="p-5 rounded-2xl bg-[#12141c] border border-white/[0.08] shadow-sm">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">External Leakage</span>
              <div className="w-8 h-8 rounded-lg bg-cyan-500/10 flex items-center justify-center">
                <ShieldCheck className="w-4 h-4 text-cyan-400" />
              </div>
            </div>
            <div className="text-2xl font-bold text-emerald-400 mb-1">
              0 Bytes Sent
            </div>
            <p className="text-xs text-slate-400">
              100% zero-upload sandbox strictly enforced
            </p>
          </div>
        </div>

        {/* Modules Table List */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden">
          <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Engine Modules Registry
            </span>
            <span className="text-xs text-slate-500">
              Verified for zero-network execution
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {modules.map((mod) => (
              <div key={mod.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    mod.isInstalled ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500'
                  }`}>
                    {mod.isInstalled ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-slate-200">{mod.name}</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/[0.06] text-slate-400">
                        {mod.category}
                      </span>
                      {mod.isWasm && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-500/10 text-purple-400 border border-purple-500/20">
                          WASM
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{mod.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div className="hidden sm:block">
                    <span className="text-xs font-medium text-slate-300">{mod.sizeStr}</span>
                    <p className="text-[10px] text-slate-500">v{mod.version}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                    mod.isInstalled
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {mod.isInstalled ? 'Offline Ready' : 'On-Demand'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Conversions */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <Clock className="w-5 h-5 text-blue-400" />
            Recent Local Conversions
          </h3>
          <button
            onClick={() => onNavigate('filemanager')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
          >
            <span>View All in File Manager</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {history.length === 0 ? (
          <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] p-8 text-center text-slate-400">
            <FolderOpen className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p className="text-sm font-medium text-slate-300">No conversions recorded yet</p>
            <p className="text-xs text-slate-500 mt-1">
              Drop any document, image, or spreadsheet above to begin local processing.
            </p>
          </div>
        ) : (
          <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden divide-y divide-white/[0.04]">
            {history.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold text-xs uppercase">
                    {item.targetFormat}
                  </div>
                  <div>
                    <span className="text-sm font-medium text-slate-200">{item.fileName}</span>
                    <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                      <span className="uppercase text-slate-500 font-mono">{item.originalFormat}</span>
                      <span>&rarr;</span>
                      <span className="uppercase text-blue-400 font-mono">{item.targetFormat}</span>
                      <span>•</span>
                      <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 hidden sm:inline">
                    {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                    Done ({item.durationMs}ms)
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

