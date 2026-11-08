# Security Policy: FileForge Universal Offline Converter

## 1. Security Philosophy & Threat Model

FileForge is engineered around a **Zero-Upload, Local-Processing Architecture**. Traditional online conversion services upload confidential user documents to remote cloud infrastructure, introducing risks of eavesdropping, data leaks, server-side log retention, and third-party data processing.

FileForge operates under the tenet: **Your files never leave your device. All processing occurs exclusively in client-side memory.**

### Threat Vectors Considered:
1. **Malicious File Ingestion**: Attackers attempting to craft malformed or malicious PDFs, DOCX, SVG, or images containing executable payloads.
2. **ZIP Slip & Directory Traversal**: Malicious archive packages crafted with `../` path sequences intended to escape extraction roots.
3. **ZIP Bombs & Resource Exhaustion (DoS)**: Hyper-compressed files designed to exhaust browser memory (RAM) and lock the main UI thread.
4. **Extension Spoofing**: Files disguised with deceptive extensions (e.g. `.pdf` holding executable scripts or mismatched binary headers).
5. **Cross-Site Scripting (XSS) in Document Previews**: Untrusted HTML, SVG, or Markdown injecting `<script>` tags, inline event handlers (`onload`, `onerror`), or iframe frame-busting.
6. **Data Exfiltration / Network Snooping**: Hidden telemetry, third-party tracking scripts, or CDN dependencies intercepting user data.

---

## 2. Security Architecture & Controls

### A. Zero Outbound Data Transmission
- **Strict Network Isolation**: The application does not contain any backend conversion APIs or external cloud endpoints.
- **Runtime Network Monitor**: Every `window.fetch` and `XMLHttpRequest` call is intercepted and audited by the internal Network Monitor. Outbound payloads to external domains are automatically blocked.
- **Offline PWA Operation**: All conversion engines (`pdf-lib`, `pdfjs-dist`, `mammoth`, `xlsx`, `jszip`, Canvas rasterizers) are precached via Service Worker and execute offline without an internet connection.

### B. Input Validation & Magic Byte Inspection
- **Binary Signature Verification**: Files are evaluated via magic byte signatures (e.g., `%PDF-`, PNG header `89 50 4E 47`, JPEG `FF D8 FF`, ZIP `PK\x03\x04`).
- **Mismatch Warnings**: If an extension does not match the inspected magic bytes, FileForge warns the user and operates based on the genuine detected format.

### C. Archive Defense (ZIP Slip & ZIP Bombs)
- **Path Sanitization**: Every file inside a ZIP archive is inspected before extraction. Paths containing `..`, absolute roots (`/`), backslashes (`\`), or drive letters (`C:`) are flagged and excluded from extraction.
- **Decompression Ratio Limits**: Archives with compression ratios exceeding 100:1 or total uncompressed sizes exceeding memory safety boundaries (300 MB) trigger warnings to prevent browser denial-of-service.

### D. Content Sanitization & Sandboxing
- **DOMPurify Protection**: All DOCX-to-HTML, Markdown-to-HTML, and SVG-to-raster pipelines pass through `DOMPurify` to neutralize scripts, event handlers, and DOM clobbering vectors.
- **Sandboxed Previews**: Document previews render inside sandboxed `<iframe>` instances with restricted attributes (`sandbox="allow-same-origin"`) to isolate untrusted content from the application origin.

### E. Content Security Policy (CSP)
FileForge enforces a strict Content Security Policy in `index.html`:
```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' blob:; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self' blob: data:; worker-src 'self' blob:; frame-src 'self' blob: data:; object-src 'none'; base-uri 'self';
```

---

## 3. Known Limitations

- **Browser Memory Boundaries**: Conversions occur entirely within browser memory (V8/WebAssembly heap). Extremely massive files (>1 GB depending on device hardware) may be subject to browser memory limits.
- **Client-Side Environment**: While FileForge isolates processing, it runs inside the user's browser environment. Malware or malicious browser extensions installed on the user's host machine could theoretically inspect browser memory.
- **Not a Malware Scanner**: FileForge converts document layouts and data structures; it is not a replacement for dedicated host antivirus or antimalware software.

---

## 4. Responsible Disclosure

If you discover a security vulnerability or bypass in FileForge's local processing sandbox, please report it responsibly:
- **Email**: `security@fileforge.local`
- Please provide detailed reproduction steps, the affected file format, and sample test files.
- We appreciate ethical vulnerability reporting and will investigate and patch confirmed security issues promptly.
