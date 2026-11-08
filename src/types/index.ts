export type FileCategory =
  | 'document'
  | 'image'
  | 'pdf'
  | 'spreadsheet'
  | 'developer'
  | 'archive'
  | 'media'
  | 'unknown';

export interface DetectedFileInfo {
  file: File;
  name: string;
  size: number;
  extension: string;
  mimeType: string;
  detectedFormat: string;
  detectedMime: string;
  category: FileCategory;
  isMismatched: boolean;
  magicBytesHex: string;
  confidence: 'high' | 'medium' | 'low';
  supportedConversions: string[];
}

export type ConversionStatus = 'idle' | 'queued' | 'processing' | 'completed' | 'error' | 'cancelled';

export interface ConversionTask {
  id: string;
  fileInfo: DetectedFileInfo;
  targetFormat: string;
  status: ConversionStatus;
  progress: number;
  outputBlob?: Blob;
  outputFileName?: string;
  outputSize?: number;
  error?: string;
  startedAt?: number;
  completedAt?: number;
  previewUrl?: string;
  settings?: Record<string, any>;
}

export interface HistoryItem {
  id: string;
  fileName: string;
  fileSize: number;
  originalFormat: string;
  targetFormat: string;
  outputFileName: string;
  outputSize: number;
  timestamp: number;
  status: 'success' | 'failed';
  durationMs: number;
}

export interface UserSettings {
  theme: 'dark' | 'light';
  defaultImageQuality: number;
  defaultImageFormat: string;
  autoDownloadOnComplete: boolean;
  keepHistory: boolean;
  zipCompressionLevel: number;
  pdfCompressImages: boolean;
  storageQuotaWarningThreshold: number; // MB
}

export interface NetworkLogEntry {
  id: string;
  timestamp: number;
  method: string;
  url: string;
  blocked: boolean;
  reason: string;
  size?: number;
}

export interface SecurityCheckResult {
  id: string;
  name: string;
  category: 'isolation' | 'sanitization' | 'archive' | 'signature' | 'network';
  description: string;
  status: 'passed' | 'failed' | 'running' | 'idle';
  details: string;
  executionTimeMs?: number;
}

export interface EngineModuleStatus {
  id: string;
  name: string;
  category: string;
  version: string;
  sizeStr: string;
  isInstalled: boolean;
  isWasm: boolean;
  offlineReady: boolean;
  description: string;
}

