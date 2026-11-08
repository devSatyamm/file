import * as XLSX from 'xlsx';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';

export interface SpreadsheetPreviewData {
  sheetNames: string[];
  activeSheet: string;
  columns: string[];
  rows: Record<string, any>[];
  totalRows: number;
}

export class SpreadsheetConverter {
  /**
   * Parse XLSX or CSV for interactive preview
   */
  public static async parseForPreview(file: File, sheetIndex = 0): Promise<SpreadsheetPreviewData> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetNames = workbook.SheetNames;
    const activeSheetName = sheetNames[sheetIndex] || sheetNames[0];
    const sheet = workbook.Sheets[activeSheetName];

    // Convert sheet to JSON array
    const rawData = XLSX.utils.sheet_to_json<Record<string, any>>(sheet, { header: 1 });
    
    if (rawData.length === 0) {
      return {
        sheetNames,
        activeSheet: activeSheetName,
        columns: [],
        rows: [],
        totalRows: 0,
      };
    }

    // First row is headers
    const headerRow = (rawData[0] as any[]) || [];
    const columns = headerRow.map((col, idx) => (col ? String(col) : `Column ${idx + 1}`));

    // Preview first 100 rows
    const dataRows = rawData.slice(1, 101);
    const rows = dataRows.map((rowArray: any) => {
      const rowObj: Record<string, any> = {};
      columns.forEach((col, idx) => {
        rowObj[col] = (rowArray && rowArray[idx] !== undefined) ? String(rowArray[idx]) : '';
      });
      return rowObj;
    });

    return {
      sheetNames,
      activeSheet: activeSheetName,
      columns,
      rows,
      totalRows: Math.max(0, rawData.length - 1),
    };
  }

  /**
   * Convert Spreadsheet (XLSX or CSV) to a styled paginated PDF document
   */
  public static async spreadsheetToPdf(
    file: File,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<Blob> {
    onProgress?.(20, 'Reading spreadsheet records...');
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rawData = XLSX.utils.sheet_to_json<string[]>(sheet, { header: 1 });

    onProgress?.(50, 'Formatting PDF table layout...');
    const pdfDoc = await PDFDocument.create();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Standard Landscape A4: 841.89 x 595.28
    const pageWidth = 841.89;
    const pageHeight = 595.28;
    const margin = 40;
    const contentW = pageWidth - margin * 2;

    const rowsPerPage = 24;
    const totalPages = Math.max(1, Math.ceil(rawData.length / rowsPerPage));

    const numCols = rawData[0]?.length || 5;
    const colWidth = contentW / Math.min(numCols, 8);

    for (let p = 0; p < totalPages; p++) {
      onProgress?.(Math.round(50 + (p / totalPages) * 45), `Rendering PDF table page ${p + 1} of ${totalPages}...`);
      const page = pdfDoc.addPage([pageWidth, pageHeight]);

      // Title
      page.drawText(`${file.name.replace(/\.[^/.]+$/, '')} — ${sheetName} (Page ${p + 1}/${totalPages})`, {
        x: margin,
        y: pageHeight - 30,
        size: 11,
        font: fontBold,
        color: rgb(0.1, 0.4, 0.8),
      });

      const startIdx = p * rowsPerPage;
      const pageRows = rawData.slice(startIdx, startIdx + rowsPerPage);
      let currentY = pageHeight - 55;

      for (let r = 0; r < pageRows.length; r++) {
        const rowData = pageRows[r] || [];
        const isHeader = p === 0 && r === 0;

        // Draw row background for header
        if (isHeader) {
          page.drawRectangle({
            x: margin,
            y: currentY - 4,
            width: contentW,
            height: 18,
            color: rgb(0.9, 0.93, 0.98),
          });
        }

        for (let c = 0; c < Math.min(rowData.length, 8); c++) {
          const val = String(rowData[c] || '').slice(0, 25);
          const safeVal = val.replace(/[^\x00-\x7F]/g, '?');

          page.drawText(safeVal, {
            x: margin + c * colWidth + 4,
            y: currentY,
            size: isHeader ? 9 : 8,
            font: isHeader ? fontBold : font,
            color: isHeader ? rgb(0.1, 0.1, 0.1) : rgb(0.25, 0.25, 0.25),
          });
        }

        currentY -= 18;
      }
    }

    onProgress?.(100, 'Spreadsheet converted to PDF.');
    const pdfBytes = await pdfDoc.save();
    return new Blob([pdfBytes as any], { type: 'application/pdf' });
  }

  /**
   * CSV to JSON
   */
  public static async csvToJson(file: File): Promise<Blob> {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(firstSheet);
    const jsonString = JSON.stringify(jsonData, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  }

  /**
   * JSON to CSV
   */
  public static async jsonToCsv(file: File): Promise<Blob> {
    const text = await file.text();
    const jsonData = JSON.parse(text);
    if (!Array.isArray(jsonData)) {
      throw new Error('Input JSON must be an array of objects to convert to CSV.');
    }
    const worksheet = XLSX.utils.json_to_sheet(jsonData);
    const csvOutput = XLSX.utils.sheet_to_csv(worksheet);
    return new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * XLSX to CSV (converts first or specified sheet to CSV)
   */
  public static async xlsxToCsv(file: File, sheetName?: string): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const targetSheetName = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    if (!sheet) throw new Error(`Sheet "${targetSheetName}" not found in workbook.`);

    const csvOutput = XLSX.utils.sheet_to_csv(sheet);
    return new Blob([csvOutput], { type: 'text/csv;charset=utf-8' });
  }

  /**
   * CSV to XLSX
   */
  public static async csvToXlsx(file: File): Promise<Blob> {
    const text = await file.text();
    const workbook = XLSX.read(text, { type: 'string' });
    const xlsxBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
    return new Blob([xlsxBuffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  /**
   * XLSX to JSON
   */
  public static async xlsxToJson(file: File, sheetName?: string): Promise<Blob> {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array' });
    const targetSheetName = sheetName || workbook.SheetNames[0];
    const sheet = workbook.Sheets[targetSheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);
    const jsonString = JSON.stringify(jsonData, null, 2);
    return new Blob([jsonString], { type: 'application/json;charset=utf-8' });
  }
}

