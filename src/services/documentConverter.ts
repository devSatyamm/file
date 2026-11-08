import * as pdfjsLib from 'pdfjs-dist';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import mammoth from 'mammoth';
import DOMPurify from 'dompurify';
import JSZip from 'jszip';
import * as XLSX from 'xlsx';

// Configure PDF.js worker to use the local offline precached worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';
}

export interface ProgressCallback {
  (progress: number, message?: string): void;
}

export interface SlideTextItem {
  text: string;
  level: number;
  isBold?: boolean;
}

export interface SlideTableItem {
  rows: string[][];
}

export interface SlideImageItem {
  rId: string;
  dataUrl?: string;
  blob?: Blob;
  mime?: string;
}

export interface ExtractedSlide {
  slideNumber: number;
  title: string;
  subtitle?: string;
  items: SlideTextItem[];
  tables: SlideTableItem[];
  images: SlideImageItem[];
}

export interface PresentationData {
  aspectRatio: number;
  slides: ExtractedSlide[];
  totalSlides: number;
}

export class DocumentConverter {
  /**
   * PDF to Plain Text Extraction
   */
  public static async pdfToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(10, 'Loading PDF document...');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    let fullText = `--- Extracted from ${file.name} (${numPages} pages) ---\n\n`;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.(Math.round(10 + (pageNum / numPages) * 80), `Extracting text from page ${pageNum} of ${numPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      
      let lastY: number | null = null;
      let pageText = '';

      for (const item of textContent.items as any[]) {
        if ('str' in item) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            pageText += '\n';
          }
          pageText += item.str + ' ';
          lastY = item.transform[5];
        }
      }

      fullText += `--- Page ${pageNum} ---\n${pageText.trim()}\n\n`;
    }

    onProgress?.(100, 'Text extraction complete.');
    return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * PDF to Image(s) (PNG)
   * If single page -> returns image/png Blob
   * If multi-page -> bundles into a ZIP file with page_1.png, page_2.png...
   */
  public static async pdfToImages(file: File, onProgress?: ProgressCallback): Promise<{ blob: Blob; isZip: boolean }> {
    onProgress?.(10, 'Initializing PDF renderer...');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const zip = new JSZip();
    let singleBlob: Blob | null = null;

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.(Math.round(10 + (pageNum / numPages) * 80), `Rendering page ${pageNum} of ${numPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for sharp output

      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not create 2D canvas context for PDF rendering');

      await (page.render({ canvasContext: ctx, viewport } as any)).promise;

      const pageBlob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b || new Blob()), 'image/png', 0.95);
      });

      if (numPages === 1) {
        singleBlob = pageBlob;
      } else {
        const pageBuffer = await pageBlob.arrayBuffer();
        zip.file(`page_${String(pageNum).padStart(2, '0')}.png`, pageBuffer);
      }
    }

    onProgress?.(95, 'Packaging image output...');
    if (numPages === 1 && singleBlob) {
      onProgress?.(100, 'Image ready.');
      return { blob: singleBlob, isZip: false };
    } else {
      const zipBlob = await zip.generateAsync({ type: 'blob' });
      onProgress?.(100, 'Pages archived to ZIP.');
      return { blob: zipBlob, isZip: true };
    }
  }

  /**
   * DOCX to HTML
   */
  public static async docxToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(20, 'Reading DOCX document...');
    const arrayBuffer = await file.arrayBuffer();
    onProgress?.(50, 'Converting Word formatting to HTML...');
    const result = await mammoth.convertToHtml({ arrayBuffer });
    
    // Sanitize with DOMPurify to prevent XSS / malicious injection
    const cleanHtml = DOMPurify.sanitize(result.value);

    const fullDocumentHtml = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${file.name.replace(/\.[^/.]+$/, '')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #0f172a; margin-top: 1.5em; }
    table { border-collapse: collapse; width: 100%; margin: 1.5em 0; }
    th, td { border: 1px solid #cbd5e1; padding: 8px 12px; text-align: left; }
    th { background: #f1f5f9; }
    blockquote { border-left: 4px solid #94a3b8; margin: 1em 0; padding-left: 1em; color: #475569; }
  </style>
</head>
<body>
  ${cleanHtml}
</body>
</html>`;

    onProgress?.(100, 'HTML generated successfully.');
    return new Blob([fullDocumentHtml], { type: 'text/html;charset=utf-8' });
  }

  /**
   * DOCX to Plain Text
   */
  public static async docxToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(30, 'Parsing DOCX structure...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress?.(100, 'Extracted text from DOCX.');
    return new Blob([result.value], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * Word (DOCX) to PDF
   */
  public static async docxToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(20, 'Reading DOCX document structure...');
    const arrayBuffer = await file.arrayBuffer();
    const result = await mammoth.extractRawText({ arrayBuffer });
    onProgress?.(60, 'Rendering text to paginated PDF...');
    return this.renderTextToPdf(result.value || '[Empty Document]', file.name.replace(/\.[^/.]+$/, ''), onProgress);
  }

  /**
   * PDF to Word (DOCX) - Real Microsoft Word OpenXML generation via JSZip
   */
  public static async pdfToDocx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(15, 'Loading PDF for Word conversion...');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const paragraphs: string[] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.(Math.round(15 + (pageNum / numPages) * 65), `Extracting Page ${pageNum} of ${numPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      let lastY: number | null = null;
      let line = '';

      for (const item of textContent.items as any[]) {
        if ('str' in item) {
          if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
            if (line.trim()) paragraphs.push(line.trim());
            line = '';
          }
          line += item.str + ' ';
          lastY = item.transform[5];
        }
      }
      if (line.trim()) paragraphs.push(line.trim());
    }

    onProgress?.(85, 'Packaging into Microsoft Word DOCX container...');
    const zip = new JSZip();

    // 1. [Content_Types].xml
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`
    );

    // 2. _rels/.rels
    zip.folder('_rels')?.file(
      '.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`
    );

    // 3. word/document.xml
    const paragraphsXml = paragraphs
      .map((p) => `<w:p><w:r><w:t>${this.escapeXml(p)}</w:t></w:r></w:p>`)
      .join('');

    zip.folder('word')?.file(
      'document.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    ${paragraphsXml || '<w:p><w:r><w:t>[Empty Document]</w:t></w:r></w:p>'}
  </w:body>
</w:document>`
    );

    const docxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    });

    onProgress?.(100, 'Word document generated.');
    return docxBlob;
  }

  /**
   * PDF to Excel (XLSX) - Extracts tabular rows from PDF text coordinates
   */
  public static async pdfToXlsx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(20, 'Analyzing PDF tables & layout...');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const allRows: string[][] = [];

    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.(Math.round(20 + (pageNum / numPages) * 60), `Processing Page ${pageNum} of ${numPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();

      // Group text items by vertical position Y (within a threshold)
      const rowMap: Map<number, { x: number; text: string }[]> = new Map();

      for (const item of textContent.items as any[]) {
        if ('str' in item && item.str.trim()) {
          const y = Math.round(item.transform[5]);
          const x = item.transform[4];

          // Find existing row within 4 points
          let matchedKey: number | null = null;
          for (const key of rowMap.keys()) {
            if (Math.abs(key - y) <= 4) {
              matchedKey = key;
              break;
            }
          }

          if (matchedKey !== null) {
            rowMap.get(matchedKey)!.push({ x, text: item.str });
          } else {
            rowMap.set(y, [{ x, text: item.str }]);
          }
        }
      }

      // Sort rows top-to-bottom (Y desc in PDF)
      const sortedKeys = Array.from(rowMap.keys()).sort((a, b) => b - a);

      for (const k of sortedKeys) {
        const cells = rowMap.get(k)!.sort((a, b) => a.x - b.x);
        allRows.push(cells.map((c) => c.text.trim()));
      }
    }

    onProgress?.(85, 'Generating Excel spreadsheet...');
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(allRows.length > 0 ? allRows : [['No structured data extracted']]);
    XLSX.utils.book_append_sheet(wb, ws, 'Extracted Data');

    const xlsxBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    onProgress?.(100, 'Excel spreadsheet ready.');
    return new Blob([xlsxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * PDF to PowerPoint (PPTX) - Creates real presentation slides from PDF pages
   */
  public static async pdfToPptx(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(20, 'Reading PDF pages for slides...');
    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer });
    const pdfDoc = await loadingTask.promise;
    const numPages = pdfDoc.numPages;

    const zip = new JSZip();

    // Minimal valid PPTX OpenXML structure
    zip.file(
      '[Content_Types].xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>
  ${Array.from({ length: numPages }, (_, i) => `<Override PartName="/ppt/slides/slide${i + 1}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>`).join('')}
</Types>`
    );

    zip.folder('_rels')?.file(
      '.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>
</Relationships>`
    );

    // Presentation XML
    const slideIdList = Array.from(
      { length: numPages },
      (_, i) => `<p:sldId id="${256 + i}" r:id="rId${i + 1}"/>`
    ).join('');

    zip.folder('ppt')?.file(
      'presentation.xml',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:presentation xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <p:sldIdLst>${slideIdList}</p:sldIdLst>
</p:presentation>`
    );

    // Presentation rels
    const presRels = Array.from(
      { length: numPages },
      (_, i) => `<Relationship Id="rId${i + 1}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide${i + 1}.xml"/>`
    ).join('');

    zip.folder('ppt')?.folder('_rels')?.file(
      'presentation.xml.rels',
      `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  ${presRels}
</Relationships>`
    );

    // Slide XMLs
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      onProgress?.(Math.round(20 + (pageNum / numPages) * 70), `Building Slide ${pageNum} of ${numPages}...`);
      const page = await pdfDoc.getPage(pageNum);
      const textContent = await page.getTextContent();
      const text = textContent.items
        .map((i: any) => ('str' in i ? i.str : ''))
        .filter(Boolean)
        .join(' ');

      const slideXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<p:sld xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main">
  <p:cSld>
    <p:spTree>
      <p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/><p:nvPr/></p:nvGrpSpPr>
      <p:grpSpPr/>
      <p:sp>
        <p:nvSpPr><p:cNvPr id="2" name="Title"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>
        <p:spPr/>
        <p:txBody>
          <a:bodyPr/>
          <a:p><a:r><a:t>${this.escapeXml(`Slide ${pageNum}`)}</a:t></a:r></a:p>
          <a:p><a:r><a:t>${this.escapeXml(text.slice(0, 500) || '[Slide Content]')}</a:t></a:r></a:p>
        </p:txBody>
      </p:sp>
    </p:spTree>
  </p:cSld>
</p:sld>`;

      zip.folder('ppt')?.folder('slides')?.file(`slide${pageNum}.xml`, slideXml);
    }

    const pptxBlob = await zip.generateAsync({
      type: 'blob',
      mimeType: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    });

    onProgress?.(100, 'PowerPoint presentation generated.');
    return pptxBlob;
  }

  /**
   * Parse slide XML data extracting titles, subtitles, formatted paragraphs, tables, and image references
   */
  private static parseSlideXmlData(slideXml: string): {
    title: string;
    subtitle?: string;
    items: SlideTextItem[];
    tables: SlideTableItem[];
    imageRIds: string[];
  } {
    let title = '';
    let subtitle = '';
    const items: SlideTextItem[] = [];
    const tables: SlideTableItem[] = [];
    const imageRIds: string[] = [];

    const decodeXml = (str: string) =>
      str
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&apos;/g, "'")
        .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)))
        .replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

    // 1. Try DOMParser if available in browser
    if (typeof DOMParser !== 'undefined') {
      try {
        const parser = new DOMParser();
        const doc = parser.parseFromString(slideXml, 'application/xml');
        const parseError = doc.querySelector('parsererror');

        if (!parseError) {
          const allElements = Array.from(doc.getElementsByTagName('*'));

          // Extract shapes
          const shapes = allElements.filter((el) => el.localName === 'sp');
          for (const shape of shapes) {
            const desc = Array.from(shape.getElementsByTagName('*'));
            const ph = desc.find((el) => el.localName === 'ph');
            const phType = (ph?.getAttribute('type') || '').toLowerCase();
            const cNvPr = desc.find((el) => el.localName === 'cNvPr');
            const shapeName = (cNvPr?.getAttribute('name') || '').toLowerCase();

            const isTitleShape = phType === 'title' || phType === 'ctrtitle' || shapeName.includes('title');
            const isSubShape = phType === 'subtitle' || shapeName.includes('subtitle');

            const paragraphs = desc.filter((el) => el.localName === 'p');
            for (const p of paragraphs) {
              const pDesc = Array.from(p.getElementsByTagName('*'));
              const pPr = pDesc.find((el) => el.localName === 'pPr');
              const lvlAttr = pPr?.getAttribute('lvl');
              const level = lvlAttr ? Math.min(3, Math.max(0, parseInt(lvlAttr, 10))) : 0;

              const tNodes = pDesc.filter((el) => el.localName === 't');
              const pText = tNodes.map((t) => t.textContent || '').join('').trim();
              if (!pText) continue;

              const isBold = pDesc.some((el) => el.localName === 'rPr' && el.getAttribute('b') === '1');

              if (isTitleShape && !title) {
                title = decodeXml(pText);
              } else if (isSubShape && !subtitle) {
                subtitle = decodeXml(pText);
              } else {
                items.push({ text: decodeXml(pText), level, isBold });
              }
            }
          }

          // Extract tables
          const tableElements = allElements.filter((el) => el.localName === 'tbl');
          for (const tbl of tableElements) {
            const trElements = Array.from(tbl.getElementsByTagName('*')).filter((el) => el.localName === 'tr');
            const rows: string[][] = [];
            for (const tr of trElements) {
              const tcElements = Array.from(tr.getElementsByTagName('*')).filter((el) => el.localName === 'tc');
              const row = tcElements.map((tc) => {
                const tNodes = Array.from(tc.getElementsByTagName('*')).filter((el) => el.localName === 't');
                return decodeXml(tNodes.map((t) => t.textContent || '').join('').trim());
              });
              if (row.some(Boolean)) rows.push(row);
            }
            if (rows.length > 0) tables.push({ rows });
          }

          // Extract image blips
          const blips = allElements.filter((el) => el.localName === 'blip');
          for (const blip of blips) {
            for (let a = 0; a < blip.attributes.length; a++) {
              const attr = blip.attributes[a];
              if (attr.name.toLowerCase().endsWith('embed')) {
                imageRIds.push(attr.value);
              }
            }
          }
        }
      } catch {
        // Fall back to regex parser
      }
    }

    // 2. Fallback: Regex shape parser if DOMParser found nothing
    if (!title && items.length === 0) {
      const shapeMatches = [...slideXml.matchAll(/<[a-zA-Z0-9:]*sp\b(?:(?!<\/[a-zA-Z0-9:]*sp>)[\s\S])*?<\/[a-zA-Z0-9:]*sp>/gi)];
      for (const sm of shapeMatches) {
        const sXml = sm[0];
        const isTitle = /type=["'](?:title|ctrTitle)["']/i.test(sXml) || /name=["'][^"']*title/i.test(sXml);
        const isSub = /type=["']subTitle["']/i.test(sXml);

        const pMatches = [...sXml.matchAll(/<[a-zA-Z0-9:]*p\b(?:(?!<\/[a-zA-Z0-9:]*p>)[\s\S])*?<\/[a-zA-Z0-9:]*p>/gi)];
        for (const pm of pMatches) {
          const pXml = pm[0];
          const lvlMatch = pXml.match(/lvl=["'](\d+)["']/i);
          const level = lvlMatch ? parseInt(lvlMatch[1], 10) : 0;
          const isBold = /<[a-zA-Z0-9:]*rPr\b[^>]*b=["']1["']/i.test(pXml);

          const tMatches = [...pXml.matchAll(/<[a-zA-Z0-9:]*t[^>]*>([\s\S]*?)<\/[a-zA-Z0-9:]*t>/gi)];
          const text = decodeXml(tMatches.map((m) => m[1]).join('').trim());
          if (!text) continue;

          if (isTitle && !title) {
            title = text;
          } else if (isSub && !subtitle) {
            subtitle = text;
          } else {
            items.push({ text, level, isBold });
          }
        }
      }

      const blipMatches = [...slideXml.matchAll(/<[a-zA-Z0-9:]*blip[^>]*embed=["']([^"']+)["']/gi)];
      for (const bm of blipMatches) {
        imageRIds.push(bm[1]);
      }
    }

    // 3. Fallback: If title missing and first item is short, promote it
    if (!title && items.length > 0 && items[0].text.length <= 100) {
      title = items.shift()!.text;
    }

    // 4. Universal Fallback: Scan any text nodes
    if (!title && items.length === 0) {
      const allTextMatches = [...slideXml.matchAll(/<[a-zA-Z0-9:]*t[^>]*>([\s\S]*?)<\/[a-zA-Z0-9:]*t>/gi)];
      const rawLines = allTextMatches.map((m) => decodeXml(m[1].trim())).filter(Boolean);
      if (rawLines.length > 0) {
        title = rawLines[0];
        for (let j = 1; j < rawLines.length; j++) {
          items.push({ text: rawLines[j], level: 0 });
        }
      }
    }

    return { title, subtitle, items, tables, imageRIds };
  }

  /**
   * Helper to convert Blob to DataURL
   */
  private static blobToDataUrl(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Extract presentation structure from PPTX zip or legacy binary PPT
   */
  public static async extractPresentation(file: File, onProgress?: ProgressCallback): Promise<PresentationData> {
    onProgress?.(15, 'Reading PowerPoint document structure...');
    const arrayBuffer = await file.arrayBuffer();
    const bytes = new Uint8Array(arrayBuffer);

    // Detect legacy binary .ppt (OLE CFBF: D0 CF 11 E0)
    const isBinaryPpt =
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0;

    if (isBinaryPpt) {
      return this.extractFromBinaryPpt(file, bytes);
    }

    try {
      const zip = await JSZip.loadAsync(arrayBuffer);

      // 1. Determine slide aspect ratio
      let aspectRatio = 16 / 9; // Default widescreen
      const presXmlFile = zip.files['ppt/presentation.xml'];
      if (presXmlFile) {
        const presXml = await presXmlFile.async('text');
        const szMatch = presXml.match(/<[a-zA-Z0-9:]*sldSz[^>]*cx=["'](\d+)["'][^>]*cy=["'](\d+)["']/i);
        if (szMatch) {
          const cx = parseInt(szMatch[1], 10);
          const cy = parseInt(szMatch[2], 10);
          if (cx > 0 && cy > 0) {
            aspectRatio = cx / cy;
          }
        }
      }

      // 2. Discover slide files
      let slidePaths: string[] = [];
      const relsFile = zip.files['ppt/_rels/presentation.xml.rels'];
      if (relsFile && presXmlFile) {
        try {
          const presXml = await presXmlFile.async('text');
          const relsXml = await relsFile.async('text');
          const relMap = new Map<string, string>();
          const relMatches = [...relsXml.matchAll(/<Relationship[^>]*Id=["']([^"']+)["'][^>]*Target=["']([^"']+)["']/gi)];
          for (const rm of relMatches) {
            relMap.set(rm[1], rm[2].replace(/^slides\//, 'ppt/slides/').replace(/^ppt\/ppt\//, 'ppt/'));
          }

          const sldIdMatches = [...presXml.matchAll(/<[a-zA-Z0-9:]*sldId[^>]*id=["']([^"']+)["'][^>]*embed=["']([^"']+)["']/gi)];
          for (const sm of sldIdMatches) {
            const target = relMap.get(sm[2]);
            if (target && zip.files[target]) {
              slidePaths.push(target);
            }
          }
        } catch {
          // fallback
        }
      }

      if (slidePaths.length === 0) {
        slidePaths = Object.keys(zip.files)
          .filter((name) => /^ppt\/slides\/slide\d+\.xml$/i.test(name))
          .sort((a, b) => {
            const numA = parseInt(a.match(/\d+/)?.[0] || '0', 10);
            const numB = parseInt(b.match(/\d+/)?.[0] || '0', 10);
            return numA - numB;
          });
      }

      const slides: ExtractedSlide[] = [];

      for (let i = 0; i < slidePaths.length; i++) {
        const slidePath = slidePaths[i];
        onProgress?.(
          Math.round(20 + (i / Math.max(1, slidePaths.length)) * 35),
          `Analyzing slide ${i + 1} of ${slidePaths.length}...`
        );

        const slideXml = await zip.files[slidePath].async('text');
        const parsed = this.parseSlideXmlData(slideXml);

        const slideNumMatch = slidePath.match(/slide(\d+)\.xml/i);
        const slideNum = slideNumMatch ? slideNumMatch[1] : `${i + 1}`;
        const slideRelsPath = `ppt/slides/_rels/slide${slideNum}.xml.rels`;
        const slideImages: SlideImageItem[] = [];

        if (zip.files[slideRelsPath]) {
          try {
            const relsXml = await zip.files[slideRelsPath].async('text');
            const relMatches = [...relsXml.matchAll(/<Relationship[^>]*Id=["']([^"']+)["'][^>]*Target=["']([^"']+)["']/gi)];
            const relMap = new Map<string, string>();
            for (const rm of relMatches) {
              relMap.set(rm[1], rm[2]);
            }

            for (const rId of parsed.imageRIds) {
              const target = relMap.get(rId);
              if (target) {
                const normalizedPath = target.replace(/^\.\.\//, 'ppt/');
                const imgZipFile = zip.files[normalizedPath];
                if (imgZipFile) {
                  const blob = await imgZipFile.async('blob');
                  const dataUrl = await this.blobToDataUrl(blob);
                  slideImages.push({ rId, dataUrl, blob, mime: blob.type });
                }
              }
            }
          } catch {
            // continue without images
          }
        }

        slides.push({
          slideNumber: i + 1,
          title: parsed.title,
          subtitle: parsed.subtitle,
          items: parsed.items,
          tables: parsed.tables,
          images: slideImages,
        });
      }

      return {
        aspectRatio,
        slides,
        totalSlides: slides.length,
      };
    } catch {
      return this.extractFromBinaryPpt(file, bytes);
    }
  }

  /**
   * Fallback binary string extraction for legacy PowerPoint 97-2003 (.ppt)
   */
  private static extractFromBinaryPpt(file: File, bytes: Uint8Array): PresentationData {
    const strings: string[] = [];
    let curAscii = '';
    for (let i = 0; i < bytes.length; i++) {
      const b = bytes[i];
      if (b >= 32 && b <= 126) {
        curAscii += String.fromCharCode(b);
      } else {
        if (curAscii.length >= 4) {
          strings.push(curAscii);
        }
        curAscii = '';
      }
    }

    const ignored = new Set([
      'root entry',
      'powerpoint document',
      'current user',
      'summaryinformation',
      'documentsummaryinformation',
      'calibri',
      'arial',
      'times new roman',
      'segoe ui',
      'helvetica',
      'standard',
      'microsoft powerpoint',
    ]);

    const cleanLines = strings.filter((s) => {
      const trimmed = s.trim();
      return trimmed.length > 2 && !ignored.has(trimmed.toLowerCase());
    });

    const slides: ExtractedSlide[] = [];
    const linesPerSlide = 5;
    const total = Math.max(1, Math.ceil(cleanLines.length / linesPerSlide));

    for (let i = 0; i < total; i++) {
      const chunk = cleanLines.slice(i * linesPerSlide, (i + 1) * linesPerSlide);
      const title = chunk[0] || `Slide ${i + 1}`;
      const items = chunk.slice(1).map((t) => ({ text: t, level: 0 }));
      slides.push({
        slideNumber: i + 1,
        title,
        items,
        tables: [],
        images: [],
      });
    }

    return {
      aspectRatio: 16 / 9,
      slides,
      totalSlides: slides.length,
    };
  }

  /**
   * PowerPoint (PPT / PPTX) to Landscape PDF with full slide graphics, titles, bullets, tables & photos
   */
  public static async pptxToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    const presentation = await this.extractPresentation(file, onProgress);
    const totalSlides = presentation.slides.length;

    if (totalSlides === 0) {
      throw new Error('No readable slides could be extracted from this PowerPoint presentation.');
    }

    onProgress?.(55, `Compiling ${totalSlides} slides into PDF...`);
    const pdfDoc = await PDFDocument.create();

    // Standard Landscape A4 width: 841.89 pt
    const pageWidth = 841.89;
    const pageHeight = Math.round(pageWidth / presentation.aspectRatio);

    const canvasWidth = 1920;
    const canvasHeight = Math.round(canvasWidth / presentation.aspectRatio);

    for (let i = 0; i < presentation.slides.length; i++) {
      const slide = presentation.slides[i];
      onProgress?.(
        Math.round(55 + (i / totalSlides) * 40),
        `Rendering Slide ${i + 1} of ${totalSlides}...`
      );

      let slideRendered = false;

      // Render visually via HTML5 Canvas
      if (typeof document !== 'undefined' && typeof document.createElement === 'function') {
        try {
          const canvas = document.createElement('canvas');
          canvas.width = canvasWidth;
          canvas.height = canvasHeight;
          const ctx = canvas.getContext('2d');

          if (ctx) {
            await this.drawSlideOnCanvas(ctx, slide, presentation, file.name, canvasWidth, canvasHeight);

            const pngBlob = await new Promise<Blob>((resolve) => {
              canvas.toBlob((b) => resolve(b!), 'image/png');
            });

            if (pngBlob) {
              const pngBytes = await pngBlob.arrayBuffer();
              const pdfImage = await pdfDoc.embedPng(pngBytes);
              const page = pdfDoc.addPage([pageWidth, pageHeight]);
              page.drawImage(pdfImage, { x: 0, y: 0, width: pageWidth, height: pageHeight });
              slideRendered = true;
            }
          }
        } catch {
          slideRendered = false;
        }
      }

      // Fail-safe direct-to-pdf drawing if canvas is unavailable or failed
      if (!slideRendered) {
        await this.drawSlideDirectToPdf(pdfDoc, slide, presentation, file.name, pageWidth, pageHeight);
      }
    }

    onProgress?.(96, 'Finalizing PDF output...');
    const pdfBytes = await pdfDoc.save();
    onProgress?.(100, 'PowerPoint presentation converted to PDF successfully.');
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Render slide visually on 2D Canvas
   */
  private static async drawSlideOnCanvas(
    ctx: CanvasRenderingContext2D,
    slide: ExtractedSlide,
    presentation: PresentationData,
    fileName: string,
    width: number,
    height: number
  ): Promise<void> {
    // 1. Background fill
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, 0, width, height);

    // Modern top gradient accent bar
    const barGradient = ctx.createLinearGradient(0, 0, width, 0);
    barGradient.addColorStop(0, '#2563eb');
    barGradient.addColorStop(0.5, '#3b82f6');
    barGradient.addColorStop(1, '#06b6d4');
    ctx.fillStyle = barGradient;
    ctx.fillRect(0, 0, width, 12);

    // 2. Slide Title & Header
    const slideTitle = slide.title || `Slide ${slide.slideNumber}`;
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif';
    ctx.textBaseline = 'top';

    const maxTitleWidth = width - 240;
    const titleLines = this.wrapCanvasText(ctx, slideTitle, maxTitleWidth, 2);
    let curY = 60;

    for (const tl of titleLines) {
      ctx.fillText(tl, 80, curY);
      curY += 52;
    }

    if (slide.subtitle) {
      ctx.fillStyle = '#475569';
      ctx.font = '500 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      const subLines = this.wrapCanvasText(ctx, slide.subtitle, maxTitleWidth, 1);
      for (const sl of subLines) {
        ctx.fillText(sl, 80, curY);
        curY += 34;
      }
    }

    // Divider line
    curY = Math.max(curY + 14, 150);
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(80, curY);
    ctx.lineTo(width - 80, curY);
    ctx.stroke();

    const contentStartY = curY + 36;
    const contentMaxY = height - 90;

    // 3. Content layout
    const hasImage = slide.images.length > 0 && !!slide.images[0].dataUrl;
    const hasItems = slide.items.length > 0;
    const hasTables = slide.tables.length > 0;

    let loadedImg: HTMLImageElement | null = null;
    if (hasImage) {
      try {
        loadedImg = await new Promise<HTMLImageElement | null>((res) => {
          const img = new Image();
          img.onload = () => res(img);
          img.onerror = () => res(null);
          img.src = slide.images[0].dataUrl!;
        });
      } catch {
        loadedImg = null;
      }
    }

    if (loadedImg && hasItems) {
      // Two-column layout: bullets on left, image on right
      const leftColWidth = 1000;
      this.drawBulletPoints(ctx, slide.items, 80, contentStartY, leftColWidth, contentMaxY);

      const imgX = 1140;
      const imgY = contentStartY;
      const imgBoxW = width - 1140 - 80;
      const imgBoxH = contentMaxY - contentStartY;
      this.drawImageInBox(ctx, loadedImg, imgX, imgY, imgBoxW, imgBoxH);
    } else if (loadedImg && !hasItems && !hasTables) {
      // Centered image slide
      const imgBoxW = width - 240;
      const imgBoxH = contentMaxY - contentStartY;
      this.drawImageInBox(ctx, loadedImg, 120, contentStartY, imgBoxW, imgBoxH);
    } else {
      // Full-width layout
      const fullWidth = width - 160;
      let textEndY = contentStartY;

      if (hasItems) {
        textEndY = this.drawBulletPoints(ctx, slide.items, 80, contentStartY, fullWidth, contentMaxY);
      }

      if (hasTables && textEndY < contentMaxY - 100) {
        const tableY = hasItems ? textEndY + 30 : contentStartY;
        this.drawTableOnCanvas(ctx, slide.tables[0], 80, tableY, fullWidth, contentMaxY);
      }
    }

    // 4. Slide Footer
    const footerY = height - 42;
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textBaseline = 'middle';

    const docTitle = fileName.replace(/\.[^/.]+$/, '');
    ctx.fillText(docTitle, 80, footerY);

    const badgeText = `Slide ${slide.slideNumber} of ${presentation.totalSlides}`;
    ctx.font = 'bold 16px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const badgeW = ctx.measureText(badgeText).width + 32;
    const badgeH = 32;
    const badgeX = width - 80 - badgeW;
    const badgeY = footerY - 16;

    ctx.fillStyle = '#f1f5f9';
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.textAlign = 'center';
    ctx.fillText(badgeText, badgeX + badgeW / 2, badgeY + badgeH / 2);
    ctx.textAlign = 'left';
  }

  private static drawBulletPoints(
    ctx: CanvasRenderingContext2D,
    items: SlideTextItem[],
    startX: number,
    startY: number,
    maxWidth: number,
    maxY: number
  ): number {
    let curY = startY;
    const lineSpacing = 36;

    for (const item of items) {
      if (curY > maxY - 40) break;

      const indent = item.level * 36;
      const x = startX + indent;
      const textX = x + 32;
      const textWidth = maxWidth - indent - 32;

      ctx.fillStyle = item.level === 0 ? '#2563eb' : '#64748b';
      ctx.font = item.level === 0 ? 'bold 22px sans-serif' : '18px sans-serif';
      ctx.textBaseline = 'top';

      const bulletChar = item.level === 0 ? '•' : item.level === 1 ? '◦' : '▪';
      ctx.fillText(bulletChar, x, curY + 2);

      ctx.fillStyle = '#1e293b';
      ctx.font = `${item.isBold ? '600' : '400'} 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`;

      const lines = this.wrapCanvasText(ctx, item.text, textWidth, 4);
      for (const line of lines) {
        if (curY > maxY - 30) break;
        ctx.fillText(line, textX, curY);
        curY += lineSpacing;
      }

      curY += 10;
    }

    return curY;
  }

  private static drawImageInBox(
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    x: number,
    y: number,
    boxW: number,
    boxH: number
  ): void {
    const imgRatio = img.naturalWidth / Math.max(1, img.naturalHeight);
    const boxRatio = boxW / boxH;

    let drawW = boxW;
    let drawH = boxH;

    if (imgRatio > boxRatio) {
      drawW = boxW;
      drawH = boxW / imgRatio;
    } else {
      drawH = boxH;
      drawW = boxH * imgRatio;
    }

    const drawX = x + (boxW - drawW) / 2;
    const drawY = y + (boxH - drawH) / 2;

    ctx.save();
    ctx.shadowColor = 'rgba(0, 0, 0, 0.08)';
    ctx.shadowBlur = 16;
    ctx.shadowOffsetY = 6;

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(drawX, drawY, drawW, drawH, 12);
    ctx.fill();
    ctx.stroke();

    ctx.clip();
    ctx.drawImage(img, drawX, drawY, drawW, drawH);
    ctx.restore();
  }

  private static drawTableOnCanvas(
    ctx: CanvasRenderingContext2D,
    table: SlideTableItem,
    x: number,
    y: number,
    maxWidth: number,
    maxY: number
  ): void {
    if (!table.rows || table.rows.length === 0) return;

    const colCount = Math.max(...table.rows.map((r) => r.length));
    if (colCount === 0) return;

    const colWidth = maxWidth / colCount;
    const rowHeight = 44;
    let curY = y;

    for (let r = 0; r < table.rows.length; r++) {
      if (curY + rowHeight > maxY) break;
      const isHeader = r === 0;

      ctx.fillStyle = isHeader ? '#f1f5f9' : r % 2 === 1 ? '#ffffff' : '#f8fafc';
      ctx.fillRect(x, curY, maxWidth, rowHeight);

      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1;
      ctx.strokeRect(x, curY, maxWidth, rowHeight);

      const row = table.rows[r];
      for (let c = 0; c < colCount; c++) {
        const cellX = x + c * colWidth;
        const cellText = row[c] || '';

        if (c > 0) {
          ctx.beginPath();
          ctx.moveTo(cellX, curY);
          ctx.lineTo(cellX, curY + rowHeight);
          ctx.stroke();
        }

        ctx.fillStyle = isHeader ? '#0f172a' : '#334155';
        ctx.font = isHeader
          ? 'bold 18px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
          : '17px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
        ctx.textBaseline = 'middle';

        const lines = this.wrapCanvasText(ctx, cellText, colWidth - 24, 1);
        ctx.fillText(lines[0] || '', cellX + 12, curY + rowHeight / 2);
      }

      curY += rowHeight;
    }
  }

  private static wrapCanvasText(
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
    maxLines: number = 3
  ): string[] {
    const words = text.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const testWidth = ctx.measureText(testLine).width;

      if (testWidth > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = word;
        if (lines.length >= maxLines) break;
      } else {
        currentLine = testLine;
      }
    }

    if (currentLine && lines.length < maxLines) {
      lines.push(currentLine);
    }

    return lines;
  }

  private static async drawSlideDirectToPdf(
    pdfDoc: PDFDocument,
    slide: ExtractedSlide,
    presentation: PresentationData,
    fileName: string,
    width: number,
    height: number
  ): Promise<void> {
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
    const page = pdfDoc.addPage([width, height]);

    // Top banner
    page.drawRectangle({
      x: 0,
      y: height - 6,
      width,
      height: 6,
      color: rgb(0.15, 0.4, 0.9),
    });

    // Title
    const titleText = (slide.title || `Slide ${slide.slideNumber}`).replace(/[^\x20-\x7E]/g, ' ');
    page.drawText(titleText.slice(0, 80), {
      x: 50,
      y: height - 50,
      size: 20,
      font: fontBold,
      color: rgb(0.06, 0.09, 0.16),
    });

    if (slide.subtitle) {
      const subText = slide.subtitle.replace(/[^\x20-\x7E]/g, ' ');
      page.drawText(subText.slice(0, 100), {
        x: 50,
        y: height - 75,
        size: 13,
        font,
        color: rgb(0.3, 0.35, 0.45),
      });
    }

    // Divider
    page.drawLine({
      start: { x: 50, y: height - 90 },
      end: { x: width - 50, y: height - 90 },
      thickness: 1,
      color: rgb(0.88, 0.91, 0.94),
    });

    // Items
    let curY = height - 120;
    for (const item of slide.items) {
      if (curY < 60) break;
      const cleanItem = item.text.replace(/[^\x20-\x7E]/g, ' ');
      const prefix = item.level === 0 ? '- ' : '    * ';
      page.drawText(`${prefix}${cleanItem}`.slice(0, 100), {
        x: 60 + item.level * 20,
        y: curY,
        size: 11,
        font: item.isBold ? fontBold : font,
        color: rgb(0.12, 0.16, 0.23),
      });
      curY -= 20;
    }

    // Footer
    page.drawText(`${fileName.replace(/\.[^/.]+$/, '')} | Slide ${slide.slideNumber} of ${presentation.totalSlides}`, {
      x: 50,
      y: 25,
      size: 9,
      font,
      color: rgb(0.58, 0.64, 0.72),
    });
  }

  private static escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  /**
   * TXT to PDF with pagination & clean typography
   */
  public static async txtToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(15, 'Reading text content...');
    const text = await file.text();
    return this.renderTextToPdf(text, file.name.replace(/\.[^/.]+$/, ''), onProgress);
  }

  /**
   * Markdown to HTML
   */
  public static async markdownToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(30, 'Parsing Markdown...');
    const markdown = await file.text();
    const parsedHtml = this.parseSimpleMarkdown(markdown);
    const sanitized = DOMPurify.sanitize(parsedHtml);

    const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${file.name.replace(/\.[^/.]+$/, '')}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; color: #1e293b; max-width: 800px; margin: 40px auto; padding: 0 20px; }
    h1, h2, h3 { color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 0.3em; }
    pre { background: #0f172a; color: #f8fafc; padding: 16px; border-radius: 8px; overflow-x: auto; }
    code { font-family: monospace; background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-size: 0.9em; }
    pre code { background: transparent; padding: 0; }
    blockquote { border-left: 4px solid #3b82f6; margin: 1em 0; padding-left: 1em; color: #475569; }
  </style>
</head>
<body>
  ${sanitized}
</body>
</html>`;

    onProgress?.(100, 'Markdown converted to HTML.');
    return new Blob([doc], { type: 'text/html;charset=utf-8' });
  }

  /**
   * Markdown to PDF
   */
  public static async markdownToPdf(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(20, 'Reading Markdown content...');
    const markdown = await file.text();
    return this.renderTextToPdf(markdown, file.name.replace(/\.[^/.]+$/, ''), onProgress);
  }

  /**
   * Helper: Multi-page Text to PDF generation
   */
  private static async renderTextToPdf(text: string, title: string, onProgress?: ProgressCallback): Promise<Blob> {
    onProgress?.(40, 'Formatting PDF pages...');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    const fontSize = 10;
    const lineHeight = 14;
    const pageWidth = 595.28; // A4 standard
    const pageHeight = 841.89;
    const margin = 50;
    const printableWidth = pageWidth - margin * 2;
    const printableHeight = pageHeight - margin * 2;
    const linesPerPage = Math.floor(printableHeight / lineHeight);

    // Break lines with word wrap
    const rawLines = text.split(/\r?\n/);
    const wrappedLines: string[] = [];

    for (const rawLine of rawLines) {
      if (rawLine.trim() === '') {
        wrappedLines.push('');
        continue;
      }
      
      const words = rawLine.split(' ');
      let currentLine = '';

      for (const word of words) {
        const testLine = currentLine ? `${currentLine} ${word}` : word;
        const width = font.widthOfTextAtSize(testLine, fontSize);
        if (width < printableWidth) {
          currentLine = testLine;
        } else {
          wrappedLines.push(currentLine);
          currentLine = word;
        }
      }
      if (currentLine) {
        wrappedLines.push(currentLine);
      }
    }

    const totalPages = Math.max(1, Math.ceil(wrappedLines.length / linesPerPage));

    for (let p = 0; p < totalPages; p++) {
      onProgress?.(Math.round(40 + (p / totalPages) * 50), `Creating PDF page ${p + 1} of ${totalPages}...`);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Header
      page.drawText(title, {
        x: margin,
        y: pageHeight - 35,
        size: 9,
        font: boldFont,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Page lines
      const startLine = p * linesPerPage;
      const endLine = Math.min(startLine + linesPerPage, wrappedLines.length);

      let currentY = pageHeight - margin - 15;
      for (let l = startLine; l < endLine; l++) {
        const lineText = wrappedLines[l];
        if (lineText) {
          // Safe character rendering (strip unencodable unicode if standard font)
          const safeText = lineText.replace(/[^\x00-\x7F]/g, '?');
          page.drawText(safeText, {
            x: margin,
            y: currentY,
            size: fontSize,
            font: font,
            color: rgb(0.1, 0.1, 0.1),
          });
        }
        currentY -= lineHeight;
      }

      // Footer: Page X of Y
      const pageNumText = `Page ${p + 1} of ${totalPages}`;
      const pageNumWidth = font.widthOfTextAtSize(pageNumText, 8);
      page.drawText(pageNumText, {
        x: pageWidth - margin - pageNumWidth,
        y: 30,
        size: 8,
        font: font,
        color: rgb(0.5, 0.5, 0.5),
      });
    }

    onProgress?.(95, 'Saving PDF document...');
    const pdfBytes = await pdfDoc.save();
    onProgress?.(100, 'PDF ready.');
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * Lightweight safe Markdown parser
   */
  private static parseSimpleMarkdown(md: string): string {
    const lines = md.split(/\r?\n/);
    const htmlLines: string[] = [];
    let inCodeBlock = false;
    let inList = false;

    for (const line of lines) {
      if (line.startsWith('```')) {
        if (inCodeBlock) {
          htmlLines.push('</code></pre>');
          inCodeBlock = false;
        } else {
          htmlLines.push('<pre><code>');
          inCodeBlock = true;
        }
        continue;
      }

      if (inCodeBlock) {
        htmlLines.push(this.escapeHtml(line));
        continue;
      }

      if (line.startsWith('- ') || line.startsWith('* ')) {
        if (!inList) {
          htmlLines.push('<ul>');
          inList = true;
        }
        htmlLines.push(`<li>${this.inlineMarkdown(line.substring(2))}</li>`);
        continue;
      } else if (inList) {
        htmlLines.push('</ul>');
        inList = false;
      }

      if (line.startsWith('# ')) {
        htmlLines.push(`<h1>${this.inlineMarkdown(line.substring(2))}</h1>`);
      } else if (line.startsWith('## ')) {
        htmlLines.push(`<h2>${this.inlineMarkdown(line.substring(3))}</h2>`);
      } else if (line.startsWith('### ')) {
        htmlLines.push(`<h3>${this.inlineMarkdown(line.substring(4))}</h3>`);
      } else if (line.startsWith('> ')) {
        htmlLines.push(`<blockquote>${this.inlineMarkdown(line.substring(2))}</blockquote>`);
      } else if (line.trim() === '') {
        htmlLines.push('<br/>');
      } else {
        htmlLines.push(`<p>${this.inlineMarkdown(line)}</p>`);
      }
    }

    if (inList) htmlLines.push('</ul>');
    if (inCodeBlock) htmlLines.push('</code></pre>');

    return htmlLines.join('\n');
  }

  private static inlineMarkdown(text: string): string {
    let t = this.escapeHtml(text);
    // Bold
    t = t.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    // Italic
    t = t.replace(/\*(.*?)\*/g, '<em>$1</em>');
    // Inline code
    t = t.replace(/`(.*?)`/g, '<code>$1</code>');
    // Links
    t = t.replace(/\[(.*?)\]\((https?:\/\/.*?)\)/g, '<a href="$2" rel="noopener noreferrer">$1</a>');
    return t;
  }

  /**
   * PowerPoint (PPT / PPTX) Text Layer Extraction
   */
  public static async pptxToTxt(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    const presentation = await this.extractPresentation(file, onProgress);
    let fullText = `============================================================\n`;
    fullText += `PRESENTATION: ${file.name}\n`;
    fullText += `TOTAL SLIDES: ${presentation.totalSlides}\n`;
    fullText += `============================================================\n\n`;

    for (const slide of presentation.slides) {
      fullText += `------------------------------------------------------------\n`;
      fullText += `SLIDE ${slide.slideNumber}: ${slide.title || '[Untitled Slide]'}\n`;
      if (slide.subtitle) {
        fullText += `Subtitle: ${slide.subtitle}\n`;
      }
      fullText += `------------------------------------------------------------\n\n`;

      if (slide.items.length > 0) {
        for (const item of slide.items) {
          const indent = '  '.repeat(item.level);
          const bullet = item.level === 0 ? '• ' : '- ';
          fullText += `${indent}${bullet}${item.text}\n`;
        }
        fullText += '\n';
      }

      if (slide.tables.length > 0) {
        for (const tbl of slide.tables) {
          fullText += `[Table: ${tbl.rows.length} rows x ${tbl.rows[0]?.length || 0} columns]\n`;
          for (const row of tbl.rows) {
            fullText += `| ${row.join(' | ')} |\n`;
          }
          fullText += '\n';
        }
      }

      if (slide.images.length > 0) {
        fullText += `[Embedded Media: ${slide.images.length} slide image(s)]\n\n`;
      }
    }

    onProgress?.(100, 'PowerPoint text extracted successfully.');
    return new Blob([fullText], { type: 'text/plain;charset=utf-8' });
  }

  /**
   * PowerPoint (PPT / PPTX) to Clean HTML Slides
   */
  public static async pptxToHtml(file: File, onProgress?: ProgressCallback): Promise<Blob> {
    const presentation = await this.extractPresentation(file, onProgress);
    let slidesHtml = '';

    for (const slide of presentation.slides) {
      let contentHtml = '';

      if (slide.subtitle) {
        contentHtml += `<p class="slide-subtitle">${this.escapeHtml(slide.subtitle)}</p>`;
      }

      if (slide.items.length > 0) {
        contentHtml += '<ul class="slide-list">';
        for (const item of slide.items) {
          contentHtml += `<li class="level-${item.level} ${item.isBold ? 'font-bold' : ''}">${this.escapeHtml(item.text)}</li>`;
        }
        contentHtml += '</ul>';
      }

      if (slide.tables.length > 0) {
        for (const tbl of slide.tables) {
          contentHtml += '<div class="table-wrapper"><table class="slide-table">';
          for (let r = 0; r < tbl.rows.length; r++) {
            const row = tbl.rows[r];
            const tag = r === 0 ? 'th' : 'td';
            contentHtml += '<tr>' + row.map((cell) => `<${tag}>${this.escapeHtml(cell)}</${tag}>`).join('') + '</tr>';
          }
          contentHtml += '</table></div>';
        }
      }

      if (slide.images.length > 0 && slide.images[0].dataUrl) {
        contentHtml += `<div class="slide-image-container"><img src="${slide.images[0].dataUrl}" alt="Slide graphic" class="slide-img" /></div>`;
      }

      slidesHtml += `
      <section class="slide-card">
        <header class="slide-header">
          <div class="slide-badge">Slide ${slide.slideNumber} of ${presentation.totalSlides}</div>
          <h2 class="slide-title">${this.escapeHtml(slide.title || 'Slide ' + slide.slideNumber)}</h2>
        </header>
        <div class="slide-body">
          ${contentHtml || '<p class="empty">[No readable content on this slide]</p>'}
        </div>
      </section>`;
    }

    const doc = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${this.escapeHtml(file.name.replace(/\.[^/.]+$/, ''))}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; background: #0f172a; color: #f8fafc; margin: 0; padding: 40px 20px; line-height: 1.6; }
    .container { max-width: 960px; margin: 0 auto; }
    .main-title { font-size: 24px; font-weight: 700; color: #38bdf8; margin-bottom: 30px; border-bottom: 1px solid rgba(255,255,255,0.1); padding-bottom: 14px; }
    .slide-card { background: #1e293b; border-radius: 12px; border: 1px solid rgba(255,255,255,0.08); padding: 28px; margin-bottom: 28px; box-shadow: 0 6px 24px rgba(0,0,0,0.3); }
    .slide-header { border-bottom: 1px solid rgba(255,255,255,0.06); padding-bottom: 16px; margin-bottom: 20px; }
    .slide-badge { display: inline-block; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.05em; background: rgba(56,189,248,0.12); color: #38bdf8; border: 1px solid rgba(56,189,248,0.25); border-radius: 9999px; padding: 2px 10px; margin-bottom: 10px; }
    .slide-title { font-size: 22px; font-weight: 700; color: #f8fafc; margin: 0; }
    .slide-subtitle { font-size: 16px; color: #94a3b8; font-weight: 500; margin: 0 0 16px 0; }
    .slide-list { list-style: none; padding-left: 0; margin: 16px 0; }
    .slide-list li { margin: 10px 0; position: relative; padding-left: 24px; font-size: 15px; }
    .slide-list li::before { content: "•"; position: absolute; left: 6px; color: #38bdf8; font-weight: bold; }
    .slide-list li.level-1 { padding-left: 44px; color: #cbd5e1; }
    .slide-list li.level-1::before { content: "◦"; left: 26px; color: #94a3b8; }
    .slide-list li.level-2 { padding-left: 64px; color: #94a3b8; }
    .slide-list li.level-2::before { content: "▪"; left: 46px; color: #64748b; }
    .slide-list li.font-bold { font-weight: 600; color: #f8fafc; }
    .table-wrapper { overflow-x: auto; margin: 20px 0; }
    .slide-table { width: 100%; border-collapse: collapse; font-size: 14px; }
    .slide-table th { background: rgba(255,255,255,0.06); color: #38bdf8; font-weight: 600; text-align: left; padding: 10px 14px; border: 1px solid rgba(255,255,255,0.1); }
    .slide-table td { padding: 9px 14px; border: 1px solid rgba(255,255,255,0.06); }
    .slide-table tr:nth-child(even) { background: rgba(255,255,255,0.02); }
    .slide-image-container { margin-top: 20px; text-align: center; }
    .slide-img { max-width: 100%; max-height: 400px; border-radius: 8px; border: 1px solid rgba(255,255,255,0.1); }
    .empty { color: #64748b; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <h1 class="main-title">${this.escapeHtml(file.name)}</h1>
    ${slidesHtml}
  </div>
</body>
</html>`;

    onProgress?.(100, 'HTML presentation generated.');
    return new Blob([doc], { type: 'text/html;charset=utf-8' });
  }

  private static escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

