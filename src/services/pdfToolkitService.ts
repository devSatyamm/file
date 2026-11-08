import { PDFDocument, degrees, rgb, StandardFonts } from 'pdf-lib';

export class PdfToolkitService {
  /**
   * Merge multiple PDF files into a single unified PDF
   */
  public static async mergePdfs(
    files: File[],
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    if (files.length < 2) {
      throw new Error('At least two PDF files are required to merge.');
    }

    onProgress?.(10, 'Initializing merged PDF document...');
    const mergedPdf = await PDFDocument.create();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      onProgress?.(
        Math.round(15 + (i / files.length) * 75),
        `Importing pages from ${file.name} (${i + 1}/${files.length})...`
      );

      const buffer = await file.arrayBuffer();
      const donorPdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
      const donorPageIndices = donorPdf.getPageIndices();
      const copiedPages = await mergedPdf.copyPages(donorPdf, donorPageIndices);

      for (const page of copiedPages) {
        mergedPdf.addPage(page);
      }
    }

    onProgress?.(92, 'Finalizing merged document...');
    const mergedBytes = await mergedPdf.save();
    onProgress?.(100, 'PDF merge complete.');
    return new Blob([mergedBytes as any], { type: 'application/pdf' });
  }

  /**
   * Compress PDF - Optimizes streams, removes unused metadata objects
   */
  public static async compressPdf(
    file: File,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(25, 'Loading PDF for compression...');
    const buffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });

    onProgress?.(60, 'Optimizing internal PDF streams & structures...');
    // Create new document and copy pages to strip unreferenced objects and orphaned resources
    const cleanDoc = await PDFDocument.create();
    const copiedPages = await cleanDoc.copyPages(pdfDoc, pdfDoc.getPageIndices());
    for (const p of copiedPages) {
      cleanDoc.addPage(p);
    }

    onProgress?.(85, 'Compressing document objects...');
    const compressedBytes = await cleanDoc.save({ useObjectStreams: true });
    onProgress?.(100, 'PDF compressed.');
    return new Blob([compressedBytes as any], { type: 'application/pdf' });
  }

  /**
   * Split PDF by page range (e.g., "1-3", "4", "5-10")
   */
  public static async splitPdf(
    file: File,
    pageRangesStr: string,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Loading source PDF...');
    const buffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    // Parse page ranges (1-indexed input from user)
    const indicesToKeep = this.parsePageRanges(pageRangesStr, totalPages);
    if (indicesToKeep.length === 0) {
      throw new Error('No valid pages specified for extraction.');
    }

    onProgress?.(50, `Extracting ${indicesToKeep.length} page(s)...`);
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, indicesToKeep);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    onProgress?.(90, 'Generating split PDF...');
    const bytes = await newPdf.save();
    onProgress?.(100, 'Split complete.');
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Rotate pages in a PDF (clockwise 90, 180, or 270 degrees)
   */
  public static async rotatePdf(
    file: File,
    angle: 90 | 180 | 270,
    pageIndicesToRotate?: number[], // null/empty means all
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(25, 'Loading PDF for rotation...');
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const pages = pdf.getPages();

    onProgress?.(60, `Rotating pages by ${angle}°...`);
    pages.forEach((page, index) => {
      if (!pageIndicesToRotate || pageIndicesToRotate.length === 0 || pageIndicesToRotate.includes(index)) {
        const currentRotation = page.getRotation().angle;
        page.setRotation(degrees((currentRotation + angle) % 360));
      }
    });

    onProgress?.(90, 'Saving rotated PDF...');
    const bytes = await pdf.save();
    onProgress?.(100, 'Rotation complete.');
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Delete specific pages from PDF
   */
  public static async deletePages(
    file: File,
    pagesToDeleteStr: string,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Loading PDF...');
    const buffer = await file.arrayBuffer();
    const sourcePdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const totalPages = sourcePdf.getPageCount();

    const deleteIndices = new Set(this.parsePageRanges(pagesToDeleteStr, totalPages));
    const keepIndices: number[] = [];

    for (let i = 0; i < totalPages; i++) {
      if (!deleteIndices.has(i)) {
        keepIndices.push(i);
      }
    }

    if (keepIndices.length === 0) {
      throw new Error('Cannot delete all pages from the document.');
    }

    onProgress?.(60, `Preserving ${keepIndices.length} page(s)...`);
    const newPdf = await PDFDocument.create();
    const copiedPages = await newPdf.copyPages(sourcePdf, keepIndices);

    for (const page of copiedPages) {
      newPdf.addPage(page);
    }

    onProgress?.(90, 'Saving modified PDF...');
    const bytes = await newPdf.save();
    onProgress?.(100, 'Pages deleted successfully.');
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Add text watermark to all pages of a PDF
   */
  public static async addWatermark(
    file: File,
    options: {
      text: string;
      fontSize?: number;
      opacity?: number;
      rotationDegrees?: number;
      color?: { r: number; g: number; b: number };
    },
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Loading PDF for watermarking...');
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.HelveticaBold);

    const pages = pdf.getPages();
    const watermarkText = options.text || 'CONFIDENTIAL';
    const fontSize = options.fontSize || 48;
    const opacity = options.opacity ?? 0.25;
    const rotation = degrees(options.rotationDegrees ?? 45);
    const textRgb = options.color ? rgb(options.color.r, options.color.g, options.color.b) : rgb(0.8, 0.2, 0.2);

    for (let i = 0; i < pages.length; i++) {
      onProgress?.(
        Math.round(20 + (i / pages.length) * 70),
        `Watermarking page ${i + 1} of ${pages.length}...`
      );
      const page = pages[i];
      const { width, height } = page.getSize();
      const textWidth = font.widthOfTextAtSize(watermarkText, fontSize);
      const textHeight = font.heightAtSize(fontSize);

      page.drawText(watermarkText, {
        x: width / 2 - (textWidth / 2) * Math.cos((45 * Math.PI) / 180),
        y: height / 2 - (textHeight / 2),
        size: fontSize,
        font,
        color: textRgb,
        opacity,
        rotate: rotation,
      });
    }

    onProgress?.(95, 'Saving watermarked document...');
    const bytes = await pdf.save();
    onProgress?.(100, 'Watermark applied.');
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Add page numbers to all pages (e.g. "Page 1 of 12")
   */
  public static async addPageNumbers(
    file: File,
    options?: {
      format?: 'Page X of Y' | 'X / Y' | 'X';
      position?: 'bottom-center' | 'bottom-right' | 'top-right';
      fontSize?: number;
    },
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Loading PDF...');
    const buffer = await file.arrayBuffer();
    const pdf = await PDFDocument.load(buffer, { ignoreEncryption: true });
    const font = await pdf.embedFont(StandardFonts.Helvetica);

    const pages = pdf.getPages();
    const totalPages = pages.length;
    const fontSize = options?.fontSize || 10;
    const position = options?.position || 'bottom-center';
    const format = options?.format || 'Page X of Y';

    for (let i = 0; i < totalPages; i++) {
      onProgress?.(
        Math.round(20 + (i / totalPages) * 70),
        `Numbering page ${i + 1} of ${totalPages}...`
      );
      const page = pages[i];
      const { width, height } = page.getSize();

      let label = '';
      if (format === 'Page X of Y') label = `Page ${i + 1} of ${totalPages}`;
      else if (format === 'X / Y') label = `${i + 1} / ${totalPages}`;
      else label = `${i + 1}`;

      const textWidth = font.widthOfTextAtSize(label, fontSize);

      let x = 0;
      let y = 0;

      if (position === 'bottom-center') {
        x = (width - textWidth) / 2;
        y = 25;
      } else if (position === 'bottom-right') {
        x = width - textWidth - 40;
        y = 25;
      } else {
        // top-right
        x = width - textWidth - 40;
        y = height - 30;
      }

      page.drawText(label, {
        x,
        y,
        size: fontSize,
        font,
        color: rgb(0.35, 0.35, 0.35),
      });
    }

    onProgress?.(95, 'Saving numbered document...');
    const bytes = await pdf.save();
    onProgress?.(100, 'Page numbering complete.');
    return new Blob([bytes as any], { type: 'application/pdf' });
  }

  /**
   * Helper: Parses strings like "1, 3, 5-8" into 0-indexed integer array
   */
  public static parsePageRanges(rangeStr: string, maxPages: number): number[] {
    const indices: Set<number> = new Set();
    const parts = rangeStr.split(',').map((p) => p.trim());

    for (const part of parts) {
      if (!part) continue;

      if (part.includes('-')) {
        const [startStr, endStr] = part.split('-').map((s) => s.trim());
        const start = parseInt(startStr, 10);
        const end = parseInt(endStr, 10);

        if (!isNaN(start) && !isNaN(end)) {
          const from = Math.max(1, Math.min(start, end));
          const to = Math.min(maxPages, Math.max(start, end));
          for (let p = from; p <= to; p++) {
            indices.add(p - 1);
          }
        }
      } else {
        const page = parseInt(part, 10);
        if (!isNaN(page) && page >= 1 && page <= maxPages) {
          indices.add(page - 1);
        }
      }
    }

    return Array.from(indices).sort((a, b) => a - b);
  }
}

