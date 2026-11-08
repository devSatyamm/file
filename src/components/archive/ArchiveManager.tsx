import React, { useState } from 'react';
import {
  Archive,
  UploadCloud,
  FileCheck,
  ShieldCheck,
  ShieldAlert,
  Download,
  Trash2,
  FolderOpen,
  Sparkles,
  FileText,
  AlertTriangle,
  Plus,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { ArchiveService, ArchiveInspectionResult, ArchiveEntryInfo } from '../../services/archiveService';

interface ArchiveManagerProps {
  initialTab?: 'inspect' | 'create';
}

export const ArchiveManager: React.FC<ArchiveManagerProps> = ({ initialTab = 'inspect' }) => {
  const [activeSubTab, setActiveSubTab] = useState<'inspect' | 'create'>(initialTab);

  React.useEffect(() => {
    if (initialTab) {
      setActiveSubTab(initialTab);
    }
  }, [initialTab]);
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [inspection, setInspection] = useState<ArchiveInspectionResult | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  // Create ZIP state
  const [createFiles, setCreateFiles] = useState<{ name: string; blob: Blob }[]>([]);
  const [compressionLevel, setCompressionLevel] = useState(6);
  const [isCompressing, setIsCompressing] = useState(false);
  const [createdZipBlob, setCreatedZipBlob] = useState<Blob | null>(null);

  const handleZipUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setZipFile(file);
      setIsScanning(true);
      try {
        const result = await ArchiveService.inspectZip(file);
        setInspection(result);
      } catch (err: any) {
        alert(`Failed to inspect ZIP: ${err.message}`);
      } finally {
        setIsScanning(false);
      }
    }
  };

  const handleExtractSingle = async (entry: ArchiveEntryInfo) => {
    if (!zipFile || !entry.isSafe) return;
    try {
      const blob = await ArchiveService.extractFile(zipFile, entry.name);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = entry.name.split('/').pop() || 'extracted_file';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      alert(`Extraction failed: ${err.message}`);
    }
  };

  const handleExtractAll = async () => {
    if (!zipFile || !inspection) return;
    try {
      const safeBlobs = await ArchiveService.extractAllSafeFiles(zipFile);
      for (const item of safeBlobs) {
        const url = URL.createObjectURL(item.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name.split('/').pop() || item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      alert(`Batch extraction failed: ${err.message}`);
    }
  };

  const handleAddCreateFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const added = Array.from(e.target.files).map((f) => ({ name: f.name, blob: f }));
      setCreateFiles((prev) => [...prev, ...added]);
    }
  };

  const moveCreateFile = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= createFiles.length) return;
    setCreateFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleBuildZip = async () => {
    if (createFiles.length === 0) return;
    setIsCompressing(true);
    try {
      const blob = await ArchiveService.createZip(createFiles, compressionLevel);
      setCreatedZipBlob(blob);
    } catch (err: any) {
      alert(`Failed to create ZIP: ${err.message}`);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleDownloadCreatedZip = () => {
    if (!createdZipBlob) return;
    const url = URL.createObjectURL(createdZipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `archive_${Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-[1120px] mx-auto pb-16">
      {/* Title */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100 flex items-center gap-2">
          Archive Manager
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Inspect, decompress, and package archives with automated ZIP Slip and ZIP Bomb defenses.
        </p>
      </div>

      {/* Mode Tabs */}
      <div className="flex items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        <button
          onClick={() => setActiveSubTab('inspect')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeSubTab === 'inspect'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.06]'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Inspect &amp; Extract ZIP</span>
        </button>
        <button
          onClick={() => setActiveSubTab('create')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            activeSubTab === 'create'
              ? 'bg-blue-600 text-white font-semibold shadow-sm'
              : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 border border-slate-200 dark:border-white/[0.06]'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>Create New ZIP</span>
        </button>
      </div>

      {/* Inspect & Extract */}
      {activeSubTab === 'inspect' && (
        <div className="space-y-5">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] text-center shadow-sm dark:shadow-none">
            <input
              type="file"
              id="zip-inspect-file"
              accept=".zip,application/zip"
              onChange={handleZipUpload}
              className="hidden"
            />
            <label htmlFor="zip-inspect-file" className="cursor-pointer flex flex-col items-center">
              <Archive className="w-10 h-10 text-blue-500 dark:text-blue-400 mb-2" />
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Choose a ZIP archive to inspect
              </span>
              <span className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Evaluates file headers, directories, and compression ratios
              </span>
            </label>
          </div>

          {isScanning && (
            <div className="p-4 text-center text-xs text-blue-500 animate-pulse">
              Scanning archive structures and checking path security...
            </div>
          )}

          {inspection && zipFile && (
            <div className="space-y-4">
              {/* Inspection Summary Stats */}
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="p-4 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Files In Archive</span>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{inspection.totalFiles}</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Compressed Size</span>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{(inspection.compressedSize / 1024).toFixed(1)} KB</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Uncompressed Expansion</span>
                  <p className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{(inspection.totalUncompressedSize / 1024).toFixed(1)} KB</p>
                </div>
                <div className="p-4 rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.06] shadow-sm dark:shadow-none">
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Security Status</span>
                  <p className={`text-sm font-bold mt-1 flex items-center gap-1 ${
                    inspection.isSafe ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {inspection.isSafe ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
                    <span>{inspection.isSafe ? 'Safe Archive' : 'Issues Flagged'}</span>
                  </p>
                </div>
              </div>

              {/* Security Issues Alert */}
              {inspection.securityIssues.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-xs text-rose-700 dark:text-rose-300 space-y-1">
                  <span className="font-semibold flex items-center gap-1 text-rose-600 dark:text-rose-400">
                    <ShieldAlert className="w-4 h-4" />
                    Security Violations Identified:
                  </span>
                  {inspection.securityIssues.map((issue, idx) => (
                    <p key={idx}>• {issue}</p>
                  ))}
                </div>
              )}

              {/* Archive File Table */}
              <div className="rounded-2xl border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#14161f] overflow-hidden shadow-sm dark:shadow-none">
                <div className="px-5 py-3 border-b border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                    Archive Contents ({inspection.entries.length} items)
                  </span>
                  <button
                    onClick={handleExtractAll}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Extract All Safe Files</span>
                  </button>
                </div>

                <div className="divide-y divide-slate-100 dark:divide-white/[0.04] max-h-96 overflow-auto">
                  {inspection.entries.map((entry, idx) => (
                    <div key={idx} className="p-3.5 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/[0.02] text-xs">
                      <div className="flex items-center gap-3">
                        <FileText className={`w-4 h-4 ${entry.isSafe ? 'text-blue-500' : 'text-rose-500'}`} />
                        <div>
                          <p className="font-mono font-medium text-slate-800 dark:text-slate-200">{entry.name}</p>
                          {entry.securityWarning && (
                            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold">{entry.securityWarning}</p>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <span className="text-slate-400 font-mono">
                          {(entry.size / 1024).toFixed(1)} KB
                        </span>
                        {!entry.isDirectory && entry.isSafe && (
                          <button
                            onClick={() => handleExtractSingle(entry)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-300 text-xs font-medium"
                          >
                            Extract
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Create New ZIP */}
      {activeSubTab === 'create' && (
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] space-y-4 shadow-sm dark:shadow-none">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                Package Files into a Secure Compressed ZIP
              </span>
              <div className="flex items-center gap-3">
                <input
                  type="file"
                  id="create-zip-input"
                  multiple
                  onChange={handleAddCreateFiles}
                  className="hidden"
                />
                <label
                  htmlFor="create-zip-input"
                  className="px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-700 dark:text-slate-200 text-xs font-medium cursor-pointer flex items-center gap-1.5 shadow-sm"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Files</span>
                </label>
              </div>
            </div>

            {/* Compression Slider */}
            <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100 dark:border-white/[0.06]">
              <span>Compression Level (DEFLATE): Level {compressionLevel}</span>
              <input
                type="range"
                min="1"
                max="9"
                value={compressionLevel}
                onChange={(e) => setCompressionLevel(parseInt(e.target.value, 10))}
                className="w-32 accent-blue-500"
              />
            </div>

            {/* File List */}
            {createFiles.length > 0 ? (
              <div className="space-y-2 pt-2">
                <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Files to Package ({createFiles.length})
                </span>
                <div className="space-y-1.5 max-h-60 overflow-auto">
                  {createFiles.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-700 dark:text-slate-300"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="font-mono truncate">{file.name}</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {createFiles.length > 1 && (
                          <div className="flex items-center bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] rounded-md overflow-hidden mr-1">
                            <button
                              type="button"
                              onClick={() => moveCreateFile(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-25"
                              title="Move up"
                            >
                              <ArrowUp className="w-3 h-3" />
                            </button>
                            <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/[0.08]" />
                            <button
                              type="button"
                              onClick={() => moveCreateFile(idx, 1)}
                              disabled={idx === createFiles.length - 1}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-25"
                              title="Move down"
                            >
                              <ArrowDown className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => setCreateFiles((prev) => prev.filter((_, i) => i !== idx))}
                          className="p-1 text-slate-400 hover:text-rose-500"
                          title="Remove"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={handleBuildZip}
                  disabled={isCompressing}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{isCompressing ? 'Compressing Archive...' : 'Build ZIP Container'}</span>
                </button>
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-6">
                No files added yet. Click &quot;Add Files&quot; above to package an archive.
              </p>
            )}

            {createdZipBlob && (
              <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">ZIP Archive Ready</p>
                  <p className="text-[11px] text-slate-600 dark:text-slate-300">Size: {(createdZipBlob.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  onClick={handleDownloadCreatedZip}
                  className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Archive</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
