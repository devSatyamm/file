import React, { useState, useEffect } from 'react';
import {
  Trash2,
  HardDrive,
  RefreshCw,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { storageService } from '../../services/storageService';

export const FileManager: React.FC = () => {
  const [storageStats, setStorageStats] = useState<{ usageMB: number; quotaMB: number; percentage: number }>({
    usageMB: 0,
    quotaMB: 0,
    percentage: 0,
  });
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  useEffect(() => {
    loadStorage();
  }, []);

  const loadStorage = async () => {
    const stats = await storageService.getStorageEstimate();
    setStorageStats(stats);
  };

  const handleClearAllData = async () => {
    await storageService.clearAllLocalData();
    setShowClearConfirm(false);
    loadStorage();
    alert('All local database records, preferences, and cached buffers have been completely purged.');
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            Storage &amp; Privacy Inspector
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Zero-Trace Sandbox: Verify local data usage and purge all browser-cached state.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowClearConfirm(true)}
            className="px-3.5 py-1.5 rounded-xl bg-rose-600/20 hover:bg-rose-600/30 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-colors flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Purge All Local State</span>
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
            onClick={loadStorage}
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
            FileForge processes files in volatile in-memory buffers only. No files, logs, or past records are kept on disk.
          </p>
        </div>
      </div>

      {/* Zero Trace Security Guarantee */}
      <div className="p-6 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-3">
        <div className="flex items-center gap-2.5 text-emerald-400">
          <ShieldCheck className="w-5 h-5" />
          <h3 className="text-sm font-semibold text-white">Strict Zero-Trace Architecture</h3>
        </div>
        <p className="text-xs text-slate-300 leading-relaxed">
          FileForge operates in pure ephemeral RAM mode. When conversion jobs finish, all document memory is garbage-collected. No conversion history, filenames, metadata, or traces remain in IndexedDB or localStorage.
        </p>
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
              This will reset all user preferences and wipe any cached buffers.
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

