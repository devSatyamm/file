import React, { useState, useEffect, useRef } from 'react';
import {
  FileImage,
  RotateCw,
  ArrowLeft,
  ArrowRight,
  Trash2,
  Plus,
  Download,
  Eye,
  CheckCircle2,
  Sparkles,
  Settings,
  Layers,
  Minimize2,
  Maximize2,
  Check,
  X
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ImageConverter, ImageToPdfItem, ImagesToPdfOptions } from '../../services/imageConverter';
import { ArchiveService } from '../../services/archiveService';
import { storageService } from '../../services/storageService';
import { FilePreviewModal } from '../common/FilePreviewModal';

interface StudioImageItem extends ImageToPdfItem {
  previewUrl: string;
}

interface ImagesToPdfStudioProps {
  initialFiles: File[];
  onClose?: () => void;
  onPdfGenerated?: (blob: Blob, fileName: string) => void;
}

export const ImagesToPdfStudio: React.FC<ImagesToPdfStudioProps> = ({
  initialFiles,
  onClose,
  onPdfGenerated,
}) => {
  const [items, setItems] = useState<StudioImageItem[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);

  // Settings
  const [mergeIntoSingle, setMergeIntoSingle] = useState<boolean>(true);
  const [pageSize, setPageSize] = useState<'a4' | 'letter' | 'fit'>('a4');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape' | 'auto'>('portrait');
  const [margin, setMargin] = useState<'none' | 'small' | 'big'>('none');

  // Execution
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressMsg, setProgressMsg] = useState('');
  const [result, setResult] = useState<{ blob: Blob; fileName: string; isZip?: boolean } | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFiles && initialFiles.length > 0) {
      appendFiles(initialFiles);
    }
  }, []);

  const appendFiles = (files: File[]) => {
    const newItems: StudioImageItem[] = files.map((file) => ({
      id: Math.random().toString(36).substring(2, 9),
      file,
      name: file.name,
      size: file.size,
      rotation: 0,
      previewUrl: URL.createObjectURL(file),
    }));
    setItems((prev) => [...prev, ...newItems]);
    setResult(null);
  };

  const rotateItem = (index: number) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, rotation: ((item.rotation || 0) + 90) % 360 } : item
      )
    );
  };

  const moveItem = (index: number, direction: -1 | 1) => {
    const targetIdx = index + direction;
    if (targetIdx < 0 || targetIdx >= items.length) return;

    setItems((prev) => {
      const copy = [...prev];
      const temp = copy[index];
      copy[index] = copy[targetIdx];
      copy[targetIdx] = temp;
      return copy;
    });
  };

  const removeItem = (index: number) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl);
      return prev.filter((_, idx) => idx !== index);
    });
  };

  // Drag and drop ordering
  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    setItems((prev) => {
      const copy = [...prev];
      const dragged = copy[draggedIndex];
      copy.splice(draggedIndex, 1);
      copy.splice(index, 0, dragged);
      setDraggedIndex(index);
      return copy;
    });
  };

  const handleConvert = async () => {
    if (items.length === 0) return;
    setIsConverting(true);
    setProgress(5);
    setProgressMsg('Initializing Image to PDF engine...');
    setResult(null);

    const startTime = performance.now();

    try {
      if (mergeIntoSingle) {
        // Merge all images into one multi-page PDF
        const options: ImagesToPdfOptions = { pageSize, orientation, margin };
        const blob = await ImageConverter.multipleImagesToPdf(
          items,
          options,
          (p, msg) => {
            setProgress(p);
            setProgressMsg(msg || '');
          }
        );

        const base = items[0].name.replace(/\.[^/.]+$/, '');
        const outputFileName = `${base}_combined_${items.length}pages.pdf`;

        const durationMs = Math.round(performance.now() - startTime);

        await storageService.addHistory({
          id: Math.random().toString(36).substring(2, 9),
          fileName: `${items.length} Images Combined`,
          fileSize: items.reduce((acc, i) => acc + i.size, 0),
          originalFormat: 'images',
          targetFormat: 'pdf',
          outputFileName,
          outputSize: blob.size,
          timestamp: Date.now(),
          status: 'success',
          durationMs,
        });

        setResult({ blob, fileName: outputFileName, isZip: false });
        onPdfGenerated?.(blob, outputFileName);

        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      } else {
        // Convert each image to a separate PDF and zip them
        const pdfFiles: { name: string; blob: Blob }[] = [];

        for (let i = 0; i < items.length; i++) {
          const item = items[i];
          setProgress(Math.round(10 + (i / items.length) * 75));
          setProgressMsg(`Converting ${item.name} (${i + 1}/${items.length})...`);

          const singleBlob = await ImageConverter.multipleImagesToPdf(
            [item],
            { pageSize, orientation, margin }
          );

          const base = item.name.replace(/\.[^/.]+$/, '');
          pdfFiles.push({ name: `${base}.pdf`, blob: singleBlob });
        }

        setProgress(90);
        setProgressMsg('Packaging individual PDFs into ZIP archive...');
        const zipBlob = await ArchiveService.createZip(pdfFiles, 6);
        const outputFileName = `Images_as_PDFs_${Date.now()}.zip`;

        setResult({ blob: zipBlob, fileName: outputFileName, isZip: true });
        confetti({
          particleCount: 80,
          spread: 60,
          origin: { y: 0.7 },
        });
      }
    } catch (err: any) {
      alert(`Conversion failed: ${err.message}`);
    } finally {
      setIsConverting(false);
      setProgress(0);
      setProgressMsg('');
    }
  };

  const handleDownload = () => {
    if (!result) return;
    const url = URL.createObjectURL(result.blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = result.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 rounded-2xl bg-white dark:bg-[#14161f] border border-blue-200/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-md transition-all">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-blue-100 dark:border-white/[0.06]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-600 flex items-center justify-center text-white shadow-sm font-bold text-xs">
            PDF
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              Image to PDF Organizer
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-600/20 text-blue-700 dark:text-blue-400 font-semibold">
                {items.length} {items.length === 1 ? 'Page' : 'Pages'}
              </span>
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
              Reorder pages, rotate individual photos, configure margins and orientation.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,.png,.jpg,.jpeg,.webp,.svg"
            multiple
            onChange={(e) => e.target.files && appendFiles(Array.from(e.target.files))}
            className="hidden"
          />
          <button
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-white/[0.06] hover:bg-blue-100 dark:hover:bg-white/[0.1] text-blue-700 dark:text-slate-200 text-xs font-semibold flex items-center gap-1.5 border border-blue-200 dark:border-white/[0.06] transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Images</span>
          </button>

          {onClose && (
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/[0.05] transition-colors"
              title="Close Organizer"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Toolbar / Options (Orientation, Page Size, Margins, Single/Separate Toggle) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-[#f5f9fe] dark:bg-[#181b26] p-3.5 rounded-xl border border-blue-100 dark:border-white/[0.06]">
        {/* Merge Toggle */}
        <div className="flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Output Format
          </label>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMergeIntoSingle(true)}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                mergeIntoSingle
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              1 Merged PDF
            </button>
            <button
              onClick={() => setMergeIntoSingle(false)}
              className={`flex-1 py-1.5 px-2.5 rounded-lg text-xs font-semibold transition-all ${
                !mergeIntoSingle
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
              }`}
            >
              Separate PDFs
            </button>
          </div>
        </div>

        {/* Orientation */}
        <div className="flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Orientation
          </label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'portrait', label: 'Portrait' },
              { id: 'landscape', label: 'Landscape' },
              { id: 'auto', label: 'Auto' },
            ].map((o) => (
              <button
                key={o.id}
                onClick={() => setOrientation(o.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  orientation === o.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Page Size */}
        <div className="flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Page Size
          </label>
          <select
            value={pageSize}
            onChange={(e) => setPageSize(e.target.value as any)}
            className="w-full bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.08] rounded-lg px-2.5 py-1.5 text-xs text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            <option value="a4">A4 (297 × 210 mm)</option>
            <option value="letter">US Letter (8.5 × 11 in)</option>
            <option value="fit">Fit to Image Size</option>
          </select>
        </div>

        {/* Margins */}
        <div className="flex flex-col justify-between">
          <label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
            Margins
          </label>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'none', label: 'No Margin' },
              { id: 'small', label: 'Small' },
              { id: 'big', label: 'Big' },
            ].map((m) => (
              <button
                key={m.id}
                onClick={() => setMargin(m.id as any)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  margin === m.id
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-white dark:bg-[#14161f] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-white/[0.06]'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Image Cards Grid */}
      <div className="space-y-2">
        <p className="text-xs text-slate-500 font-medium">
          Drag cards to reorder or use arrows. Click ↻ to rotate that page.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3.5 pt-1">
          {items.map((item, idx) => (
            <div
              key={item.id}
              draggable
              onDragStart={() => handleDragStart(idx)}
              onDragOver={(e) => handleDragOver(e, idx)}
              className="group relative bg-[#f8fbfe] dark:bg-[#181b26] border border-blue-200/90 dark:border-white/[0.08] hover:border-blue-400 dark:hover:border-blue-500 rounded-xl p-2.5 flex flex-col justify-between shadow-xs hover:shadow-md transition-all cursor-move select-none"
            >
              {/* Top Controls: Page Badge & Delete */}
              <div className="flex items-center justify-between mb-2">
                <span className="px-1.5 py-0.5 rounded-md bg-blue-600 text-white font-mono text-[10px] font-bold shadow-xs">
                  Page {idx + 1}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => rotateItem(idx)}
                    className="p-1 rounded bg-white dark:bg-white/[0.08] hover:bg-blue-50 text-slate-600 hover:text-blue-600 dark:text-slate-300 transition-colors shadow-xs"
                    title="Rotate 90° clockwise"
                  >
                    <RotateCw className="w-3 h-3" />
                  </button>

                  <button
                    onClick={() => removeItem(idx)}
                    className="p-1 rounded bg-white dark:bg-white/[0.08] hover:bg-rose-50 text-slate-400 hover:text-rose-600 dark:text-slate-400 transition-colors shadow-xs"
                    title="Remove image"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Visual Preview Box */}
              <div className="w-full h-36 rounded-lg bg-slate-100 dark:bg-black/30 flex items-center justify-center overflow-hidden border border-slate-200/60 dark:border-white/[0.04] p-1.5 relative">
                <img
                  src={item.previewUrl}
                  alt={item.name}
                  style={{
                    transform: `rotate(${item.rotation || 0}deg)`,
                    transition: 'transform 0.2s ease',
                  }}
                  className="max-h-full max-w-full object-contain"
                />
                {item.rotation !== 0 && (
                  <span className="absolute bottom-1 right-1 px-1 py-0.2 rounded bg-black/60 text-white font-mono text-[9px]">
                    {item.rotation}°
                  </span>
                )}
              </div>

              {/* File Info & Shift Arrows */}
              <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.04] flex items-center justify-between text-[11px]">
                <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[90px]" title={item.name}>
                  {item.name}
                </span>

                <div className="flex items-center gap-1">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveItem(idx, -1)}
                    className="p-1 rounded bg-white dark:bg-white/[0.06] disabled:opacity-30 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="Move left"
                  >
                    <ArrowLeft className="w-2.5 h-2.5" />
                  </button>
                  <button
                    disabled={idx === items.length - 1}
                    onClick={() => moveItem(idx, 1)}
                    className="p-1 rounded bg-white dark:bg-white/[0.06] disabled:opacity-30 text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors"
                    title="Move right"
                  >
                    <ArrowRight className="w-2.5 h-2.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}

          {/* Quick Add More Button Card */}
          <div
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-blue-300 dark:border-white/[0.1] hover:border-blue-500 rounded-xl p-4 flex flex-col items-center justify-center cursor-pointer bg-blue-50/40 dark:bg-[#181b26]/40 hover:bg-blue-50 text-blue-600 dark:text-blue-400 transition-colors min-h-[180px]"
          >
            <div className="w-9 h-9 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center mb-1.5">
              <Plus className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold">Add Images</span>
            <span className="text-[10px] text-slate-500 mt-0.5">JPG, PNG, WebP</span>
          </div>
        </div>
      </div>

      {/* Progress Message */}
      {isConverting && (
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-600/10 border border-blue-200 dark:border-blue-500/20 space-y-2">
          <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-400 font-semibold">
            <span>{progressMsg}</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-blue-200 dark:bg-slate-800 overflow-hidden">
            <div
              className="h-full bg-blue-600 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action / Result Bar */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="text-xs text-slate-600 dark:text-slate-400">
          Total: <span className="font-bold text-slate-800 dark:text-slate-200">{items.length} Images</span> •{' '}
          <span className="font-mono">{(items.reduce((acc, i) => acc + i.size, 0) / (1024 * 1024)).toFixed(2)} MB</span>
        </div>

        <div className="flex items-center gap-3">
          {result && (
            <>
              <button
                onClick={() => setPreviewOpen(true)}
                className="px-3.5 py-2 rounded-xl bg-slate-100 dark:bg-white/[0.08] hover:bg-slate-200 dark:hover:bg-white/[0.12] text-slate-800 dark:text-slate-200 font-semibold text-xs flex items-center gap-1.5 shadow-xs transition-colors"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Preview PDF</span>
              </button>

              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download {result.isZip ? 'ZIP' : 'PDF'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleConvert}
            disabled={isConverting || items.length === 0}
            className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold text-sm flex items-center gap-2 shadow-md disabled:opacity-40 transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>
              {isConverting
                ? 'Converting...'
                : mergeIntoSingle
                ? `Convert ${items.length} ${items.length === 1 ? 'Image' : 'Images'} to One PDF`
                : `Convert ${items.length} Images to Separate PDFs`}
            </span>
          </button>
        </div>
      </div>

      {/* Preview Modal */}
      {previewOpen && result && (
        <FilePreviewModal
          isOpen={true}
          onClose={() => setPreviewOpen(false)}
          fileName={result.fileName}
          blob={result.blob}
          mimeType={result.isZip ? 'application/zip' : 'application/pdf'}
        />
      )}
    </div>
  );
};

