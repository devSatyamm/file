import React, { useEffect, useState } from 'react';
import { X, Download, FileText, Check, Shield } from 'lucide-react';
import { SpreadsheetConverter, SpreadsheetPreviewData } from '../../services/spreadsheetConverter';

interface FilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  fileName: string;
  blob?: Blob;
  mimeType?: string;
}

export const FilePreviewModal: React.FC<FilePreviewModalProps> = ({
  isOpen,
  onClose,
  fileName,
  blob,
  mimeType,
}) => {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [spreadsheetData, setSpreadsheetData] = useState<SpreadsheetPreviewData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !blob) {
      setPreviewUrl(null);
      setTextContent(null);
      setSpreadsheetData(null);
      return;
    }

    setIsLoading(true);
    const url = URL.createObjectURL(blob);
    setPreviewUrl(url);

    const type = mimeType || blob.type || '';
    const ext = fileName.split('.').pop()?.toLowerCase() || '';

    if (type.startsWith('text/') || ext === 'txt' || ext === 'json' || ext === 'html' || ext === 'md') {
      blob.text().then((txt) => {
        setTextContent(txt);
        setIsLoading(false);
      });
    } else if (ext === 'csv' || ext === 'xlsx' || type.includes('spreadsheet') || type.includes('csv')) {
      const tempFile = new File([blob], fileName, { type: blob.type });
      SpreadsheetConverter.parseForPreview(tempFile)
        .then((data) => {
          setSpreadsheetData(data);
          setIsLoading(false);
        })
        .catch(() => {
          setIsLoading(false);
        });
    } else {
      setIsLoading(false);
    }

    return () => {
      URL.revokeObjectURL(url);
    };
  }, [isOpen, blob, fileName, mimeType]);

  if (!isOpen || !blob) return null;

  const ext = fileName.split('.').pop()?.toLowerCase() || '';
  const isImage = blob.type.startsWith('image/') || ['png', 'jpg', 'jpeg', 'webp', 'svg', 'gif'].includes(ext);
  const isPdf = blob.type === 'application/pdf' || ext === 'pdf';
  const isAudio = blob.type.startsWith('audio/') || ['wav', 'mp3', 'ogg'].includes(ext);

  const handleDownload = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.1] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 dark:border-white/[0.08] flex items-center justify-between bg-slate-50 dark:bg-[#181b26]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                {fileName}
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-500/20 flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5" />
                  Sandboxed Preview
                </span>
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">{(blob.size / 1024).toFixed(1)} KB • {blob.type || ext.toUpperCase()}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-200/50 dark:hover:bg-white/[0.05] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-auto p-4 flex items-center justify-center min-h-[350px] bg-slate-100 dark:bg-[#090a0f]">
          {isLoading ? (
            <div className="text-sm text-slate-500 dark:text-slate-400 flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
              Rendering preview...
            </div>
          ) : isImage && previewUrl ? (
            <div className="max-w-full max-h-full flex items-center justify-center">
              <img
                src={previewUrl}
                alt={fileName}
                className="max-h-[70vh] max-w-full object-contain rounded-lg shadow-md border border-slate-200 dark:border-white/[0.06]"
              />
            </div>
          ) : isPdf && previewUrl ? (
            <iframe
              src={previewUrl}
              title={fileName}
              className="w-full h-[70vh] rounded-lg border border-slate-200 dark:border-white/[0.06] bg-white"
            />
          ) : isAudio && previewUrl ? (
            <div className="p-8 text-center space-y-4">
              <p className="text-sm text-slate-800 dark:text-slate-300 font-medium">Audio Output Preview</p>
              <audio controls src={previewUrl} className="w-full max-w-md mx-auto" />
            </div>
          ) : spreadsheetData ? (
            <div className="w-full h-full max-h-[70vh] overflow-auto rounded-lg border border-slate-200 dark:border-white/[0.08] bg-white dark:bg-[#14161f]">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-[#181b26] sticky top-0 border-b border-slate-200 dark:border-white/[0.08]">
                  <tr>
                    {spreadsheetData.columns.map((col, i) => (
                      <th key={i} className="p-2.5 font-semibold text-slate-700 dark:text-slate-300 whitespace-nowrap border-r border-slate-100 dark:border-white/[0.04]">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04] text-slate-700 dark:text-slate-300 font-mono">
                  {spreadsheetData.rows.map((row, rIdx) => (
                    <tr key={rIdx} className="hover:bg-slate-50 dark:hover:bg-white/[0.02]">
                      {spreadsheetData.columns.map((col, cIdx) => (
                        <td key={cIdx} className="p-2 whitespace-nowrap border-r border-slate-100 dark:border-white/[0.04]">
                          {row[col]}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : textContent !== null ? (
            <pre className="w-full h-[65vh] p-4 rounded-lg bg-white dark:bg-[#14161f] border border-slate-200 dark:border-white/[0.06] text-xs font-mono text-slate-800 dark:text-slate-300 overflow-auto whitespace-pre-wrap selectable-text">
              {textContent}
            </pre>
          ) : (
            <div className="text-center p-8 space-y-3">
              <FileText className="w-12 h-12 text-slate-400 mx-auto" />
              <p className="text-sm text-slate-800 dark:text-slate-300 font-medium">{fileName}</p>
              <p className="text-xs text-slate-500">Binary format converted. Ready for local download.</p>
              <button
                onClick={handleDownload}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium inline-flex items-center gap-1.5 shadow-sm"
              >
                <Download className="w-3.5 h-3.5" />
                Download File
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

