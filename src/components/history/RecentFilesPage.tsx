import React, { useState, useEffect } from 'react';
import {
  Clock,
  Trash2,
  HardDrive,
  RefreshCw,
  FileText,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { storageService } from '../../services/storageService';
import { HistoryItem } from '../../types';

export const RecentFilesPage: React.FC = () => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [storageStats, setStorageStats] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const items = await storageService.getHistory(100);
    const stats = await storageService.getStorageEstimate();
    setHistory(items);
    setStorageStats(stats);
  };

  const handleDeleteItem = async (id: string) => {
    await storageService.deleteHistoryItem(id);
    loadData();
  };

  const handleClearHistory = async () => {
    if (confirm('Clear all local conversion history records?')) {
      await storageService.clearHistory();
      loadData();
    }
  };

  return (
    <div className="max-w-[1120px] mx-auto space-y-8 py-4 px-2 sm:px-4">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
            Recent Files
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Audit logs and records of local conversions executed on this device.
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearHistory}
            className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.04] hover:bg-slate-200 dark:hover:bg-white/[0.08] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 text-xs font-medium border border-slate-200 dark:border-white/[0.06] transition-colors self-start sm:self-center"
          >
            Clear History
          </button>
        )}
      </div>

      {/* Storage Estimate Line */}
      <div className="p-4 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm dark:shadow-none">
        <div className="flex items-center gap-3">
          <HardDrive className="w-4 h-4 text-slate-400" />
          <div>
            <span className="text-xs font-medium text-slate-800 dark:text-slate-200">
              Local Storage Allocation
            </span>
            <p className="text-[11px] text-slate-500">
              {storageStats.usageMB} MB used of {storageStats.quotaMB.toLocaleString()} MB total browser quota
            </p>
          </div>
        </div>

        <div className="w-full sm:w-48 h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden self-center">
          <div
            className="h-full bg-blue-500 rounded-full"
            style={{ width: `${Math.max(1, storageStats.percentage)}%` }}
          />
        </div>
      </div>

      {/* History Table */}
      <div className="border border-slate-200 dark:border-white/[0.08] rounded-xl bg-white dark:bg-[#14161f] divide-y divide-slate-100 dark:divide-white/[0.06] overflow-hidden shadow-sm dark:shadow-none">
        {history.length === 0 ? (
          <div className="p-12 text-center text-xs text-slate-500 space-y-1">
            <Clock className="w-8 h-8 mx-auto text-slate-400 dark:text-slate-600 mb-2" />
            <p className="text-slate-700 dark:text-slate-300 font-medium">No recent conversions</p>
            <p>Conversions you run will appear here for quick inspection.</p>
          </div>
        ) : (
          history.map((item) => (
            <div
              key={item.id}
              className="p-3.5 flex items-center justify-between gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] text-xs transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-7 h-7 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 font-mono font-bold text-[10px] uppercase flex items-center justify-center shrink-0">
                  {item.targetFormat.replace('pdf_', '')}
                </div>
                <div className="min-w-0">
                  <span className="font-medium text-slate-800 dark:text-slate-200 truncate block">
                    {item.fileName}
                  </span>
                  <div className="flex items-center gap-2 text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                    <span className="uppercase text-slate-400 font-mono">{item.originalFormat}</span>
                    <span>&rarr;</span>
                    <span className="uppercase text-blue-600 dark:text-blue-400 font-mono">{item.targetFormat}</span>
                    <span>•</span>
                    <span>{(item.fileSize / 1024).toFixed(1)} KB</span>
                    <span>•</span>
                    <span>{item.durationMs}ms</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] text-slate-400 dark:text-slate-500 font-mono hidden sm:inline">
                  {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                <button
                  onClick={() => handleDeleteItem(item.id)}
                  className="p-1 rounded text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/[0.04]"
                  title="Delete record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

