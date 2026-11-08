import DOMPurify from 'dompurify';
import { PDFDocument } from 'pdf-lib';

export interface ImageConversionOptions {
  targetFormat: 'png' | 'jpeg' | 'webp' | 'bmp' | 'ico' | 'svg' | 'gif';
  quality?: number; // 0.1 to 1.0
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio?: boolean;
}

export interface ImageToPdfItem {
  id: string;
  file: File | Blob;
  name: string;
  size: number;
  rotation?: number; // 0, 90, 180, 270
}

export interface ImagesToPdfOptions {
  pageSize?: 'a4' | 'letter' | 'fit';
  orientation?: 'portrait' | 'landscape' | 'auto';
  margin?: 'none' | 'small' | 'big';
}

export class ImageConverter {
  /**
   * Universal client-side image conversion using hardware-accelerated Canvas API
   */
  public static async convertImage(
    file: File | Blob,
    options: ImageConversionOptions,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(15, 'Loading image into memory...');

    // Special formats: ICO, BMP, SVG
    if (options.targetFormat === 'ico') {
      return this.imageToIco(file, onProgress);
    }
    if (options.targetFormat === 'bmp') {
      return this.imageToBmp(file, onProgress);
    }
    if (options.targetFormat === 'svg') {
      return this.imageToSvg(file, onProgress);
    }

    const objectUrl = URL.createObjectURL(file);

    try {
      const img = await this.loadImage(objectUrl);
      onProgress?.(45, 'Processing image dimensions and scaling...');

      let targetWidth = img.naturalWidth || img.width;
      let targetHeight = img.naturalHeight || img.height;

      // Handle resize constraints
      if (options.maxWidth || options.maxHeight) {
        const mw = options.maxWidth || targetWidth;
        const mh = options.maxHeight || targetHeight;

        if (options.keepAspectRatio !== false) {
          const ratio = Math.min(mw / targetWidth, mh / targetHeight);
          targetWidth = Math.round(targetWidth * ratio);
          targetHeight = Math.round(targetHeight * ratio);
        } else {
          targetWidth = mw;
          targetHeight = mh;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d', { willReadFrequently: false });
      if (!ctx) throw new Error('Failed to get Canvas 2D rendering context');

      // If converting to JPEG, fill canvas with white background
      if (options.targetFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, targetWidth, targetHeight);
      }

      onProgress?.(70, 'Rendering high-resolution canvas...');
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      const mimeType =
        options.targetFormat === 'jpeg'
          ? 'image/jpeg'
          : options.targetFormat === 'webp'
          ? 'image/webp'
          : options.targetFormat === 'gif'
          ? 'image/gif'
          : 'image/png';
      const quality = options.quality ?? 0.85;

      onProgress?.(85, `Encoding into ${options.targetFormat.toUpperCase()} format...`);

      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob(
          (b) => {
            if (b) resolve(b);
            else reject(new Error('Canvas encoding failed to produce an image Blob'));
          },
          mimeType,
          quality
        );
      });

      canvas.width = 1;
      canvas.height = 1;

      onProgress?.(100, 'Image conversion complete.');
      return blob;
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
  }

  /**
   * Convert image to standard .ico file
   */
  public static async imageToIco(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(30, 'Rendering 32x32 favicon bitmap...');
    const url = URL.createObjectURL(file);
    try {
      const img = await this.loadImage(url);
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0, 32, 32);

      const pngBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/png');
      });
      const pngBuffer = await pngBlob.arrayBuffer();
      const pngBytes = new Uint8Array(pngBuffer);

      onProgress?.(75, 'Packaging ICO directory and headers...');
      // 6-byte ICONDIR + 16-byte ICONDIRENTRY + PNG byte stream
      const icoLength = 6 + 16 + pngBytes.length;
      const icoBuffer = new ArrayBuffer(icoLength);
      const view = new DataView(icoBuffer);

      // ICONDIR
      view.setUint16(0, 0, true); // Reserved
      view.setUint16(2, 1, true); // 1 = ICO
      view.setUint16(4, 1, true); // 1 Image

      // ICONDIRENTRY
      view.setUint8(6, 32); // Width
      view.setUint8(7, 32); // Height
      view.setUint8(8, 0); // Palette count
      view.setUint8(9, 0); // Reserved
      view.setUint16(10, 1, true); // Color planes
      view.setUint16(12, 32, true); // Bits per pixel
      view.setUint32(14, pngBytes.length, true); // Size
      view.setUint32(18, 22, true); // Offset of image data (6+16)

      const icoBytes = new Uint8Array(icoBuffer);
      icoBytes.set(pngBytes, 22);

      onProgress?.(100, 'ICO generated successfully.');
      return new Blob([icoBuffer], { type: 'image/x-icon' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Convert image to Windows Bitmap (BMP)
   */
  public static async imageToBmp(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(30, 'Extracting pixel array...');
    const url = URL.createObjectURL(file);
    try {
      const img = await this.loadImage(url);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;

      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');
      ctx.drawImage(img, 0, 0);

      const imgData = ctx.getImageData(0, 0, w, h);
      const rgba = imgData.data;

      // BMP row size must be multiple of 4 bytes
      const rowSize = Math.floor((24 * w + 31) / 32) * 4;
      const pixelArraySize = rowSize * h;
      const fileSize = 54 + pixelArraySize;

      const buffer = new ArrayBuffer(fileSize);
      const view = new DataView(buffer);

      // BITMAPFILEHEADER
      view.setUint16(0, 0x4d42, false); // 'BM'
      view.setUint32(2, fileSize, true);
      view.setUint32(6, 0, true);
      view.setUint32(10, 54, true); // Offset

      // BITMAPINFOHEADER
      view.setUint32(14, 40, true); // Header size
      view.setInt32(18, w, true);
      view.setInt32(22, h, true); // Bottom-up
      view.setUint16(26, 1, true); // Planes
      view.setUint16(28, 24, true); // 24-bit BGR
      view.setUint32(30, 0, true); // BI_RGB
      view.setUint32(34, pixelArraySize, true);
      view.setInt32(38, 2835, true); // 72 DPI
      view.setInt32(42, 2835, true);
      view.setUint32(46, 0, true);
      view.setUint32(50, 0, true);

      // Write BGR pixels bottom-up
      const bytes = new Uint8Array(buffer);
      for (let y = 0; y < h; y++) {
        const bmpRowOffset = 54 + (h - 1 - y) * rowSize;
        for (let x = 0; x < w; x++) {
          const rgbaIdx = (y * w + x) * 4;
          const r = rgba[rgbaIdx];
          const g = rgba[rgbaIdx + 1];
          const b = rgba[rgbaIdx + 2];

          bytes[bmpRowOffset + x * 3] = b;
          bytes[bmpRowOffset + x * 3 + 1] = g;
          bytes[bmpRowOffset + x * 3 + 2] = r;
        }
      }

      onProgress?.(100, 'BMP generated successfully.');
      return new Blob([buffer], { type: 'image/bmp' });
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Convert image to SVG container
   */
  public static async imageToSvg(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(30, 'Reading image data...');
    const reader = new FileReader();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read image as data URL'));
      reader.readAsDataURL(file);
    });

    const img = await this.loadImage(dataUrl);
    const w = img.naturalWidth || 800;
    const h = img.naturalHeight || 600;

    const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}" width="${w}" height="${h}">
  <image href="${dataUrl}" x="0" y="0" width="${w}" height="${h}" preserveAspectRatio="xMidYMid meet" />
</svg>`;

    onProgress?.(100, 'SVG vector container created.');
    return new Blob([svgContent], { type: 'image/svg+xml;charset=utf-8' });
  }

  /**
   * SVG to PNG / JPG / WEBP rasterization with DOMPurify sanitization
   */
  public static async svgToRaster(
    file: File,
    targetFormat: 'png' | 'jpeg' | 'webp' = 'png',
    scale = 2,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Sanitizing SVG vector data...');
    const svgText = await file.text();

    const cleanSvg = DOMPurify.sanitize(svgText, {
      USE_PROFILES: { svg: true, svgFilters: true },
    });

    const svgBlob = new Blob([cleanSvg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    try {
      onProgress?.(50, 'Rasterizing SVG vector paths...');
      const img = await this.loadImage(url);
      const width = (img.naturalWidth || 800) * scale;
      const height = (img.naturalHeight || 600) * scale;

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create 2D canvas context');

      if (targetFormat === 'jpeg') {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
      }

      ctx.drawImage(img, 0, 0, width, height);

      const mimeType = targetFormat === 'jpeg' ? 'image/jpeg' : targetFormat === 'webp' ? 'image/webp' : 'image/png';

      onProgress?.(85, 'Encoding raster image...');
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), mimeType, 0.95);
      });

      return blob;
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  /**
   * Convert multiple images into a single unified multi-page PDF document
   */
  public static async multipleImagesToPdf(
    items: ImageToPdfItem[],
    options?: ImagesToPdfOptions,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    if (items.length === 0) {
      throw new Error('At least one image is required to build a PDF.');
    }

    onProgress?.(10, 'Initializing PDF document container...');
    const pdfDoc = await PDFDocument.create();

    const pageSize = options?.pageSize || 'a4';
    const orientation = options?.orientation || 'portrait';
    const margin = options?.margin || 'none';

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      onProgress?.(
        Math.round(15 + (i / items.length) * 75),
        `Processing page ${i + 1} of ${items.length}: ${item.name}...`
      );

      const objectUrl = URL.createObjectURL(item.file);
      try {
        const img = await this.loadImage(objectUrl);
        const naturalW = img.naturalWidth || img.width;
        const naturalH = img.naturalHeight || img.height;

        const rotation = item.rotation || 0;
        const isSwapped = rotation === 90 || rotation === 270;
        const rotW = isSwapped ? naturalH : naturalW;
        const rotH = isSwapped ? naturalW : naturalH;

        const canvas = document.createElement('canvas');
        canvas.width = rotW;
        canvas.height = rotH;
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error('Could not create 2D canvas context');

        ctx.save();
        if (rotation === 90) {
          ctx.translate(rotW, 0);
          ctx.rotate(Math.PI / 2);
        } else if (rotation === 180) {
          ctx.translate(rotW, rotH);
          ctx.rotate(Math.PI);
        } else if (rotation === 270) {
          ctx.translate(0, rotH);
          ctx.rotate((3 * Math.PI) / 2);
        }
        ctx.drawImage(img, 0, 0);
        ctx.restore();

        const pngBlob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b || new Blob()), 'image/png', 0.98);
        });
        const pngBytes = await pngBlob.arrayBuffer();
        const embeddedImg = await pdfDoc.embedPng(pngBytes);

        let pWidth = 595.28;
        let pHeight = 841.89;
        let marginPoints = 0;

        if (margin === 'small') marginPoints = 20;
        else if (margin === 'big') marginPoints = 40;

        if (pageSize === 'fit') {
          pWidth = rotW + marginPoints * 2;
          pHeight = rotH + marginPoints * 2;
        } else if (pageSize === 'letter') {
          const isLandscape = orientation === 'landscape' || (orientation === 'auto' && rotW > rotH);
          pWidth = isLandscape ? 792 : 612;
          pHeight = isLandscape ? 612 : 792;
        } else {
          const isLandscape = orientation === 'landscape' || (orientation === 'auto' && rotW > rotH);
          pWidth = isLandscape ? 841.89 : 595.28;
          pHeight = isLandscape ? 595.28 : 841.89;
        }

        const maxContentW = pWidth - marginPoints * 2;
        const maxContentH = pHeight - marginPoints * 2;

        const scale = Math.min(maxContentW / rotW, maxContentH / rotH, 1);
        const drawW = rotW * scale;
        const drawH = rotH * scale;

        const page = pdfDoc.addPage([pWidth, pHeight]);
        const x = (pWidth - drawW) / 2;
        const y = (pHeight - drawH) / 2;

        page.drawImage(embeddedImg, {
          x,
          y,
          width: drawW,
          height: drawH,
        });

        canvas.width = 1;
        canvas.height = 1;
      } finally {
        URL.revokeObjectURL(objectUrl);
      }
    }

    onProgress?.(95, 'Finalizing multi-page PDF document...');
    const pdfBytes = await pdfDoc.save({ useObjectStreams: true });
    onProgress?.(100, `Successfully created ${items.length}-page PDF document.`);
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Convert any Image (JPG, PNG, WebP, SVG) to a pristine PDF Document
   */
  public static async imageToPdf(
    file: File | Blob,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    return this.multipleImagesToPdf(
      [{ id: '1', file, name: (file as File).name || 'image', size: file.size, rotation: 0 }],
      { pageSize: 'a4', orientation: 'auto', margin: 'small' },
      onProgress
    );
  }

  private static loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Image failed to decode'));
      img.src = src;
    });
  }
}
