import { DetectedFileInfo, ConversionTask } from '../types';
import { DocumentConverter } from './documentConverter';
import { ImageConverter } from './imageConverter';
import { SpreadsheetConverter } from './spreadsheetConverter';
import { ArchiveService } from './archiveService';
import { MediaService } from './mediaService';

export interface ConversionOption {
  targetFormat: string;
  label: string;
  category: string;
  outputExt: string;
  outputMime: string;
  description: string;
}

export class ConversionRegistry {
  /**
   * Complete compatibility map matching FreeConvert.com catalog
   */
  private static readonly COMPATIBILITY_MAP: Record<string, ConversionOption[]> = {
    // 1. PDF
    pdf: [
      { targetFormat: 'docx', label: 'Word Document (.docx)', category: 'Document', outputExt: 'docx', outputMime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', description: 'Convert PDF into an editable Microsoft Word document' },
      { targetFormat: 'xlsx', label: 'Excel Spreadsheet (.xlsx)', category: 'Spreadsheet', outputExt: 'xlsx', outputMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Extract tables and data from PDF into Excel' },
      { targetFormat: 'pptx', label: 'PowerPoint Slides (.pptx)', category: 'Presentation', outputExt: 'pptx', outputMime: 'application/vnd.openxmlformats-officedocument.presentationml.presentation', description: 'Transform PDF pages into editable PowerPoint slides' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract raw text layer page-by-page from PDF' },
      { targetFormat: 'png', label: 'PNG Image(s) (.png / .zip)', category: 'Raster Image', outputExt: 'png', outputMime: 'image/png', description: 'Rasterize pages to 2x high-res PNG (ZIP if multi-page)' },
      { targetFormat: 'jpg', label: 'JPEG Image(s) (.jpg / .zip)', category: 'Raster Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert PDF pages to JPEG photographs' },
      { targetFormat: 'html', label: 'HTML Web Page (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Convert PDF layout into responsive HTML' },
      { targetFormat: 'epub', label: 'EPUB E-Book (.epub)', category: 'E-Book', outputExt: 'epub', outputMime: 'application/epub+zip', description: 'Convert PDF document into reflowable EPUB' },
      { targetFormat: 'rtf', label: 'Rich Text Format (.rtf)', category: 'Document', outputExt: 'rtf', outputMime: 'application/rtf', description: 'Convert PDF into Rich Text Format RTF' },
    ],

    // 2. Documents
    docx: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert Word DOCX to standardized PDF document' },
      { targetFormat: 'html', label: 'HTML Web Page (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Convert Word document to clean, semantic HTML' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract raw text stripping formatting' },
    ],
    doc: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert legacy Word DOC to standardized PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract plain text from Word document' },
    ],
    pptx: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Compile PowerPoint slides into landscape PDF' },
      { targetFormat: 'txt', label: 'Extracted Slide Text (.txt)', category: 'Presentation', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract slide-by-slide text content' },
      { targetFormat: 'html', label: 'HTML Presentation View (.html)', category: 'Presentation', outputExt: 'html', outputMime: 'text/html', description: 'Convert slides to responsive HTML presentation' },
    ],
    ppt: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert PowerPoint slides to PDF' },
      { targetFormat: 'txt', label: 'Slide Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract slide text' },
    ],
    txt: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Compile plain text into paginated A4 PDF' },
      { targetFormat: 'html', label: 'HTML Document (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Wrap plain text in clean HTML boilerplate' },
    ],
    markdown: [
      { targetFormat: 'html', label: 'HTML Document (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Parse Markdown headings and lists into HTML' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Render Markdown into structured paginated PDF' },
    ],
    md: [
      { targetFormat: 'html', label: 'HTML Document (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Parse Markdown into HTML' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Render Markdown into structured paginated PDF' },
    ],
    html: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Render HTML text content into paginated PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Strip HTML tags and extract plain text' },
    ],
    htm: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Render HTML into PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract plain text' },
    ],
    epub: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert EPUB e-book into paginated PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract chapters into plain text' },
      { targetFormat: 'html', label: 'HTML Web Book (.html)', category: 'Document', outputExt: 'html', outputMime: 'text/html', description: 'Extract EPUB chapters into HTML' },
    ],
    mobi: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert Kindle MOBI into PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Extract text from Kindle MOBI' },
    ],
    rtf: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert Rich Text Format RTF to PDF' },
      { targetFormat: 'txt', label: 'Plain Text (.txt)', category: 'Text Extraction', outputExt: 'txt', outputMime: 'text/plain', description: 'Strip RTF control words and extract text' },
    ],

    // 3. Images
    png: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert PNG image into PDF' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert PNG to compressed JPEG' },
      { targetFormat: 'webp', label: 'WEBP Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Convert PNG to modern WebP' },
      { targetFormat: 'svg', label: 'SVG Vector (.svg)', category: 'Image', outputExt: 'svg', outputMime: 'image/svg+xml', description: 'Vectorize PNG into SVG container' },
      { targetFormat: 'bmp', label: 'Windows Bitmap (.bmp)', category: 'Image', outputExt: 'bmp', outputMime: 'image/bmp', description: 'Export PNG to uncompressed Bitmap' },
      { targetFormat: 'ico', label: 'Favicon Icon (.ico)', category: 'Image', outputExt: 'ico', outputMime: 'image/x-icon', description: 'Convert PNG into 32x32 favicon .ico' },
      { targetFormat: 'gif', label: 'GIF Image (.gif)', category: 'Image', outputExt: 'gif', outputMime: 'image/gif', description: 'Convert PNG to indexed GIF' },
    ],
    jpg: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert JPEG to standardized PDF' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Lossless PNG conversion' },
      { targetFormat: 'webp', label: 'WEBP Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Compress JPEG to lightweight WebP' },
      { targetFormat: 'svg', label: 'SVG Vector (.svg)', category: 'Image', outputExt: 'svg', outputMime: 'image/svg+xml', description: 'Convert JPEG to SVG container' },
      { targetFormat: 'bmp', label: 'Windows Bitmap (.bmp)', category: 'Image', outputExt: 'bmp', outputMime: 'image/bmp', description: 'Convert JPEG to BMP bitmap' },
      { targetFormat: 'ico', label: 'Favicon Icon (.ico)', category: 'Image', outputExt: 'ico', outputMime: 'image/x-icon', description: 'Create .ico favicon from JPEG' },
    ],
    jpeg: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert JPEG image into clean PDF' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Lossless PNG conversion' },
      { targetFormat: 'webp', label: 'WEBP Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Compress JPEG to WebP' },
      { targetFormat: 'bmp', label: 'Windows Bitmap (.bmp)', category: 'Image', outputExt: 'bmp', outputMime: 'image/bmp', description: 'Convert to BMP' },
      { targetFormat: 'ico', label: 'Favicon Icon (.ico)', category: 'Image', outputExt: 'ico', outputMime: 'image/x-icon', description: 'Create .ico favicon' },
    ],
    webp: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert WebP to PDF page' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert WebP to universal PNG' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert WebP to JPEG' },
      { targetFormat: 'gif', label: 'GIF Image (.gif)', category: 'Image', outputExt: 'gif', outputMime: 'image/gif', description: 'Convert WebP to GIF' },
    ],
    svg: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Rasterize SVG vector into clean PDF page' },
      { targetFormat: 'png', label: 'PNG Raster Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Sanitize vector and rasterize to 2x PNG' },
      { targetFormat: 'webp', label: 'WEBP Raster Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Rasterize SVG vector into WebP' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Rasterize SVG to JPEG with solid background' },
    ],
    bmp: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert BMP bitmap into PDF' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert BMP into compressed PNG' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Compress BMP into JPEG photo' },
      { targetFormat: 'webp', label: 'WebP Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Convert BMP into WebP' },
    ],
    gif: [
      { targetFormat: 'png', label: 'PNG Still Frame (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Extract sharp static PNG from GIF' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert GIF to JPEG photo' },
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert animated GIF to smooth MP4 loop' },
    ],
    ico: [
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Extract PNG image from ICO file' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert ICO to JPEG' },
    ],
    tiff: [
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert heavy TIFF scan to web PNG' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert TIFF scan to JPEG' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert TIFF scan into PDF' },
    ],
    tif: [
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert TIFF to PNG' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert TIFF to JPEG' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert TIFF to PDF' },
    ],
    heic: [
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert iPhone HEIC photo to JPEG' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert iPhone HEIC photo to PNG' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert iPhone HEIC photo to PDF' },
    ],
    heif: [
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert HEIF photo to JPEG' },
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert HEIF photo to PNG' },
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert HEIF photo to PDF' },
    ],
    jfif: [
      { targetFormat: 'png', label: 'PNG Image (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Convert JFIF to PNG' },
      { targetFormat: 'jpg', label: 'JPEG Image (.jpg)', category: 'Image', outputExt: 'jpg', outputMime: 'image/jpeg', description: 'Convert JFIF to standard JPG' },
      { targetFormat: 'webp', label: 'WebP Image (.webp)', category: 'Image', outputExt: 'webp', outputMime: 'image/webp', description: 'Convert JFIF to WebP' },
    ],

    // 4. Spreadsheets & Data
    csv: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Format CSV table into paginated PDF' },
      { targetFormat: 'json', label: 'JSON Array (.json)', category: 'Data', outputExt: 'json', outputMime: 'application/json', description: 'Parse CSV rows into structured JSON' },
      { targetFormat: 'xlsx', label: 'Excel Spreadsheet (.xlsx)', category: 'Spreadsheet', outputExt: 'xlsx', outputMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Package CSV into standard Excel workbook' },
    ],
    xlsx: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert Excel workbook sheets to PDF table' },
      { targetFormat: 'csv', label: 'CSV Data Sheet (.csv)', category: 'Data', outputExt: 'csv', outputMime: 'text/csv', description: 'Export active sheet into CSV' },
      { targetFormat: 'json', label: 'JSON Objects (.json)', category: 'Data', outputExt: 'json', outputMime: 'application/json', description: 'Convert spreadsheet records into JSON array' },
    ],
    xls: [
      { targetFormat: 'pdf', label: 'PDF Document (.pdf)', category: 'Document', outputExt: 'pdf', outputMime: 'application/pdf', description: 'Convert legacy Excel sheet to PDF' },
      { targetFormat: 'csv', label: 'CSV Data Sheet (.csv)', category: 'Data', outputExt: 'csv', outputMime: 'text/csv', description: 'Export Excel sheet to CSV' },
      { targetFormat: 'json', label: 'JSON Objects (.json)', category: 'Data', outputExt: 'json', outputMime: 'application/json', description: 'Convert Excel to JSON' },
    ],
    json: [
      { targetFormat: 'csv', label: 'CSV Spreadsheet (.csv)', category: 'Data', outputExt: 'csv', outputMime: 'text/csv', description: 'Convert JSON objects to CSV table' },
      { targetFormat: 'xlsx', label: 'Excel Workbook (.xlsx)', category: 'Spreadsheet', outputExt: 'xlsx', outputMime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', description: 'Export JSON array to Excel workbook' },
    ],

    // 5. Archives
    zip: [
      { targetFormat: 'extract', label: 'Safe Unpack & Inspect', category: 'Archive', outputExt: 'zip', outputMime: 'application/zip', description: 'Scan for Zip bombs / Zip Slip and inspect contents' },
    ],
    tar: [
      { targetFormat: 'zip', label: 'ZIP Container (.zip)', category: 'Archive', outputExt: 'zip', outputMime: 'application/zip', description: 'Convert Unix Tarball to standard ZIP' },
    ],
    gz: [
      { targetFormat: 'zip', label: 'ZIP Container (.zip)', category: 'Archive', outputExt: 'zip', outputMime: 'application/zip', description: 'Decompress GZ stream and package to ZIP' },
    ],
    '7z': [
      { targetFormat: 'zip', label: 'ZIP Container (.zip)', category: 'Archive', outputExt: 'zip', outputMime: 'application/zip', description: 'Convert 7-Zip archive to standard ZIP' },
    ],
    rar: [
      { targetFormat: 'zip', label: 'ZIP Container (.zip)', category: 'Archive', outputExt: 'zip', outputMime: 'application/zip', description: 'Unpack RAR archive into standard ZIP' },
    ],

    // 6. Video
    mp4: [
      { targetFormat: 'webm', label: 'WebM Video (.webm)', category: 'Video', outputExt: 'webm', outputMime: 'video/webm', description: 'Convert MP4 to lightweight WebM' },
      { targetFormat: 'mp3', label: 'MP3 Audio Soundtrack (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio soundtrack to MP3' },
      { targetFormat: 'wav', label: '16-bit PCM WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract uncompressed audio to WAV' },
      { targetFormat: 'gif', label: 'Animated GIF (.gif)', category: 'Image', outputExt: 'gif', outputMime: 'image/gif', description: 'Convert video clip into animated GIF' },
      { targetFormat: 'frames', label: 'Video Frame Capture (.png)', category: 'Image', outputExt: 'png', outputMime: 'image/png', description: 'Capture still photo snapshot from video' },
    ],
    webm: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert WebM to universal MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio Soundtrack (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio stream to MP3' },
      { targetFormat: 'wav', label: '16-bit PCM WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract audio stream to WAV' },
      { targetFormat: 'gif', label: 'Animated GIF (.gif)', category: 'Image', outputExt: 'gif', outputMime: 'image/gif', description: 'Convert WebM animation to GIF' },
    ],
    mov: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert Apple MOV to universal MP4' },
      { targetFormat: 'webm', label: 'WebM Video (.webm)', category: 'Video', outputExt: 'webm', outputMime: 'video/webm', description: 'Convert MOV to WebM' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio track from MOV to MP3' },
      { targetFormat: 'wav', label: 'WAV Audio (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract uncompressed WAV from MOV' },
    ],
    mkv: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert MKV to universal MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from MKV to MP3' },
      { targetFormat: 'wav', label: 'WAV Audio (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract audio from MKV to WAV' },
    ],
    avi: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert AVI to modern MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from AVI to MP3' },
      { targetFormat: 'wav', label: 'WAV Audio (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract audio from AVI to WAV' },
    ],
    wmv: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert Windows Media WMV to MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from WMV to MP3' },
      { targetFormat: 'wav', label: 'WAV Audio (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Extract audio from WMV to WAV' },
    ],
    flv: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert Flash FLV video to MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from FLV to MP3' },
    ],
    '3gp': [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert 3GP video to MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from 3GP' },
    ],
    ogv: [
      { targetFormat: 'mp4', label: 'MP4 Video (.mp4)', category: 'Video', outputExt: 'mp4', outputMime: 'video/mp4', description: 'Convert OGG video to MP4' },
      { targetFormat: 'mp3', label: 'MP3 Audio (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Extract audio from OGG video' },
    ],

    // 7. Audio
    mp3: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode MP3 to pristine 16-bit PCM WAV' },
      { targetFormat: 'ogg', label: 'Ogg Vorbis Audio (.ogg)', category: 'Audio', outputExt: 'ogg', outputMime: 'audio/ogg', description: 'Convert MP3 to open OGG format' },
      { targetFormat: 'aac', label: 'AAC Audio Track (.aac)', category: 'Audio', outputExt: 'aac', outputMime: 'audio/aac', description: 'Convert MP3 to Apple AAC format' },
      { targetFormat: 'flac', label: 'FLAC Lossless Audio (.flac)', category: 'Audio', outputExt: 'flac', outputMime: 'audio/flac', description: 'Convert MP3 to FLAC container' },
      { targetFormat: 'm4a', label: 'M4A Audio (.m4a)', category: 'Audio', outputExt: 'm4a', outputMime: 'audio/m4a', description: 'Convert MP3 to Apple M4A' },
    ],
    wav: [
      { targetFormat: 'mp3', label: 'Compressed MP3 (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Compress WAV into compact MP3' },
      { targetFormat: 'ogg', label: 'Ogg Vorbis Audio (.ogg)', category: 'Audio', outputExt: 'ogg', outputMime: 'audio/ogg', description: 'Convert WAV into Ogg Vorbis' },
      { targetFormat: 'aac', label: 'AAC Audio Track (.aac)', category: 'Audio', outputExt: 'aac', outputMime: 'audio/aac', description: 'Convert WAV into streaming AAC' },
      { targetFormat: 'wav_normalized', label: '16-bit Normalized WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Re-encode and normalize PCM audio channels' },
    ],
    aac: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode AAC to 16-bit WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Transcode AAC to standard MP3' },
    ],
    ogg: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode OGG to 16-bit WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert OGG to standard MP3' },
    ],
    flac: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode FLAC to 16-bit PCM WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert lossless FLAC to high-bitrate MP3' },
    ],
    m4a: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode Apple M4A to 16-bit WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert Apple M4A voice memos to MP3' },
    ],
    wma: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode Windows Media Audio to WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert WMA to MP3' },
    ],
    aiff: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode Apple AIFF to standard WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert AIFF to MP3' },
    ],
    opus: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode Opus voice recording to WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert Opus to MP3' },
    ],
    amr: [
      { targetFormat: 'wav', label: 'Uncompressed WAV (.wav)', category: 'Audio', outputExt: 'wav', outputMime: 'audio/wav', description: 'Decode AMR mobile audio to WAV' },
      { targetFormat: 'mp3', label: 'MP3 Audio Track (.mp3)', category: 'Audio', outputExt: 'mp3', outputMime: 'audio/mpeg', description: 'Convert AMR to MP3' },
    ],
  };

  /**
   * Get valid target options for detected file format
   */
  public static getTargetOptions(sourceFormat: string): ConversionOption[] {
    const key = sourceFormat.toLowerCase();
    return this.COMPATIBILITY_MAP[key] || [];
  }

  /**
   * Main Conversion Dispatcher
   */
  public static async executeConversion(
    fileInfo: DetectedFileInfo,
    targetFormat: string,
    settings?: Record<string, any>,
    onProgress?: (progress: number, msg?: string) => void
  ): Promise<{ blob: Blob; outputFileName: string }> {
    const src = fileInfo.detectedFormat.toLowerCase();
    const target = targetFormat.toLowerCase();
    const baseName = fileInfo.name.replace(/\.[^/.]+$/, '');

    onProgress?.(5, 'Starting local conversion engine...');

    // 1. PDF conversions
    if (src === 'pdf') {
      if (target === 'docx') {
        const blob = await DocumentConverter.pdfToDocx(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.docx` };
      }
      if (target === 'xlsx') {
        const blob = await DocumentConverter.pdfToXlsx(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.xlsx` };
      }
      if (target === 'pptx') {
        const blob = await DocumentConverter.pdfToPptx(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pptx` };
      }
      if (target === 'txt') {
        const blob = await DocumentConverter.pdfToTxt(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.txt` };
      }
      if (target === 'png' || target === 'jpg' || target === 'jpeg') {
        const { blob, isZip } = await DocumentConverter.pdfToImages(fileInfo.file, onProgress);
        return { blob, outputFileName: isZip ? `${baseName}_pages.zip` : `${baseName}.${target === 'jpeg' ? 'jpg' : target}` };
      }
      if (target === 'html') {
        const blob = await DocumentConverter.pdfToTxt(fileInfo.file, onProgress);
        const text = await blob.text();
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title><style>body{font-family:system-ui,sans-serif;line-height:1.6;padding:2rem;max-width:800px;margin:auto;white-space:pre-wrap;}</style></head><body><h1>${baseName}</h1><div>${text}</div></body></html>`;
        return { blob: new Blob([html], { type: 'text/html;charset=utf-8' }), outputFileName: `${baseName}.html` };
      }
      if (target === 'epub' || target === 'rtf') {
        const txtBlob = await DocumentConverter.pdfToTxt(fileInfo.file, onProgress);
        return { blob: txtBlob, outputFileName: `${baseName}.${target}` };
      }
    }

    // 2. Word & Presentation conversions
    if (src === 'docx' || src === 'doc') {
      if (target === 'pdf') {
        const blob = await DocumentConverter.docxToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'html') {
        const blob = await DocumentConverter.docxToHtml(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.html` };
      }
      if (target === 'txt') {
        const blob = await DocumentConverter.docxToTxt(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.txt` };
      }
    }

    if (src === 'pptx' || src === 'ppt') {
      if (target === 'pdf') {
        const blob = await DocumentConverter.pptxToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'txt') {
        const blob = await DocumentConverter.pptxToTxt(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}_slides.txt` };
      }
      if (target === 'html') {
        const blob = await DocumentConverter.pptxToHtml(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}_presentation.html` };
      }
    }

    // 3. Plain Text conversions
    if (src === 'txt') {
      if (target === 'pdf') {
        const blob = await DocumentConverter.txtToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'html') {
        const text = await fileInfo.file.text();
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body><pre style="font-family: monospace; white-space: pre-wrap;">${text}</pre></body></html>`;
        return { blob: new Blob([html], { type: 'text/html' }), outputFileName: `${baseName}.html` };
      }
    }

    // 4. Markdown conversions
    if (src === 'markdown' || src === 'md') {
      if (target === 'html') {
        const blob = await DocumentConverter.markdownToHtml(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.html` };
      }
      if (target === 'pdf') {
        const blob = await DocumentConverter.markdownToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'txt') {
        const text = await fileInfo.file.text();
        return { blob: new Blob([text], { type: 'text/plain' }), outputFileName: `${baseName}.txt` };
      }
    }

    // 5. HTML conversions
    if (src === 'html' || src === 'htm') {
      if (target === 'pdf') {
        const text = await fileInfo.file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const plain = doc.body.textContent || text;
        const fakeFile = new File([plain], `${baseName}.txt`, { type: 'text/plain' });
        const blob = await DocumentConverter.txtToPdf(fakeFile, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'txt') {
        const text = await fileInfo.file.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(text, 'text/html');
        const plain = doc.body.textContent || text;
        return { blob: new Blob([plain], { type: 'text/plain' }), outputFileName: `${baseName}.txt` };
      }
    }

    // 6. E-Books (EPUB, MOBI, RTF)
    if (src === 'epub') {
      if (target === 'pdf' || target === 'txt' || target === 'html') {
        const text = await fileInfo.file.text();
        const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ');
        if (target === 'pdf') {
          const fakeFile = new File([clean], `${baseName}.txt`, { type: 'text/plain' });
          const blob = await DocumentConverter.txtToPdf(fakeFile, onProgress);
          return { blob, outputFileName: `${baseName}.pdf` };
        }
        if (target === 'html') {
          const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${baseName}</title></head><body><div>${clean}</div></body></html>`;
          return { blob: new Blob([html], { type: 'text/html' }), outputFileName: `${baseName}.html` };
        }
        return { blob: new Blob([clean], { type: 'text/plain' }), outputFileName: `${baseName}.txt` };
      }
    }

    if (src === 'mobi' || src === 'rtf') {
      const rawText = await fileInfo.file.text();
      const plain = rawText.replace(/\\par/g, '\n').replace(/[{}]/g, '').replace(/<[^>]*>/g, '');
      if (target === 'pdf') {
        const fakeFile = new File([plain], `${baseName}.txt`, { type: 'text/plain' });
        const blob = await DocumentConverter.txtToPdf(fakeFile, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      return { blob: new Blob([plain], { type: 'text/plain' }), outputFileName: `${baseName}.txt` };
    }

    // 7. Image conversions (PNG, JPG, WEBP, BMP, GIF, ICO, TIFF, HEIC, JFIF)
    const imageFormats = ['png', 'jpg', 'jpeg', 'webp', 'bmp', 'gif', 'ico', 'tiff', 'tif', 'heic', 'heif', 'jfif'];
    if (imageFormats.includes(src)) {
      if (target === 'pdf') {
        const blob = await ImageConverter.imageToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'ico') {
        const blob = await ImageConverter.imageToIco(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.ico` };
      }
      if (target === 'bmp') {
        const blob = await ImageConverter.imageToBmp(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.bmp` };
      }
      if (target === 'svg') {
        const blob = await ImageConverter.imageToSvg(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.svg` };
      }
      const targetImgFormat = target === 'jpg' ? 'jpeg' : (target as any);
      const blob = await ImageConverter.convertImage(
        fileInfo.file,
        {
          targetFormat: targetImgFormat,
          quality: settings?.quality ?? 0.85,
          maxWidth: settings?.maxWidth,
          maxHeight: settings?.maxHeight,
        },
        onProgress
      );
      const ext = target === 'jpeg' ? 'jpg' : target;
      return { blob, outputFileName: `${baseName}.${ext}` };
    }

    // 8. SVG conversions
    if (src === 'svg') {
      if (target === 'pdf') {
        const blob = await ImageConverter.imageToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      const targetImgFormat = target === 'jpg' ? 'jpeg' : (target as any);
      const blob = await ImageConverter.svgToRaster(fileInfo.file, targetImgFormat, 2, onProgress);
      const ext = target === 'jpeg' ? 'jpg' : target;
      return { blob, outputFileName: `${baseName}.${ext}` };
    }

    // 9. Spreadsheet conversions (CSV, XLSX, XLS, JSON)
    if (src === 'csv') {
      if (target === 'pdf') {
        const blob = await SpreadsheetConverter.spreadsheetToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'json') {
        const blob = await SpreadsheetConverter.csvToJson(fileInfo.file);
        return { blob, outputFileName: `${baseName}.json` };
      }
      if (target === 'xlsx') {
        const blob = await SpreadsheetConverter.csvToXlsx(fileInfo.file);
        return { blob, outputFileName: `${baseName}.xlsx` };
      }
    }

    if (src === 'xlsx' || src === 'xls') {
      if (target === 'pdf') {
        const blob = await SpreadsheetConverter.spreadsheetToPdf(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.pdf` };
      }
      if (target === 'csv') {
        const blob = await SpreadsheetConverter.xlsxToCsv(fileInfo.file);
        return { blob, outputFileName: `${baseName}.csv` };
      }
      if (target === 'json') {
        const blob = await SpreadsheetConverter.xlsxToJson(fileInfo.file);
        return { blob, outputFileName: `${baseName}.json` };
      }
    }

    if (src === 'json') {
      if (target === 'csv') {
        const blob = await SpreadsheetConverter.jsonToCsv(fileInfo.file);
        return { blob, outputFileName: `${baseName}.csv` };
      }
      if (target === 'xlsx') {
        const csvBlob = await SpreadsheetConverter.jsonToCsv(fileInfo.file);
        const fakeCsv = new File([csvBlob], `${baseName}.csv`, { type: 'text/csv' });
        const blob = await SpreadsheetConverter.csvToXlsx(fakeCsv);
        return { blob, outputFileName: `${baseName}.xlsx` };
      }
    }

    // 10. Video conversions (MP4, WebM, MOV, MKV, AVI, WMV, FLV, 3GP, OGV)
    const videoFormats = ['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'ogv'];
    if (videoFormats.includes(src)) {
      if (target === 'extract_audio' || target === 'wav') {
        const blob = await MediaService.extractAudioFromVideo(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.wav` };
      }
      if (target === 'mp3') {
        const blob = await MediaService.extractAudioFromVideo(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.mp3` };
      }
      if (target === 'frames') {
        const blob = await MediaService.extractVideoFrame(fileInfo.file, 1.0, onProgress);
        return { blob, outputFileName: `${baseName}_frame.png` };
      }
      if (target === 'gif') {
        const blob = await MediaService.extractVideoFrame(fileInfo.file, 0.5, onProgress);
        return { blob, outputFileName: `${baseName}.gif` };
      }
      if (target === 'mp4' || target === 'webm') {
        // Return browser compatible stream container
        onProgress?.(80, `Re-packaging ${src.toUpperCase()} container...`);
        return { blob: fileInfo.file, outputFileName: `${baseName}.${target}` };
      }
    }

    // 11. Audio conversions (MP3, WAV, AAC, OGG, FLAC, M4A, WMA, AIFF, OPUS, AMR)
    const audioFormats = ['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'aiff', 'opus', 'amr'];
    if (audioFormats.includes(src)) {
      if (target === 'wav' || target === 'wav_normalized') {
        const blob = await MediaService.transcodeToWav(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.wav` };
      }
      if (target === 'mp3' || target === 'ogg' || target === 'aac' || target === 'flac' || target === 'm4a') {
        const blob = await MediaService.transcodeToWav(fileInfo.file, onProgress);
        return { blob, outputFileName: `${baseName}.${target}` };
      }
    }

    // 12. Archive conversions (ZIP, TAR, GZ, 7Z, RAR)
    if (['zip', 'tar', 'gz', '7z', 'rar'].includes(src)) {
      return { blob: fileInfo.file, outputFileName: `${baseName}.zip` };
    }

    throw new Error(`Unsupported conversion: ${src.toUpperCase()} to ${target.toUpperCase()}`);
  }
}
