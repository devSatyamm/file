import React, { useState, useEffect } from 'react';
import {
  FolderClock,
  Trash2,
  HardDrive,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  ShieldCheck,
  FileText
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { HistoryItem } from '../../types';

export const FileManager: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [storageStats, setStorageStats] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadHistoryAndStorage();
  }, []);

  const loadHistoryAndStorage = async () => {
    const items = await storageService.getHistory(100);
    const stats = await storageService.getStorageEstimate();
    setHistory(items);
    setStorageStats(stats);
  };

  const handleDeleteItem = async (id: string) => {
    await storageService.deleteHistoryItem(id);
    loadHistoryAndStorage();
  };

  const handleClearHistory = async () => {
    await storageService.clearHistory();
    loadHistoryAndStorage();
  };

  const handleClearAllData = async () => {
    await storageService.clearAllLocalData();
    setShowClearConfirm(false);
    loadHistoryAndStorage();
    alert('All local database records and cached data have been purged.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            File Manager &amp; History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Audit conversion records, review storage allocation, and manage local data retention.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium border border-white/[0.08] transition-colors"
            >
              Clear Log History
            </button>
          )}

          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Local Data</span>
          </button>
        </div>
      </div>

      {/* Storage Information Card */}
      <div className="p-6 rounded-2xl bg-[#12141c] border border-white/[0.08] space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-200">Device Storage Quota &amp; Cache</h3>
              <p className="text-xs text-slate-400">Browser IndexedDB and Service Worker cache allocation</p>
            </div>
          </div>
          <button
            onClick={loadHistoryAndStorage}
            className="p-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-400 hover:text-white transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between text-xs text-slate-300">
            <span>Used: <strong className="text-white">{storageStats.usageMB} MB</strong></span>
            <span>Allocated Quota: <strong className="text-white">{storageStats.quotaMB.toLocaleString()} MB</strong></span>
          </div>
          <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-500 rounded-full"
              style={{ width: `${Math.max(1, storageStats.percentage)}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            FileForge processes files in ephemeral memory buffers. Original documents are never stored permanently unless exported.
          </p>
        </div>
      </div>

      {/* Conversion History Table */}
      <div className="rounded-2xl border border-white/[0.08] bg-[#12141c] overflow-hidden">
        <div className="px-5 py-3.5 border-b border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Recent Conversion Records ({history.length})
          </span>
          <span className="text-xs text-slate-500">Stored strictly in browser IndexedDB</span>
        </div>

        {history.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs">
            No conversion history logged yet.
          </div>
        ) : (
          <div className="divide-y divide-white/[0.04]">
            {history.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors text-xs">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400 font-bold uppercase text-[11px]">
                    {item.targetFormat.replace('pdf_', '')}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-200">{item.fileName}</span>
                    <div className="flex items-center gap-2 text-slate-400 text-[11px] mt-0.5">
                      <span className="uppercase text-slate-500 font-mono">{item.originalFormat}</span>
                      <span>&rarr;</span>
                      <span className="uppercase text-blue-400 font-mono">{item.targetFormat}</span>
                      <span>•</span>
                      <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                      <span>•</span>
                      <span>{item.durationMs}ms</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="text-slate-400 font-mono text-[11px]">
                    {new Date(item.timestamp).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="text-slate-400 hover:text-rose-400 transition-colors"
                    title="Delete log"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Confirmation Modal for Purge All */}
      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12141c] border border-white/[0.1] rounded-2xl p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-semibold text-white">Purge All Local Data?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This will permanently delete all conversion logs, saved preferences, and reset local database stores. Cached PWA application assets will remain for offline use.
            </p>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-300 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAllData}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md"
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

