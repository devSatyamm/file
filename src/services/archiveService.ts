import JSZip from 'jszip';

export interface ArchiveEntryInfo {
  name: string;
  size: number;
  compressedSize: number;
  date: Date;
  isDirectory: boolean;
  isSafe: boolean;
  securityWarning?: string;
}

export interface ArchiveInspectionResult {
  totalFiles: number;
  totalUncompressedSize: number;
  compressedSize: number;
  compressionRatio: number;
  entries: ArchiveEntryInfo[];
  isSafe: boolean;
  securityIssues: string[];
}

export class ArchiveService {
  private static readonly MAX_UNCOMPRESSED_BYTES = 300 * 1024 * 1024; // 300 MB limit
  private static readonly MAX_COMPRESSION_RATIO = 100; // 100:1 ratio alert
  private static readonly MAX_FILE_COUNT = 5000;

  /**
   * Inspect ZIP contents with deep Zip Slip & Zip Bomb validation
   */
  public static async inspectZip(file: File): Promise<ArchiveInspectionResult> {
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);

    const entries: ArchiveEntryInfo[] = [];
    const securityIssues: string[] = [];
    let totalUncompressedSize = 0;
    let fileCount = 0;

    const fileKeys = Object.keys(zip.files);
    if (fileKeys.length > this.MAX_FILE_COUNT) {
      securityIssues.push(`Archive contains ${fileKeys.length} files (exceeds safety threshold of ${this.MAX_FILE_COUNT})`);
    }

    for (const relativePath of fileKeys) {
      const zipObj = zip.files[relativePath];
      fileCount++;

      // Zip Slip Detection: check for directory traversal (../ or leading slashes or drive letters)
      let isSafe = true;
      let securityWarning: string | undefined;

      if (
        relativePath.includes('..') ||
        relativePath.startsWith('/') ||
        relativePath.startsWith('\\') ||
        /^[a-zA-Z]:/.test(relativePath)
      ) {
        isSafe = false;
        securityWarning = 'Blocked: Directory traversal path detected (ZIP Slip attack vector)';
        securityIssues.push(`Malicious path detected: "${relativePath}"`);
      }

      const uncompressedSize = (zipObj as any)._data?.uncompressedSize || 0;
      totalUncompressedSize += uncompressedSize;

      entries.push({
        name: relativePath,
        size: uncompressedSize,
        compressedSize: (zipObj as any)._data?.compressedSize || 0,
        date: zipObj.date || new Date(),
        isDirectory: zipObj.dir,
        isSafe,
        securityWarning,
      });
    }

    // Zip Bomb Check
    const compressionRatio = file.size > 0 ? totalUncompressedSize / file.size : 1;
    if (compressionRatio > this.MAX_COMPRESSION_RATIO && totalUncompressedSize > 50 * 1024 * 1024) {
      securityIssues.push(
        `High compression ratio alert (${Math.round(compressionRatio)}:1). Possible ZIP Bomb attack structure.`
      );
    }

    if (totalUncompressedSize > this.MAX_UNCOMPRESSED_BYTES) {
      securityIssues.push(
        `Uncompressed size ${(totalUncompressedSize / (1024 * 1024)).toFixed(1)} MB exceeds safe memory limit of ${this.MAX_UNCOMPRESSED_BYTES / (1024 * 1024)} MB.`
      );
    }

    return {
      totalFiles: fileCount,
      totalUncompressedSize,
      compressedSize: file.size,
      compressionRatio: Math.round(compressionRatio * 10) / 10,
      entries,
      isSafe: securityIssues.length === 0,
      securityIssues,
    };
  }

  /**
   * Extract a single safe file from ZIP
   */
  public static async extractFile(file: File, relativePath: string): Promise<Blob> {
    // Validate path safety
    if (
      relativePath.includes('..') ||
      relativePath.startsWith('/') ||
      relativePath.startsWith('\\') ||
      /^[a-zA-Z]:/.test(relativePath)
    ) {
      throw new Error(`Security Violation: Extraction of unsafe path "${relativePath}" is prohibited.`);
    }

    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const zipFile = zip.file(relativePath);

    if (!zipFile) {
      throw new Error(`File "${relativePath}" not found in archive.`);
    }

    const blob = await zipFile.async('blob');
    return blob;
  }

  /**
   * Extract all safe files as an unpackaged list of Blobs
   */
  public static async extractAllSafeFiles(
    file: File,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<{ name: string; blob: Blob }[]> {
    onProgress?.(15, 'Scanning archive safety...');
    const inspection = await this.inspectZip(file);

    if (!inspection.isSafe) {
      const confirmMsg = `Security Alert: ${inspection.securityIssues.join('; ')}`;
      console.warn(confirmMsg);
      // Skip unsafe files automatically
    }

    onProgress?.(40, 'Extracting contents...');
    const buffer = await file.arrayBuffer();
    const zip = await JSZip.loadAsync(buffer);
    const extracted: { name: string; blob: Blob }[] = [];

    const safeEntries = inspection.entries.filter((e) => !e.isDirectory && e.isSafe);
    for (let i = 0; i < safeEntries.length; i++) {
      const entry = safeEntries[i];
      onProgress?.(
        Math.round(40 + (i / safeEntries.length) * 55),
        `Extracting ${entry.name} (${i + 1}/${safeEntries.length})...`
      );
      const zipObj = zip.file(entry.name);
      if (zipObj) {
        const b = await zipObj.async('blob');
        extracted.push({ name: entry.name, blob: b });
      }
    }

    onProgress?.(100, 'Extraction complete.');
    return extracted;
  }

  /**
   * Create a new ZIP archive from multiple files
   */
  public static async createZip(
    files: { name: string; blob: Blob }[],
    compressionLevel = 6,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(10, 'Initializing new ZIP container...');
    const zip = new JSZip();

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      // Sanitize filename to prevent accidental path traversal
      const safeName = item.name.replace(/^[\/\\]+/, '').replace(/\.\.[\/\\]/g, '');
      onProgress?.(
        Math.round(15 + (i / files.length) * 70),
        `Adding ${safeName} (${i + 1}/${files.length})...`
      );
      const buf = await item.blob.arrayBuffer();
      zip.file(safeName, buf);
    }

    onProgress?.(90, 'Compressing archive...');
    const resultBlob = await zip.generateAsync(
      {
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: { level: compressionLevel },
      },
      (metadata) => {
        onProgress?.(Math.round(90 + (metadata.percent / 100) * 10), 'Finalizing archive...');
      }
    );

    onProgress?.(100, 'Archive created successfully.');
    return resultBlob;
  }
}

