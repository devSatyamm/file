import React, { useState, useRef, useEffect } from 'react';
import {
  UploadCloud,
  FileImage,
  FileText,
  FileSpreadsheet,
  Archive,
  Music,
  Code2,
  Presentation,
  CheckCircle2,
  Download,
  Trash2,
  Eye,
  Sparkles,
  Sliders,
  XCircle,
  ShieldAlert,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Layers,
  ShieldCheck,
  Search
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { detectFile } from '../../services/fileDetector';
import { ConversionRegistry } from '../../services/conversionRegistry';
import { ArchiveService } from '../../services/archiveService';
import { TOOLS_CATALOG, ToolDefinition } from '../../services/toolsCatalog';
import { ConversionTask } from '../../types';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { ToolCard } from '../tools/ToolCard';
import { ImagesToPdfStudio } from '../image/ImagesToPdfStudio';

interface HomePageProps {
  onNavigate: (tab: string, subTab?: string, initialTargetFormat?: string) => void;
  presetTargetFormat?: string | null;
}

export const HomePage: React.FC<HomePageProps> = ({ onNavigate, presetTargetFormat }) => {
  const [tasks, setTasks] = useState<ConversionTask[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const [previewTarget, setPreviewTarget] = useState<{ fileName: string; blob?: Blob; mimeType?: string } | null>(null);
  const [imageQuality, setImageQuality] = useState<number>(0.85);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(presetTargetFormat || null);
  const [acceptTypes, setAcceptTypes] = useState<string>('*/*');
  const [toolCategory, setToolCategory] = useState<string>('popular');
  const [toolSearch, setToolSearch] = useState<string>('');
  const [studioFiles, setStudioFiles] = useState<File[] | null>(null);
  const [studioModeActive, setStudioModeActive] = useState<boolean>(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (presetTargetFormat) {
      setSelectedTarget(presetTargetFormat);
    }
  }, [presetTargetFormat]);

  const categories = [
    { id: 'popular', label: 'Popular' },
    { id: 'all', label: `All Tools (${TOOLS_CATALOG.length})` },
    { id: 'convertToPdf', label: 'Convert to PDF' },
    { id: 'convertFromPdf', label: 'Convert from PDF' },
    { id: 'pdf', label: 'PDF Tools' },
    { id: 'image', label: 'Image Converters' },
    { id: 'video', label: 'Video Converters' },
    { id: 'audio', label: 'Audio Converters' },
    { id: 'document', label: 'Documents & E-Books' },
    { id: 'spreadsheet', label: 'Spreadsheets & Data' },
    { id: 'archive', label: 'Archives & ZIP' },
    { id: 'compressor', label: 'Compressors' },
    { id: 'utility', label: 'Editing & Utilities' },
    { id: 'unit', label: 'Unit Converters' },
    { id: 'developer', label: 'Developer Tools' },
  ];

  const filteredTools = TOOLS_CATALOG.filter((tool) => {
    const matchesCategory =
      toolCategory === 'all' ||
      tool.category === toolCategory ||
      (toolCategory === 'popular' && tool.category === 'popular') ||
      (toolCategory === 'pdf' && (tool.category === 'popular' && tool.id.includes('pdf')));
    const matchesSearch =
      tool.name.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.description.toLowerCase().includes(toolSearch.toLowerCase()) ||
      tool.categoryLabel.toLowerCase().includes(toolSearch.toLowerCase()) ||
      (tool.targetFormat && tool.targetFormat.toLowerCase().includes(toolSearch.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const addFiles = async (files: File[]) => {
    if (files.length === 0) return;

    const imageExts = ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif', 'bmp', 'tiff'];
    const areAllImages = files.every((f) => {
      const ext = f.name.split('.').pop()?.toLowerCase() || '';
      return f.type.startsWith('image/') || imageExts.includes(ext);
    });

    const isPdfTarget = selectedTarget === 'pdf' || presetTargetFormat === 'pdf';

    // If all files are images and target is PDF, or studioMode was clicked, or multiple images were dropped:
    if (areAllImages && (isPdfTarget || studioModeActive || files.length >= 2 && !selectedTarget)) {
      setStudioFiles(files);
      return;
    }

    const newTasks: ConversionTask[] = [];

    for (const file of files) {
      const fileInfo = await detectFile(file);
      const supportedOptions = ConversionRegistry.getTargetOptions(fileInfo.detectedFormat);
      
      const desiredTarget = selectedTarget || presetTargetFormat;
      let target = desiredTarget && supportedOptions.some((o) => o.targetFormat === desiredTarget)
        ? desiredTarget
        : supportedOptions.length > 0
        ? supportedOptions[0].targetFormat
        : '';

      newTasks.push({
        id: Math.random().toString(36).substring(2, 9),
        fileInfo,
        targetFormat: target,
        status: 'idle',
        progress: 0,
        settings: { quality: imageQuality },
      });
    }

    setTasks((prev) => [...prev, ...newTasks]);
  };

  const moveTask = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= tasks.length) return;
    setTasks((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
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

  const clearAll = () => {
    setTasks([]);
  };

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
        { ...task.settings, quality: imageQuality },
        (progress) => {
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

  const runAllConversions = async () => {
    setIsProcessingAll(true);
    const idleTasks = tasks.filter((t) => t.status === 'idle' || t.status === 'error');

    for (const task of idleTasks) {
      await runConversion(task);
    }

    setIsProcessingAll(false);
    confetti({
      particleCount: 60,
      spread: 50,
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
    a.download = `Philes_Batch_${new Date().toISOString().slice(0, 10)}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
    });
  };

  const handleToolCardClick = (tool: ToolDefinition) => {
    if (tool.viewTarget === 'pdf-tools') {
      onNavigate('pdf-tools', tool.viewSubTab);
    } else if (tool.viewTarget === 'devtools') {
      onNavigate('devtools', tool.viewSubTab);
    } else if (tool.viewTarget === 'archive') {
      onNavigate('archive', tool.viewSubTab);
    } else {
      // Home / Direct file conversion
      if (
        tool.id === 'jpg-to-pdf' ||
        tool.id === 'png-to-pdf' ||
        tool.id === 'webp-to-pdf' ||
        tool.id === 'svg-to-pdf'
      ) {
        setStudioModeActive(true);
        setSelectedTarget('pdf');
        setAcceptTypes('image/*,.jpg,.jpeg,.png,.webp,.svg');
        setTimeout(() => {
          fileInputRef.current?.click();
        }, 50);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      setStudioModeActive(false);
      if (tool.acceptTypes) {
        setAcceptTypes(tool.acceptTypes);
      } else {
        setAcceptTypes('*/*');
      }
      if (tool.targetFormat) {
        setSelectedTarget(tool.targetFormat);
      }
      // Trigger file picker directly
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 50);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const completedCount = tasks.filter((t) => t.status === 'completed').length;
  const pendingCount = tasks.filter((t) => t.status === 'idle' || t.status === 'processing').length;

  return (
    <div className="max-w-[1240px] mx-auto space-y-12 py-6 px-3 sm:px-6">
      {/* SECTION B: MAIN UPLOAD AREA */}
      <section className="space-y-6">
        {/* Headings */}
        <div className="text-center space-y-2 pt-2">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-800 dark:text-slate-100">
            Everything you need to work with files.
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 max-w-lg mx-auto leading-relaxed">
            Convert, compress, organize and transform your files. Right on your device.
          </p>
        </div>

        {/* Main Workspace: If Studio is active, show ImagesToPdfStudio, otherwise Upload Drop Area */}
        {studioFiles && studioFiles.length > 0 ? (
          <ImagesToPdfStudio
            initialFiles={studioFiles}
            onClose={() => {
              setStudioFiles(null);
              setStudioModeActive(false);
            }}
          />
        ) : (
          <div
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`relative rounded-2xl border transition-all p-10 sm:p-14 text-center flex flex-col items-center justify-center cursor-pointer shadow-sm dark:shadow-none ${
              isDragging
                ? 'border-blue-500 bg-blue-50/80 dark:bg-blue-500/[0.12]'
                : 'border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-xl hover:border-slate-300 dark:hover:border-white/[0.16] hover:bg-white/80 dark:hover:bg-[#0f1320]/75'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              accept={acceptTypes}
              multiple
              onChange={(e) => e.target.files && addFiles(Array.from(e.target.files))}
              className="hidden"
            />

            <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-4 shadow-sm">
              <UploadCloud className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <p className="text-base sm:text-lg font-bold text-slate-800 dark:text-slate-200">
                Drop your files here
              </p>
              <p className="text-xs sm:text-sm text-blue-600 dark:text-blue-400 font-medium">
                or browse your device
              </p>
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500 mt-4 max-w-md">
              PDF, DOCX, XLSX, PPTX, PNG, JPG, WEBP, SVG, CSV, ZIP and more.
            </p>
          </div>
        )}

        {/* Quiet Privacy Statement */}
        <p className="text-center text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-emerald-500 dark:text-emerald-400" />
          <span>Your files stay on your device. Processing happens 100% locally in browser memory.</span>
        </p>

        {/* Active Upload Queue (if any files added) */}
        {tasks.length > 0 && (
          <div className="mt-8 space-y-4 rounded-2xl border border-slate-200/80 dark:border-white/[0.08] bg-white/70 dark:bg-[#0c0f18]/65 backdrop-blur-xl p-4 sm:p-5 shadow-sm dark:shadow-none animate-in fade-in">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Uploaded Files ({tasks.length})
                </span>
                <span className="text-[11px] text-slate-400">
                  • Automatic format detected
                </span>
              </div>

              <div className="flex items-center gap-2">
                {completedCount > 1 && (
                  <button
                    onClick={handleDownloadAllAsZip}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download All as ZIP</span>
                  </button>
                )}

                {pendingCount > 0 && (
                  <button
                    onClick={runAllConversions}
                    disabled={isProcessingAll}
                    className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isProcessingAll ? 'Converting...' : `Convert All (${pendingCount})`}</span>
                  </button>
                )}

                <button
                  onClick={clearAll}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
                  title="Clear list"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* If 2+ image tasks are in queue, offer 1-click studio to merge into 1 PDF */}
            {tasks.filter((t) => ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif'].includes(t.fileInfo.detectedFormat)).length >= 2 && (
              <div className="p-3.5 rounded-xl bg-blue-50/90 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold shrink-0 shadow-sm">
                    <Layers className="w-4 h-4" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-slate-100">
                      Combine images into 1 multi-page PDF?
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">
                      Preview thumbnails, rotate 90°, reorder pages &amp; merge into a single PDF document.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    const imgFiles = tasks
                      .filter((t) => ['png', 'jpg', 'jpeg', 'webp', 'svg', 'bmp', 'gif'].includes(t.fileInfo.detectedFormat))
                      .map((t) => t.fileInfo.file);
                    setStudioFiles(imgFiles);
                  }}
                  className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shrink-0 shadow-sm transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Open in PDF Studio</span>
                </button>
              </div>
            )}

            {/* Tasks list */}
            <div className="space-y-2.5">
              {tasks.map((task, idx) => {
                const options = ConversionRegistry.getTargetOptions(task.fileInfo.detectedFormat);
                const isMismatch = task.fileInfo.isMismatched;

                return (
                  <div
                    key={task.id}
                    className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#181b26] border border-slate-200/80 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {tasks.length > 1 && (
                        <div className="flex items-center bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] rounded-md overflow-hidden shrink-0 shadow-sm">
                          <button
                            type="button"
                            onClick={() => moveTask(idx, -1)}
                            disabled={idx === 0}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-20"
                            title="Move up"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/[0.08]" />
                          <button
                            type="button"
                            onClick={() => moveTask(idx, 1)}
                            disabled={idx === tasks.length - 1}
                            className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 disabled:opacity-20"
                            title="Move down"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>
                        </div>
                      )}

                      <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-500/20 flex items-center justify-center font-mono font-bold uppercase text-[11px] shrink-0">
                        {task.fileInfo.detectedFormat}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">{task.fileInfo.name}</span>
                          <span className="text-[10px] text-slate-500 font-mono">
                            {(task.fileInfo.size / 1024).toFixed(1)} KB
                          </span>
                          {isMismatch && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-500/25 flex items-center gap-1">
                              <ShieldAlert className="w-2.5 h-2.5" />
                              Detected as {task.fileInfo.detectedFormat.toUpperCase()}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-400 dark:text-slate-500 font-mono mt-0.5">
                          Magic: {task.fileInfo.magicBytesHex}
                        </p>
                      </div>
                    </div>

                    {/* Actions & Target */}
                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                      {task.status !== 'completed' ? (
                        <>
                          <div className="flex items-center gap-1.5">
                            <span className="text-slate-500 dark:text-slate-400 text-[11px]">to:</span>
                            <select
                              value={task.targetFormat}
                              onChange={(e) => handleTargetChange(task.id, e.target.value)}
                              disabled={task.status === 'processing' || options.length === 0}
                              className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1 text-xs text-slate-800 dark:text-slate-200 focus:outline-none shadow-sm dark:shadow-none"
                            >
                              {options.length === 0 ? (
                                <option value="">No targets</option>
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
                            className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-medium text-xs shadow-sm transition-colors"
                          >
                            {task.status === 'processing' ? 'Converting...' : 'Convert'}
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
                            className="px-3 py-1.5 rounded-lg bg-slate-200/80 dark:bg-white/[0.06] hover:bg-slate-300 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 font-medium text-xs flex items-center gap-1 transition-colors"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Preview</span>
                          </button>

                          <button
                            onClick={() => handleDownload(task)}
                            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs flex items-center gap-1 shadow-sm transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>
                      )}

                      <button
                        onClick={() => removeTask(task.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 dark:hover:text-rose-400 hover:bg-slate-200/50 dark:hover:bg-white/[0.05]"
                        title="Remove"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* SECTION C: BROWSE BY FILE TYPE (CARDS GRID MATCHING REFERENCE IMAGE) */}
      <section className="space-y-6 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-800 dark:text-slate-100">
              Browse by file type
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Choose what you want to work with.
            </p>
          </div>

          {/* Quick Search inside Tools */}
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={toolSearch}
              onChange={(e) => setToolSearch(e.target.value)}
              placeholder="Search tools..."
              className="w-full h-8 pl-8 pr-3 bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md border border-slate-200/80 dark:border-white/[0.08] focus:border-blue-500/50 rounded-xl text-xs text-slate-800 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none shadow-sm dark:shadow-none transition-colors"
            />
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pb-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setToolCategory(cat.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                toolCategory === cat.id
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-white/80 dark:hover:bg-white/[0.06] border border-slate-200/80 dark:border-white/[0.06]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* The 5-Column Cards Grid */}
        {filteredTools.length === 0 ? (
          <div className="p-14 text-center text-xs text-slate-500 bg-white/70 dark:bg-[#0c0f18]/60 backdrop-blur-md rounded-2xl border border-slate-200/80 dark:border-white/[0.08]">
            No tools found matching &quot;{toolSearch}&quot;.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 sm:gap-5">
            {filteredTools.map((tool) => (
              <ToolCard key={tool.id} tool={tool} onClick={handleToolCardClick} />
            ))}
          </div>
        )}
      </section>

      {/* Sandboxed File Preview Modal */}
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
