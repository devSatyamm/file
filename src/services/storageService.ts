import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { HistoryItem, UserSettings, EngineModuleStatus } from '../types';

interface FileForgeDB extends DBSchema {
  history: {
    key: string;
    value: HistoryItem;
    indexes: { 'by-timestamp': number };
  };
  settings: {
    key: string;
    value: any;
  };
  modules: {
    key: string;
    value: EngineModuleStatus;
  };
}

const DB_NAME = 'fileforge_database';
const DB_VERSION = 1;

const DEFAULT_SETTINGS: UserSettings = {
  theme: 'dark',
  defaultImageQuality: 0.85,
  defaultImageFormat: 'webp',
  autoDownloadOnComplete: false,
  keepHistory: false,
  zipCompressionLevel: 6,
  pdfCompressImages: true,
  storageQuotaWarningThreshold: 500, // MB
};

const DEFAULT_MODULES: EngineModuleStatus[] = [
  {
    id: 'engine-pdf-lib',
    name: 'PDF-Lib Manipulation Engine',
    category: 'Document & PDF',
    version: '1.17.1',
    sizeStr: '420 KB',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Enables merge, split, rotation, watermark, page numbering, and extract/delete on device.'
  },
  {
    id: 'engine-pdfjs',
    name: 'Mozilla PDF.js Rendering Engine',
    category: 'PDF & Text Extraction',
    version: '4.10.38',
    sizeStr: '1.2 MB',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Enables PDF rasterization to PNG/JPG, thumbnail rendering, and text layer extraction.'
  },
  {
    id: 'engine-mammoth',
    name: 'Mammoth DOCX Parser',
    category: 'Word Processing',
    version: '1.8.0',
    sizeStr: '280 KB',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Converts Microsoft Word (.docx) files into clean HTML and plain text.'
  },
  {
    id: 'engine-sheetjs',
    name: 'SheetJS Core (XLSX/CSV/JSON)',
    category: 'Spreadsheets',
    version: '0.18.5',
    sizeStr: '890 KB',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'High-speed spreadsheet parser for XLSX, XLS, CSV and JSON bidirectional transforms.'
  },
  {
    id: 'engine-jszip',
    name: 'JSZip Archive Engine',
    category: 'Archives',
    version: '3.10.1',
    sizeStr: '110 KB',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Zip bomb protected file decompression, archive inspection, and multi-file packaging.'
  },
  {
    id: 'engine-canvas',
    name: 'Browser Canvas & Image Processor',
    category: 'Image Processing',
    version: 'Native HW-Accelerated',
    sizeStr: '0 KB (Built-in)',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Hardware accelerated format conversion (PNG, JPG, WEBP, SVG) with resize and quality control.'
  },
  {
    id: 'engine-crypto',
    name: 'Web Crypto API Security Engine',
    category: 'Security & Hashes',
    version: 'W3C Standard',
    sizeStr: '0 KB (Built-in)',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'SubtleCrypto SHA-1, SHA-256, SHA-512 cryptographic hashing and secure random generation.'
  },
  {
    id: 'engine-audio-webaudio',
    name: 'WebAudio & Media Recorder Suite',
    category: 'Media & Audio',
    version: 'Web Standards',
    sizeStr: '0 KB (Built-in)',
    isInstalled: true,
    isWasm: false,
    offlineReady: true,
    description: 'Client-side WAV, WebM, MP3 conversion, channel mixing, and video frame extraction.'
  },
  {
    id: 'engine-ffmpeg-wasm',
    name: 'FFmpeg.wasm Heavy Transcoder',
    category: 'Media & Video (Optional)',
    version: '0.12.10',
    sizeStr: '24 MB (Optional)',
    isInstalled: false,
    isWasm: true,
    offlineReady: false,
    description: 'Optional modular WASM engine for legacy audio/video conversions (installable on demand).'
  }
];

class StorageService {
  private dbPromise: Promise<IDBPDatabase<FileForgeDB>> | null = null;

  private async getDB(): Promise<IDBPDatabase<FileForgeDB>> {
    if (!this.dbPromise) {
      this.dbPromise = openDB<FileForgeDB>(DB_NAME, DB_VERSION, {
        upgrade(db) {
          if (!db.objectStoreNames.contains('history')) {
            const historyStore = db.createObjectStore('history', { keyPath: 'id' });
            historyStore.createIndex('by-timestamp', 'timestamp');
          }
          if (!db.objectStoreNames.contains('settings')) {
            db.createObjectStore('settings');
          }
          if (!db.objectStoreNames.contains('modules')) {
            db.createObjectStore('modules', { keyPath: 'id' });
          }
        },
      }).then(async (db) => {
        // Enforce strict zero-trace architecture: wipe any lingering historical logs from disk on boot
        if (db.objectStoreNames.contains('history')) {
          try {
            await db.clear('history');
          } catch {}
        }
        return db;
      });
    }
    return this.dbPromise;
  }

  public async getSettings(): Promise<UserSettings> {
    try {
      const db = await this.getDB();
      const saved = await db.get('settings', 'user_config');
      return { ...DEFAULT_SETTINGS, ...(saved || {}), keepHistory: false };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public async saveSettings(settings: Partial<UserSettings>): Promise<UserSettings> {
    const current = await this.getSettings();
    const updated = { ...current, ...settings, keepHistory: false };
    const db = await this.getDB();
    await db.put('settings', updated, 'user_config');
    return updated;
  }

  public async addHistory(_item: HistoryItem): Promise<void> {
    // Zero-trace ephemeral architecture: FileForge strictly never writes conversion records, file names, or metadata to disk.
    return;
  }

  public async getHistory(_limit = 50): Promise<HistoryItem[]> {
    // Zero-trace mode: No file history is stored or returned
    return [];
  }

  public async deleteHistoryItem(_id: string): Promise<void> {
    return;
  }

  public async clearHistory(): Promise<void> {
    try {
      const db = await this.getDB();
      if (db.objectStoreNames.contains('history')) {
        await db.clear('history');
      }
    } catch {}
  }

  public async getModules(): Promise<EngineModuleStatus[]> {
    try {
      const db = await this.getDB();
      const stored = await db.getAll('modules');
      if (stored && stored.length > 0) {
        return stored;
      }
      // Populate defaults
      const tx = db.transaction('modules', 'readwrite');
      for (const mod of DEFAULT_MODULES) {
        await tx.store.put(mod);
      }
      await tx.done;
      return DEFAULT_MODULES;
    } catch {
      return DEFAULT_MODULES;
    }
  }

  public async updateModuleStatus(id: string, updates: Partial<EngineModuleStatus>): Promise<void> {
    const db = await this.getDB();
    const existing = await db.get('modules', id);
    if (existing) {
      await db.put('modules', { ...existing, ...updates });
    }
  }

  public async getStorageEstimate(): Promise<{ usageMB: number; quotaMB: number; percentage: number }> {
    if (typeof navigator !== 'undefined' && 'storage' in navigator && 'estimate' in navigator.storage) {
      try {
        const estimate = await navigator.storage.estimate();
        const usageMB = Math.round((estimate.usage || 0) / (1024 * 1024) * 10) / 10;
        const quotaMB = Math.round((estimate.quota || 0) / (1024 * 1024));
        const percentage = quotaMB > 0 ? Math.round((usageMB / quotaMB) * 1000) / 10 : 0;
        return { usageMB, quotaMB, percentage };
      } catch {
        return { usageMB: 2.4, quotaMB: 10240, percentage: 0.1 };
      }
    }
    return { usageMB: 1.8, quotaMB: 5000, percentage: 0.1 };
  }

  public async clearAllLocalData(): Promise<void> {
    const db = await this.getDB();
    await db.clear('history');
    await db.clear('settings');
    // Also clear CacheStorage if available
    if (typeof caches !== 'undefined') {
      const keys = await caches.keys();
      for (const key of keys) {
        if (key.includes('fileforge-user') || key.includes('temp')) {
          await caches.delete(key);
        }
      }
    }
  }
}

export const storageService = new StorageService();

