import React, { useState } from 'react';
import {
  FileText,
  Layers,
  Scissors,
  RotateCw,
  Stamp,
  Hash,
  Download,
  Trash2,
  Sparkles,
  UploadCloud,
  Eye,
  CheckCircle2,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  Minimize2
} from 'lucide-react';
import { PdfToolkitService } from '../../services/pdfToolkitService';
import { FilePreviewModal } from '../common/FilePreviewModal';
import { storageService } from '../../services/storageService';

export type PdfToolMode = 'merge' | 'split' | 'compress' | 'rotate' | 'delete' | 'watermark' | 'numbers';

interface PdfToolkitProps {
  initialMode?: PdfToolMode;
}

export const PdfToolkit: React.FC<PdfToolkitProps> = ({ initialMode = 'merge' }) => {
  const [mode, setMode] = useState<PdfToolMode>(initialMode);

  React.useEffect(() => {
    if (initialMode) {
      setMode(initialMode);
    }
  }, [initialMode]);

  const [files, setFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progressMsg, setProgressMsg] = useState('');
  const [resultBlob, setResultBlob] = useState<{ blob: Blob; fileName: string } | null>(null);
  const [previewBlob, setPreviewBlob] = useState<{ blob: Blob; fileName: string } | null>(null);

  // Settings for tools
  const [splitRange, setSplitRange] = useState('1-3');
  const [deletePagesRange, setDeletePagesRange] = useState('2');
  const [rotateAngle, setRotateAngle] = useState<90 | 180 | 270>(90);
  const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.25);
  const [pageNumberPosition, setPageNumberPosition] = useState<'bottom-center' | 'bottom-right' | 'top-right'>('bottom-center');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      if (mode === 'merge') {
        setFiles((prev) => [...prev, ...Array.from(e.target.files!)]);
      } else {
        setFiles([e.target.files[0]]);
      }
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= files.length) return;
    setFiles((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const handleExecute = async () => {
    if (files.length === 0) return;
    setIsProcessing(true);
    setProgressMsg('Initializing PDF tool...');
    setResultBlob(null);

    const start = performance.now();

    try {
      let outputBlob: Blob;
      let outputFileName = '';
      const baseName = files[0].name.replace(/\.[^/.]+$/, '');

      if (mode === 'merge') {
        outputBlob = await PdfToolkitService.mergePdfs(files, (_, msg) => setProgressMsg(msg || ''));
        outputFileName = `${baseName}_merged.pdf`;
      } else if (mode === 'split') {
        outputBlob = await PdfToolkitService.splitPdf(files[0], splitRange, (_, msg) => setProgressMsg(msg || ''));
        outputFileName = `${baseName}_split.pdf`;
      } else if (mode === 'compress') {
        outputBlob = await PdfToolkitService.compressPdf(files[0], (_, msg) => setProgressMsg(msg || ''));
        outputFileName = `${baseName}_compressed.pdf`;
      } else if (mode === 'rotate') {
        outputBlob = await PdfToolkitService.rotatePdf(files[0], rotateAngle, undefined, (_, msg) => setProgressMsg(msg || ''));
        outputFileName = `${baseName}_rotated_${rotateAngle}deg.pdf`;
      } else if (mode === 'delete') {
        outputBlob = await PdfToolkitService.deletePages(files[0], deletePagesRange, (_, msg) => setProgressMsg(msg || ''));
        outputFileName = `${baseName}_modified.pdf`;
      } else if (mode === 'watermark') {
        outputBlob = await PdfToolkitService.addWatermark(
          files[0],
          { text: watermarkText, opacity: watermarkOpacity },
          (_, msg) => setProgressMsg(msg || '')
        );
        outputFileName = `${baseName}_watermarked.pdf`;
      } else {
        // Page numbers
        outputBlob = await PdfToolkitService.addPageNumbers(
          files[0],
          { position: pageNumberPosition },
          (_, msg) => setProgressMsg(msg || '')
        );
        outputFileName = `${baseName}_numbered.pdf`;
      }

      const durationMs = Math.round(performance.now() - start);
      setResultBlob({ blob: outputBlob, fileName: outputFileName });

      // Save to history
      await storageService.addHistory({
        id: Math.random().toString(36).substring(2, 9),
        fileName: files[0].name,
        fileSize: files[0].size,
        originalFormat: 'pdf',
        targetFormat: `pdf_${mode}`,
        outputFileName,
        outputSize: outputBlob.size,
        timestamp: Date.now(),
        status: 'success',
        durationMs,
      });

    } catch (err: any) {
      alert(`Operation failed: ${err.message}`);
    } finally {
      setIsProcessing(false);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!resultBlob) return;
    const url = URL.createObjectURL(resultBlob.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = resultBlob.fileName;
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
          PDF Toolkit
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Perform high-speed client-side PDF operations with zero server communication.
        </p>
      </div>

      {/* Tool Selector Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-200 dark:border-white/[0.08] pb-3">
        {[
          { id: 'merge', label: 'Merge PDFs', icon: Layers },
          { id: 'split', label: 'Split & Extract', icon: Scissors },
          { id: 'compress', label: 'Compress PDF', icon: Minimize2 },
          { id: 'rotate', label: 'Rotate Pages', icon: RotateCw },
          { id: 'delete', label: 'Delete Pages', icon: Trash2 },
          { id: 'watermark', label: 'Add Watermark', icon: Stamp },
          { id: 'numbers', label: 'Page Numbers', icon: Hash },
        ].map((tool) => {
          const Icon = tool.icon;
          const isActive = mode === tool.id;
          return (
            <button
              key={tool.id}
              onClick={() => {
                setMode(tool.id as PdfToolMode);
                setFiles([]);
                setResultBlob(null);
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isActive
                  ? 'bg-blue-600 text-white font-semibold shadow-sm'
                  : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.04] border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tool.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tool Configuration & Uploader */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: File Ingestion */}
        <div className="lg:col-span-2 space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
              {mode === 'merge' ? 'Select 2 or more PDF documents' : 'Select a PDF document'}
            </h2>

            <div className="border border-dashed border-slate-300 dark:border-white/[0.1] rounded-xl p-8 text-center hover:border-blue-400 transition-colors cursor-pointer bg-slate-50/50 dark:bg-[#181b26]/50">
              <input
                type="file"
                id="pdf-tool-files"
                accept=".pdf,application/pdf"
                multiple={mode === 'merge'}
                onChange={handleFileChange}
                className="hidden"
              />
              <label htmlFor="pdf-tool-files" className="cursor-pointer flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-2" />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                  Choose PDF file(s) from your device
                </span>
                <span className="text-[11px] text-slate-500 mt-0.5">
                  Operates 100% locally in browser memory
                </span>
              </label>
            </div>

            {/* Selected files list */}
            {files.length > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                    Selected Files ({files.length})
                  </span>
                  {mode === 'merge' && files.length > 1 && (
                    <span className="text-[11px] text-blue-600 dark:text-blue-400 font-medium">
                      Use arrows to adjust merge order
                    </span>
                  )}
                </div>
                <div className="space-y-2">
                  {files.map((file, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-lg bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.06] flex items-center justify-between text-xs text-slate-800 dark:text-slate-200"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        {mode === 'merge' && (
                          <span className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 font-mono text-[10px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                        )}
                        <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                        <span className="font-medium truncate">{file.name}</span>
                        <span className="text-slate-400 font-mono shrink-0">({(file.size / 1024).toFixed(1)} KB)</span>
                      </div>
                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        {mode === 'merge' && files.length > 1 && (
                          <div className="flex items-center bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] rounded-md overflow-hidden mr-1 shadow-sm">
                            <button
                              type="button"
                              onClick={() => moveFile(idx, -1)}
                              disabled={idx === 0}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-25 disabled:hover:bg-transparent"
                              title="Move up in merge sequence"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <div className="w-[1px] h-3 bg-slate-200 dark:bg-white/[0.08]" />
                            <button
                              type="button"
                              onClick={() => moveFile(idx, 1)}
                              disabled={idx === files.length - 1}
                              className="p-1 text-slate-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-white/[0.05] disabled:opacity-25 disabled:hover:bg-transparent"
                              title="Move down in merge sequence"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                        <button
                          onClick={() => removeFile(idx)}
                          className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                          title="Remove file"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Settings & Execute */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] shadow-sm dark:shadow-none space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">Tool Settings</h2>

            {mode === 'compress' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Optimization Level</label>
                <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 text-[11px] text-emerald-800 dark:text-emerald-300 leading-relaxed">
                  Stream recompression enabled. Removes orphan objects, optimizes internal streams, and reduces memory overhead.
                </div>
              </div>
            )}

            {mode === 'split' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Page Range to Extract</label>
                <input
                  type="text"
                  value={splitRange}
                  onChange={(e) => setSplitRange(e.target.value)}
                  placeholder="e.g. 1-3, 5, 8-10"
                  className="w-full bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">Comma-separated page numbers or dash ranges.</p>
              </div>
            )}

            {mode === 'rotate' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Clockwise Rotation</label>
                <div className="grid grid-cols-3 gap-2">
                  {[90, 180, 270].map((deg) => (
                    <button
                      key={deg}
                      type="button"
                      onClick={() => setRotateAngle(deg as any)}
                      className={`py-1.5 rounded-lg text-xs font-medium border ${
                        rotateAngle === deg
                          ? 'bg-blue-50 dark:bg-blue-600/20 text-blue-600 dark:text-blue-400 border-blue-500/40 font-semibold'
                          : 'bg-slate-50 dark:bg-[#181b26] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-white/[0.06] hover:bg-slate-100 dark:hover:bg-white/[0.04]'
                      }`}
                    >
                      {deg}°
                    </button>
                  ))}
                </div>
              </div>
            )}

            {mode === 'delete' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Pages to Delete</label>
                <input
                  type="text"
                  value={deletePagesRange}
                  onChange={(e) => setDeletePagesRange(e.target.value)}
                  placeholder="e.g. 2, 4-6"
                  className="w-full bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-mono"
                />
                <p className="text-[11px] text-slate-500">Pages specified will be completely removed.</p>
              </div>
            )}

            {mode === 'watermark' && (
              <div className="space-y-3">
                <div className="space-y-1.5">
                  <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Watermark Text</label>
                  <input
                    type="text"
                    value={watermarkText}
                    onChange={(e) => setWatermarkText(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div className="space-y-1">
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Opacity</span>
                    <span className="font-mono text-blue-500">{Math.round(watermarkOpacity * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0.05"
                    max="0.8"
                    step="0.05"
                    value={watermarkOpacity}
                    onChange={(e) => setWatermarkOpacity(parseFloat(e.target.value))}
                    className="w-full accent-blue-500"
                  />
                </div>
              </div>
            )}

            {mode === 'numbers' && (
              <div className="space-y-1.5">
                <label className="text-xs text-slate-700 dark:text-slate-300 font-medium">Position on Page</label>
                <select
                  value={pageNumberPosition}
                  onChange={(e) => setPageNumberPosition(e.target.value as any)}
                  className="w-full bg-slate-50 dark:bg-[#181b26] border border-slate-200 dark:border-white/[0.08] rounded-lg px-3 py-1.5 text-xs text-slate-800 dark:text-slate-100 focus:outline-none"
                >
                  <option value="bottom-center">Bottom Center (Standard)</option>
                  <option value="bottom-right">Bottom Right</option>
                  <option value="top-right">Top Right Header</option>
                </select>
              </div>
            )}

            <button
              onClick={handleExecute}
              disabled={isProcessing || files.length === 0 || (mode === 'merge' && files.length < 2)}
              className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white text-xs font-semibold shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing PDF...' : 'Execute PDF Operation'}</span>
            </button>

            {progressMsg && (
              <p className="text-xs text-blue-500 text-center animate-pulse">{progressMsg}</p>
            )}

            {/* Result Box */}
            {resultBlob && (
              <div className="p-3.5 rounded-lg bg-emerald-500/[0.08] border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 text-xs font-semibold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF Processed Successfully</span>
                </div>
                <p className="text-[11px] text-slate-700 dark:text-slate-300 truncate font-mono">{resultBlob.fileName}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPreviewBlob(resultBlob)}
                    className="flex-1 py-1.5 rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 dark:hover:bg-white/[0.1] text-slate-700 dark:text-slate-200 text-xs font-medium flex items-center justify-center gap-1"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>Preview</span>
                  </button>
                  <button
                    onClick={handleDownload}
                    className="flex-1 py-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1 shadow-sm transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Preview Modal */}
      {previewBlob && (
        <FilePreviewModal
          isOpen={true}
          onClose={() => setPreviewBlob(null)}
          fileName={previewBlob.fileName}
          blob={previewBlob.blob}
          mimeType="application/pdf"
        />
      )}
    </div>
  );
};
