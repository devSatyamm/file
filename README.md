# FileForge: Universal Offline File Converter & Toolkit

> **Zero-Upload • 100% On-Device • Genuine Offline PWA**

FileForge is a premium, desktop-grade, universal file converter and document toolkit built for complete offline privacy. Unlike traditional cloud converters that upload your confidential files to remote servers, FileForge executes all conversions directly inside the user's browser memory using WebAssembly, PDF.js, PDF-lib, SheetJS, Mammoth, Canvas, and Web Crypto APIs.

---

## 🌟 Core Architecture & Highlights

- **100% Offline-First PWA**: Once loaded, all engines, workers, binaries, and fonts are precached via Service Worker. The application functions flawlessly in airplane mode with Wi-Fi disconnected.
- **Zero Outbound Data Transmission**: No backend conversion APIs, no analytics inspecting user files, no cloud storage. Every byte remains strictly local.
- **Intelligent File Detection**: Inspects magic bytes and binary file headers rather than trusting spoofed file extensions.
- **Real-Time Network Activity Monitor**: Live audit interceptor monitoring `fetch` and `XMLHttpRequest`, verifying zero bytes leave the sandbox.
- **Automated Security Defense Suite**: Built-in automated tests validating defenses against Malicious SVG scripts, ZIP Slip directory traversals, ZIP Bomb decompression attacks, and extension spoofing.

---

## 🛠️ Supported Modules & Conversions

### A. Document Converter
- **PDF to Plain Text (`.txt`)**: Extracts complete text layer across all pages using PDF.js.
- **PDF to Images (`.png`)**: High-resolution rasterization of pages with batch ZIP generation.
- **DOCX to Semantic HTML (`.html`)**: Semantic Word document parsing sanitized via DOMPurify.
- **DOCX to Plain Text (`.txt`)**: Clean text extraction stripping proprietary formatting.
- **TXT to PDF (`.pdf`)**: Standard A4 pagination with custom line wrapping and page numbers.
- **Markdown to HTML (`.html`)**: Formats headings, code blocks, lists, and links into clean HTML.
- **Markdown to PDF (`.pdf`)**: Formats Markdown into paginated PDF documents.
- **HTML to PDF (`.pdf`)**: Sanitizes and compiles HTML text content into PDF.

### B. Image Converter & Studio
- **PNG ↔ JPEG ↔ WebP**: Hardware-accelerated Canvas rasterization and format transcoding.
- **SVG to Raster (PNG / JPEG / WebP)**: DOMPurify vector sanitization + high-res canvas scaling.
- **Quality & Compression Controls**: Adjustable quality sliders (10% to 100%) and dimension scaling.

### C. PDF Toolkit
- **Merge PDFs**: Combine multiple independent PDF files into a single unified document.
- **Split & Extract**: Extract specific page ranges (e.g. `1-3, 5, 8-10`).
- **Rotate Pages**: 90°, 180°, and 270° clockwise rotation on selected or all pages.
- **Delete Pages**: Remove specified pages permanently from the document.
- **Watermark Engine**: Apply diagonal or horizontal text watermarks with customizable opacity, rotation, and font styling.
- **Page Numbers**: Add "Page X of Y" or "X / Y" stamps (Bottom Center, Bottom Right, Top Right).

### D. Spreadsheet Converter & Previewer
- **CSV to JSON**: Parse CSV tables into structured JSON arrays of objects.
- **JSON to CSV**: Convert JSON arrays into standard CSV spreadsheets.
- **XLSX to CSV**: Export Excel workbooks to comma-separated values.
- **CSV to XLSX**: Package CSV records into `.xlsx` workbook binaries.
- **Interactive Grid Preview**: View tabular rows, inspect column headers, and switch workbook sheets in-app.

### E. Developer Toolkit
- **JSON Formatter & Validator**: Beautify (2 or 4 spaces), compact minify, syntax error pinpointing.
- **XML / HTML / CSS / JS Formatters**: Clean indentation, bracket alignment, and code beautification.
- **Base64 & URL Suite**: UTF-8 binary and text Base64 encoder/decoder, URL encoder/decoder.
- **Cryptographic Hashes**: Web Crypto API calculations for SHA-256, SHA-512, SHA-1, and MD5.
- **Text Diff Tool**: Line-by-line visual difference comparison with addition and deletion highlights.

### F. Archive Manager
- **Inspect ZIP**: Inspect archive hierarchy, file counts, uncompressed sizes, and compression ratios.
- **ZIP Slip Defense**: Detects and neutralizes malicious `../` directory traversal vectors.
- **ZIP Bomb Defense**: Flags dangerous compression ratios (>100:1) and limits excessive memory expansion.
- **Extract & Create**: Selective extraction of safe files or multi-file packaging with DEFLATE compression levels (1-9).

### G. Audio & Media Utilities
- **Audio Transcoding to WAV**: Decodes input audio using Web Audio API and outputs 16-bit PCM WAV.
- **Audio Extraction from Video**: Strips audio streams from MP4/WebM containers into clean audio files.
- **Video Frame Snapshot**: Extracts high-resolution still frames from video files into PNG images.

---

## 🔒 Security Architecture

FileForge adheres to a **Zero-Upload Threat Model**:
- **Content Security Policy (CSP)**: Strict policy preventing dynamic code injection (`eval()`) and external data exfiltration.
- **Sandboxed Document Previews**: Renders output files within isolated `<iframe>` environments.
- **Audit Logs**: Live Network Monitor records all local HTTP activity in the Security Center.
- **See Full Security Documentation**: [`SECURITY.md`](file:///c:/Users/mishr/Desktop/file/SECURITY.md)

---

## 💻 Desktop PWA Installation

FileForge is a Progressive Web App installable as a standalone native desktop utility:
- **Chrome / Edge / Brave**: Click the **Install App** button in the header or the install icon in the URL bar.
- **macOS / Safari**: Select `File` → `Add to Dock` / `Add to Home Screen`.
- **Offline Reliability**: Works with disconnected Wi-Fi or in Airplane Mode.

---

## 🚀 Development & Build

```bash
# Install dependencies
npm install

# Start local dev server
npm run dev

# Run automated engine verification tests
node verify-engines.mjs

# Build production PWA bundles (Frontend-focused with relative paths)
npm run build

# Preview production build locally
npm run preview
```

---

## 🌐 Deploying to GitHub & Direct HTML Viewing

FileForge is configured as a **100% frontend-focused static application** (`base: './'`):
- **View Directly via HTML**: You can open `dist/index.html` directly in any web browser without needing a server.
- **GitHub Pages Ready**: A GitHub Actions workflow is included at `.github/workflows/deploy.yml`. When you push to your repository on GitHub, it automatically builds and publishes the site live.

---

## 👨‍💻 Developer & Author

**Satyam Mishra** — Lead Architect & Creator

- **GitHub**: [@devsatyamm](https://github.com/devsatyamm)
- **LinkedIn**: [@satyamofficial](https://linkedin.com/in/satyamofficial)
- **Instagram**: [@developersatyam](https://instagram.com/developersatyam)

---

## 📄 License

Open-source under the MIT License. Created with ❤️ by Satyam Mishra.
