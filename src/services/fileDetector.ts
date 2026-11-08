import { DetectedFileInfo, FileCategory } from '../types';

interface SignatureRule {
  format: string;
  mime: string;
  category: FileCategory;
  check: (bytes: Uint8Array, textSample: string) => boolean;
}

const SIGNATURES: SignatureRule[] = [
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  {
    format: 'png',
    mime: 'image/png',
    category: 'image',
    check: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0x89 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x4e &&
      bytes[3] === 0x47 &&
      bytes[4] === 0x0d &&
      bytes[5] === 0x0a &&
      bytes[6] === 0x1a &&
      bytes[7] === 0x0a,
  },
  // JPEG: FF D8 FF
  {
    format: 'jpg',
    mime: 'image/jpeg',
    category: 'image',
    check: (bytes) =>
      bytes.length >= 3 &&
      bytes[0] === 0xff &&
      bytes[1] === 0xd8 &&
      bytes[2] === 0xff,
  },
  // GIF: GIF87a / GIF89a
  {
    format: 'gif',
    mime: 'image/gif',
    category: 'image',
    check: (bytes) =>
      bytes.length >= 6 &&
      bytes[0] === 0x47 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x38 &&
      (bytes[4] === 0x37 || bytes[4] === 0x39) &&
      bytes[5] === 0x61,
  },
  // WEBP: RIFF....WEBP
  {
    format: 'webp',
    mime: 'image/webp',
    category: 'image',
    check: (bytes) =>
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x45 &&
      bytes[10] === 0x42 &&
      bytes[11] === 0x50,
  },
  // PDF: %PDF-
  {
    format: 'pdf',
    mime: 'application/pdf',
    category: 'pdf',
    check: (bytes) =>
      bytes.length >= 4 &&
      bytes[0] === 0x25 &&
      bytes[1] === 0x50 &&
      bytes[2] === 0x44 &&
      bytes[3] === 0x46,
  },
  // WAV: RIFF....WAVE
  {
    format: 'wav',
    mime: 'audio/wav',
    category: 'media',
    check: (bytes) =>
      bytes.length >= 12 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46 &&
      bytes[8] === 0x57 &&
      bytes[9] === 0x41 &&
      bytes[10] === 0x56 &&
      bytes[11] === 0x45,
  },
  // MP3: ID3 or sync frame
  {
    format: 'mp3',
    mime: 'audio/mpeg',
    category: 'media',
    check: (bytes) =>
      (bytes.length >= 3 && bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) ||
      (bytes.length >= 2 && bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0),
  },
  // MP4: ....ftyp
  {
    format: 'mp4',
    mime: 'video/mp4',
    category: 'media',
    check: (bytes) =>
      bytes.length >= 8 &&
      bytes[4] === 0x66 &&
      bytes[5] === 0x74 &&
      bytes[6] === 0x79 &&
      bytes[7] === 0x70,
  },
  // WEBM / MKV: 1A 45 DF A3 (EBML)
  {
    format: 'webm',
    mime: 'video/webm',
    category: 'media',
    check: (bytes) =>
      bytes.length >= 4 &&
      bytes[0] === 0x1a &&
      bytes[1] === 0x45 &&
      bytes[2] === 0xdf &&
      bytes[3] === 0xa3,
  },
  // ZIP based: PK\x03\x04
  {
    format: 'zip',
    mime: 'application/zip',
    category: 'archive',
    check: (bytes) =>
      bytes.length >= 4 &&
      bytes[0] === 0x50 &&
      bytes[1] === 0x4b &&
      bytes[2] === 0x03 &&
      bytes[3] === 0x04,
  },
  // SVG: text containing <svg
  {
    format: 'svg',
    mime: 'image/svg+xml',
    category: 'image',
    check: (_, text) => {
      const lower = text.toLowerCase();
      return lower.includes('<svg') && (lower.includes('xmlns') || lower.includes('viewbox') || lower.includes('</svg>'));
    },
  },
  // HTML: <!doctype html or <html
  {
    format: 'html',
    mime: 'text/html',
    category: 'document',
    check: (_, text) => {
      const lower = text.toLowerCase().trim();
      return lower.startsWith('<!doctype html') || lower.includes('<html') || (lower.includes('<body') && lower.includes('</body>'));
    },
  },
  // JSON: valid JSON starting with { or [
  {
    format: 'json',
    mime: 'application/json',
    category: 'developer',
    check: (_, text) => {
      const trimmed = text.trim();
      if ((trimmed.startsWith('{') && trimmed.endsWith('}')) || (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
        try {
          JSON.parse(trimmed);
          return true;
        } catch {
          return false;
        }
      }
      return false;
    },
  },
  // XML
  {
    format: 'xml',
    mime: 'application/xml',
    category: 'developer',
    check: (_, text) => {
      const trimmed = text.trim();
      return trimmed.startsWith('<?xml') || (trimmed.startsWith('<') && trimmed.endsWith('>') && !trimmed.toLowerCase().includes('<html'));
    },
  },
  // Microsoft Compound Document (OLE CFBF): D0 CF 11 E0 A1 B1 1A E1 (.ppt, .doc, .xls legacy binary)
  {
    format: 'ole',
    mime: 'application/x-ole-storage',
    category: 'document',
    check: (bytes) =>
      bytes.length >= 8 &&
      bytes[0] === 0xd0 &&
      bytes[1] === 0xcf &&
      bytes[2] === 0x11 &&
      bytes[3] === 0xe0 &&
      bytes[4] === 0xa1 &&
      bytes[5] === 0xb1 &&
      bytes[6] === 0x1a &&
      bytes[7] === 0xe1,
  },
];

// Return supported targets for a detected format
export function getSupportedConversions(format: string): string[] {
  const f = format.toLowerCase();
  switch (f) {
    case 'pdf':
      return ['docx', 'xlsx', 'pptx', 'txt', 'png', 'jpg', 'html', 'epub', 'rtf'];
    case 'docx':
    case 'doc':
      return ['pdf', 'html', 'txt'];
    case 'pptx':
    case 'ppt':
      return ['pdf', 'txt', 'html'];
    case 'txt':
      return ['pdf', 'html'];
    case 'html':
    case 'htm':
      return ['pdf', 'txt'];
    case 'markdown':
    case 'md':
      return ['pdf', 'html', 'txt'];
    case 'epub':
    case 'mobi':
    case 'rtf':
      return ['pdf', 'txt', 'html'];
    case 'png':
      return ['pdf', 'jpg', 'webp', 'svg', 'bmp', 'ico', 'gif'];
    case 'jpg':
    case 'jpeg':
      return ['pdf', 'png', 'webp', 'svg', 'bmp', 'ico'];
    case 'webp':
      return ['pdf', 'png', 'jpg', 'gif'];
    case 'svg':
      return ['pdf', 'png', 'jpg', 'webp'];
    case 'bmp':
      return ['pdf', 'png', 'jpg', 'webp'];
    case 'gif':
      return ['png', 'jpg', 'mp4'];
    case 'ico':
      return ['png', 'jpg'];
    case 'tiff':
    case 'tif':
    case 'heic':
    case 'heif':
    case 'jfif':
      return ['jpg', 'png', 'pdf'];
    case 'csv':
      return ['pdf', 'json', 'xlsx'];
    case 'xlsx':
    case 'xls':
      return ['pdf', 'csv', 'json'];
    case 'json':
      return ['csv', 'xlsx'];
    case 'zip':
    case 'tar':
    case 'gz':
    case '7z':
    case 'rar':
      return ['extract', 'inspect', 'zip'];
    case 'wav':
      return ['mp3', 'ogg', 'aac', 'wav_normalized'];
    case 'mp3':
      return ['wav', 'ogg', 'aac', 'flac', 'm4a'];
    case 'aac':
    case 'ogg':
    case 'flac':
    case 'm4a':
    case 'wma':
    case 'aiff':
    case 'opus':
    case 'amr':
      return ['wav', 'mp3'];
    case 'mp4':
    case 'webm':
    case 'mov':
    case 'mkv':
    case 'avi':
    case 'wmv':
    case 'flv':
    case '3gp':
    case 'ogv':
      return ['mp4', 'webm', 'mp3', 'wav', 'gif', 'frames'];
    default:
      return [];
  }
}

export async function detectFile(file: File): Promise<DetectedFileInfo> {
  const name = file.name;
  const size = file.size;
  const rawExt = name.includes('.') ? name.split('.').pop()?.toLowerCase() || '' : '';
  const declaredMime = file.type || 'application/octet-stream';

  // Read first 4096 bytes for signature inspection
  const sliceSize = Math.min(4096, size);
  const slice = file.slice(0, sliceSize);
  const buffer = await slice.arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Convert first 16 bytes to hex string for inspection display
  const hexArray: string[] = [];
  const hexLimit = Math.min(16, bytes.length);
  for (let i = 0; i < hexLimit; i++) {
    hexArray.push(bytes[i].toString(16).padStart(2, '0').toUpperCase());
  }
  const magicBytesHex = hexArray.join(' ');

  // Try text decoding
  let textSample = '';
  try {
    const decoder = new TextDecoder('utf-8', { fatal: false });
    textSample = decoder.decode(bytes);
  } catch {
    textSample = '';
  }

  // Check against known binary & text signatures
  let matchedRule: SignatureRule | null = null;
  for (const rule of SIGNATURES) {
    if (rule.check(bytes, textSample)) {
      matchedRule = rule;
      break;
    }
  }

  // Handle ZIP disambiguation (DOCX, XLSX, or pure ZIP)
  let detectedFormat = matchedRule ? matchedRule.format : rawExt || 'unknown';
  let detectedMime = matchedRule ? matchedRule.mime : declaredMime;
  let category: FileCategory = matchedRule ? matchedRule.category : 'unknown';

  if (matchedRule?.format === 'zip') {
    // Check if docx or xlsx by looking for internal path keywords
    if (textSample.includes('word/') || textSample.includes('word/document.xml')) {
      detectedFormat = 'docx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      category = 'document';
    } else if (textSample.includes('ppt/') || textSample.includes('ppt/presentation.xml')) {
      detectedFormat = 'pptx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      category = 'document';
    } else if (textSample.includes('xl/') || textSample.includes('xl/workbook.xml')) {
      detectedFormat = 'xlsx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      category = 'spreadsheet';
    } else if (rawExt === 'docx') {
      detectedFormat = 'docx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      category = 'document';
    } else if (rawExt === 'pptx') {
      detectedFormat = 'pptx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      category = 'document';
    } else if (rawExt === 'xlsx') {
      detectedFormat = 'xlsx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
      category = 'spreadsheet';
    } else {
      detectedFormat = 'zip';
      detectedMime = 'application/zip';
      category = 'archive';
    }
  }

  if (matchedRule?.format === 'ole') {
    if (rawExt === 'ppt') {
      detectedFormat = 'ppt';
      detectedMime = 'application/vnd.ms-powerpoint';
      category = 'document';
    } else if (rawExt === 'doc') {
      detectedFormat = 'doc';
      detectedMime = 'application/msword';
      category = 'document';
    } else if (rawExt === 'xls') {
      detectedFormat = 'xls';
      detectedMime = 'application/vnd.ms-excel';
      category = 'spreadsheet';
    } else {
      detectedFormat = rawExt || 'ppt';
      detectedMime = 'application/vnd.ms-powerpoint';
      category = 'document';
    }
  }

  // Handle plain text files and format fallback by extension if no binary rule matched
  if (!matchedRule) {
    if (rawExt === 'csv') {
      detectedFormat = 'csv';
      detectedMime = 'text/csv';
      category = 'spreadsheet';
    } else if (rawExt === 'xls') {
      detectedFormat = 'xls';
      detectedMime = 'application/vnd.ms-excel';
      category = 'spreadsheet';
    } else if (rawExt === 'ppt') {
      detectedFormat = 'ppt';
      detectedMime = 'application/vnd.ms-powerpoint';
      category = 'document';
    } else if (rawExt === 'pptx') {
      detectedFormat = 'pptx';
      detectedMime = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
      category = 'document';
    } else if (rawExt === 'md' || rawExt === 'markdown') {
      detectedFormat = 'markdown';
      detectedMime = 'text/markdown';
      category = 'document';
    } else if (rawExt === 'txt') {
      detectedFormat = 'txt';
      detectedMime = 'text/plain';
      category = 'document';
    } else if (rawExt === 'doc') {
      detectedFormat = 'doc';
      detectedMime = 'application/msword';
      category = 'document';
    } else if (rawExt === 'epub') {
      detectedFormat = 'epub';
      detectedMime = 'application/epub+zip';
      category = 'document';
    } else if (rawExt === 'mobi') {
      detectedFormat = 'mobi';
      detectedMime = 'application/x-mobipocket-ebook';
      category = 'document';
    } else if (rawExt === 'rtf') {
      detectedFormat = 'rtf';
      detectedMime = 'application/rtf';
      category = 'document';
    } else if (['bmp', 'ico', 'tiff', 'tif', 'heic', 'heif', 'jfif'].includes(rawExt)) {
      detectedFormat = rawExt;
      detectedMime = `image/${rawExt}`;
      category = 'image';
    } else if (['mp4', 'webm', 'mov', 'mkv', 'avi', 'wmv', 'flv', '3gp', 'ogv'].includes(rawExt)) {
      detectedFormat = rawExt;
      detectedMime = `video/${rawExt}`;
      category = 'media';
    } else if (['mp3', 'wav', 'aac', 'ogg', 'flac', 'm4a', 'wma', 'aiff', 'opus', 'amr'].includes(rawExt)) {
      detectedFormat = rawExt;
      detectedMime = `audio/${rawExt}`;
      category = 'media';
    } else if (['tar', 'gz', '7z', 'rar'].includes(rawExt)) {
      detectedFormat = rawExt;
      detectedMime = 'application/octet-stream';
      category = 'archive';
    } else if (['js', 'ts', 'jsx', 'tsx', 'css', 'sql'].includes(rawExt)) {
      detectedFormat = rawExt;
      detectedMime = 'text/plain';
      category = 'developer';
    } else if (declaredMime.startsWith('image/')) {
      detectedFormat = rawExt || 'image';
      detectedMime = declaredMime;
      category = 'image';
    } else if (declaredMime.startsWith('audio/')) {
      detectedFormat = rawExt || 'audio';
      detectedMime = declaredMime;
      category = 'media';
    } else if (declaredMime.startsWith('video/')) {
      detectedFormat = rawExt || 'video';
      detectedMime = declaredMime;
      category = 'media';
    }
  }

  // Detect extension mismatch! E.g. file is named "photo.pdf" but magic bytes say "png"
  const normalizedRaw = rawExt === 'jpeg' ? 'jpg' : rawExt;
  const normalizedDetected = detectedFormat === 'jpeg' ? 'jpg' : detectedFormat;
  const isMismatched = normalizedRaw !== '' && normalizedRaw !== normalizedDetected && matchedRule !== null;

  const supportedConversions = getSupportedConversions(detectedFormat);

  return {
    file,
    name,
    size,
    extension: rawExt,
    mimeType: declaredMime,
    detectedFormat,
    detectedMime,
    category,
    isMismatched,
    magicBytesHex,
    confidence: matchedRule ? 'high' : 'medium',
    supportedConversions,
  };
}

