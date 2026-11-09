import React, { useState, useEffect } from 'react';
import {
  UploadCloud,
  ArrowRight,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Download,
  Trash2,
  Eye,
  RefreshCw,
  Archive,
  Sparkles,
  Sliders,
  XCircle,
  ShieldAlert,
  Binary
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { detectFile, getSupportedConversions } from '../../services/fileDetector';
import { ConversionRegistry, ConversionOption } from '../../services/conversionRegistry';
import { ArchiveService } from '../../services/archiveService';
import { ConversionTask, DetectedFileInfo } from '../../types';
import { FilePreviewModal } from '../common/FilePreviewModal';

interface ConverterProps {
  queuedFiles?: FileList | File[] | null;
  onClearQueuedFiles?: () => void;
}

export const Converter: React.FC<ConverterProps> = ({ queuedFiles, onClearQueuedFiles }) => {
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ fileName: string; blob?: Blob; mimeType?: string } | null>(null);
  const [globalQuality, setGlobalQuality] = useState<number>(0.85);

  // Ingest queued files from props (e.g. from Dashboard drop)
  useEffect(() => {
    if (queuedFiles && queuedFiles.length > 0) {
      addFiles(Array.from(queuedFiles));
      onClearQueuedFiles?.();
    }
  }, [queuedFiles]);

  const addFiles = async (files: File[]) => {
    const newTasks: ConversionTask[] = [];

    for (const file of files) {
      const fileInfo = await detectFile(file);
      const supportedOptions = ConversionRegistry.getTargetOptions(fileInfo.detectedFormat);
      const defaultTarget = supportedOptions.length > 0 ? supportedOptions[0].targetFormat : '';

      newTasks.push({
        id: Math.random().toString(36).substring(2, 9),
        fileInfo,
        targetFormat: defaultTarget,
        status: 'idle',
        progress: 0,
        settings: { quality: globalQuality },
      });
    }

    setTasks((prev) => [...prev, ...newTasks]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleTargetChange = (taskId: string, newTarget: string) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === taskId ? { ...t, targetFormat: newTarget } : t))
    );
  };

  const removeTask = (taskId: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
  };

  const clearCompleted = () => {
    setTasks((prev) => prev.filter((t) => t.status !== 'completed'));
  };

  const clearAll = () => {
    setTasks([]);
  };

  // Run single conversion
  const runConversion = async (task: ConversionTask) => {
    if (!task.targetFormat) return;

    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, status: 'processing', progress: 5, error: undefined } : t))
    );

    const startTime = performance.now();

    try {
      const { blob, outputFileName } = await ConversionRegistry.executeConversion(
        task.fileInfo,
        task.targetFormat,
        { ...task.settings, quality: globalQuality },
        (progress, msg) => {
          setTasks((prev) =>
            prev.map((t) => (t.id === task.id ? { ...t, progress } : t))
          );
        }
      );

      const durationMs = Math.round(performance.now() - startTime);

      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? {
                ...t,
                status: 'completed',
                progress: 100,
                outputBlob: blob,
                outputFileName,
                outputSize: blob.size,
                completedAt: Date.now(),
              }
            : t
        )
      );

    } catch (err: any) {
      console.error('Conversion failed:', err);
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id
            ? { ...t, status: 'error', progress: 0, error: err.message || 'Conversion failed' }
            : t
        )
      );
    }
  };

  // Run all idle tasks concurrently in batches of 3
  const runAllConversions = async () => {
    setIsProcessingAll(true);
    const idleTasks = tasks.filter((t) => t.status === 'idle' || t.status === 'error');

    const BATCH_SIZE = 3;
    for (let i = 0; i < idleTasks.length; i += BATCH_SIZE) {
      const batch = idleTasks.slice(i, i + BATCH_SIZE);
      await Promise.all(batch.map((task) => runConversion(task)));
    }

    setIsProcessingAll(false);
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
    });
  };

  const handleDownload = (task: ConversionTask) => {
    if (!task.outputBlob || !task.outputFileName) return;
    const url = URL.createObjectURL(task.outputBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = task.outputFileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDownloadAllAsZip = async () => {
    const completedTasks = tasks.filter((t) => t.status === 'completed' && t.outputBlob && t.outputFileName);
    if (completedTasks.length === 0) return;

    const filesToZip = completedTasks.map((t) => ({
      name: t.outputFileName!,
      blob: t.outputBlob!,
    }));

    const zipBlob = await ArchiveService.createZip(filesToZip, 6);
    const url = URL.createObjectURL(zipBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FileForge_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    confetti({
      particleCount: 120,
      spread: 80,
      origin: { y: 0.6 },
    });
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'idle' || t.status === 'processing').length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Title & Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            Universal Offline Converter
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Detects magic bytes, validates true file formats, and converts client-side with 0% data leakage.
          </p>
        </div>

        {tasks.length > 0 && (
          <div className="flex flex-wrap items-center gap-2">
            {completedCount > 1 && (
              <button
                onClick={handleDownloadAllAsZip}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Archive className="w-3.5 h-3.5" />
                <span>Download All ({completedCount}) as ZIP</span>
              </button>
            )}

            {pendingCount > 0 && (
              <button
                onClick={runAllConversions}
                disabled={isProcessingAll}
                className="px-4 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>{isProcessingAll ? 'Converting Queue...' : `Convert All (${pendingCount})`}</span>
              </button>
            )}

            <button
              onClick={clearAll}
              className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
              title="Clear all tasks"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Global Image Quality Bar */}
      <div className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-[#12141c] border border-white/[0.06] text-xs text-slate-300">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-slate-400" />
          <span>Output Image / Canvas Quality:</span>
          <span className="font-mono text-blue-400 font-semibold">{Math.round(globalQuality * 100)}%</span>
        </div>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={globalQuality}
            onChange={(e) => setGlobalQuality(parseFloat(e.target.value))}
            className="w-32 h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>
      </div>

      {/* Upload Dropzone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-2xl transition-all p-8 text-center flex flex-col items-center justify-center cursor-pointer ${
          isDragging
            ? 'border-blue-500 bg-blue-500/10'
            : 'border-white/[0.1] bg-[#12141c]/50 hover:border-blue-500/40 hover:bg-[#161924]/60'
        }`}
      >
        <input
          type="file"
          id="converter-file-upload"
          multiple
          onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
          className="hidden"
        />
        <label htmlFor="converter-file-upload" className="cursor-pointer flex flex-col items-center">
          <UploadCloud className="w-10 h-10 text-blue-400 mb-2" />
          <span className="text-sm font-semibold text-slate-200">
            Click to add files or drag and drop
          </span>
          <span className="text-xs text-slate-400 mt-0.5">
            PDF, DOCX, Images, Excel XLSX, CSV, JSON, Markdown, Audio
          </span>
        </label>
      </div>

      {/* Task Queue List */}
      {tasks.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            <span>Conversion Queue ({tasks.length})</span>
            {completedCount > 0 && (
              <button onClick={clearCompleted} className="hover:text-slate-200">
                Clear Completed
              </button>
            )}
          </div>

          <div className="space-y-3">
            {tasks.map((task) => {
              const options = ConversionRegistry.getTargetOptions(task.fileInfo.detectedFormat);
              const isMismatch = task.fileInfo.isMismatched;

              return (
                <div
                  key={task.id}
                  className="p-4 rounded-2xl bg-[#12141c] border border-white/[0.08] hover:border-white/[0.12] transition-all space-y-3"
                >
                  {/* Top row: File details & detection */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-400 shrink-0 font-bold uppercase text-xs">
                        {task.fileInfo.detectedFormat}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-semibold text-slate-100">{task.fileInfo.name}</span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-slate-300">
                            {(task.fileInfo.size / 1024).toFixed(1)} KB
                          </span>

                          {/* Mismatch detection badge! */}
                          {isMismatch && (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                              <ShieldAlert className="w-3 h-3" />
                              Extension Mismatch: Detected as {task.fileInfo.detectedFormat.toUpperCase()}
                            </span>
                          )}
                        </div>

                        {/* Magic Bytes Inspection */}
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-1">
                          <span className="flex items-center gap-1 font-mono text-[11px] text-slate-500">
                            <Binary className="w-3 h-3" />
                            Magic: [{task.fileInfo.magicBytesHex}]
                          </span>
                          <span>•</span>
                          <span>MIME: {task.fileInfo.detectedMime}</span>
                        </div>
                      </div>
                    </div>

                    {/* Target Selector & Actions */}
                    <div className="flex flex-wrap items-center gap-2 md:justify-end">
                      {task.status !== 'completed' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-slate-400 font-medium">Convert to:</span>
                            <select
                              value={task.targetFormat}
                              onChange={(e) => handleTargetChange(task.id, e.target.value)}
                              disabled={task.status === 'processing' || options.length === 0}
                              className="bg-[#181c28] border border-white/[0.1] rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-200 focus:outline-none focus:border-blue-500"
                            >
                              {options.length === 0 ? (
                                <option value="">No conversion targets</option>
                              ) : (
                                options.map((opt) => (
                                  <option key={opt.targetFormat} value={opt.targetFormat}>
                                    {opt.label}
                                  </option>
                                ))
                              )}
                            </select>
                          </div>

                          <button
                            onClick={() => runConversion(task)}
                            disabled={task.status === 'processing' || !task.targetFormat}
                            className="px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shadow-sm transition-all active:scale-95"
                          >
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>{task.status === 'processing' ? 'Converting...' : 'Convert'}</span>
                          </button>
                        </>
                      ) : (
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              setPreviewTarget({
                                fileName: task.outputFileName!,
                                blob: task.outputBlob,
                                mimeType: task.outputBlob?.type,
                              })
                            }
                            className="px-3 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] text-slate-200 text-xs font-medium flex items-center gap-1.5 border border-white/[0.08] transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownload(task)}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all active:scale-95"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download ({((task.outputSize || 0) / 1024).toFixed(1)} KB)</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-white/[0.04] transition-colors"
                        title="Remove file"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar & Status */}
                  {task.status === 'processing' && (
                    <div className="space-y-1.5 pt-1">
                      <div className="flex items-center justify-between text-xs text-blue-400">
                        <span>Converting locally in browser memory...</span>
                        <span>{task.progress}%</span>
                      </div>
                      <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                        <div
                          className="h-full bg-blue-500 transition-all duration-300 rounded-full"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Notification */}
                  {task.status === 'error' && (
                    <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-center gap-2">
                      <XCircle className="w-4 h-4 shrink-0 text-rose-400" />
                      <span>{task.error || 'Conversion error occurred'}</span>
                      <button
                        onClick={() => runConversion(task)}
                        className="ml-auto underline hover:text-white"
                      >
                        Retry
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* File Preview Modal */}
      {previewTarget && (
        <FilePreviewModal
          isOpen={true}
          onClose={() => setPreviewTarget(null)}
          fileName={previewTarget.fileName}
          blob={previewTarget.blob}
          mimeType={previewTarget.mimeType}
        />
      )}
    </div>
  );
};

