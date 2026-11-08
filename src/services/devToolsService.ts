export interface DiffLine {
  type: 'added' | 'removed' | 'unchanged';
  text: string;
  leftLineNumber?: number;
  rightLineNumber?: number;
}

export class DevToolsService {
  /**
   * JSON Formatter & Validator
   */
  public static formatJson(
    input: string,
    indent = 2
  ): { formatted: string; isValid: boolean; error?: string } {
    try {
      const parsed = JSON.parse(input);
      return {
        formatted: indent === 0 ? JSON.stringify(parsed) : JSON.stringify(parsed, null, indent),
        isValid: true,
      };
    } catch (err: any) {
      return {
        formatted: input,
        isValid: false,
        error: err.message || 'Invalid JSON syntax',
      };
    }
  }

  /**
   * XML / HTML Formatter
   */
  public static formatXml(xml: string): string {
    let formatted = '';
    let indent = '';
    const tab = '  ';

    xml.split(/>\s*</).forEach((node) => {
      if (node.match(/^\/\w/)) {
        indent = indent.substring(tab.length);
      }
      formatted += indent + '<' + node + '>\r\n';
      if (node.match(/^<?\w[^>]*[^\/]$/) && !node.startsWith('input') && !node.startsWith('img') && !node.startsWith('br') && !node.startsWith('hr')) {
        indent += tab;
      }
    });

    return formatted.substring(1, formatted.length - 3);
  }

  /**
   * CSS Formatter
   */
  public static formatCss(css: string, minify = false): string {
    if (minify) {
      return css
        .replace(/\/\*[\s\S]*?\*\//g, '')
        .replace(/\s+/g, ' ')
        .replace(/\s*([\{\}:;,])\s*/g, '$1')
        .replace(/;}/g, '}')
        .trim();
    }

    // Beautify CSS
    let clean = css.replace(/\/\*[\s\S]*?\*\//g, '').trim();
    let res = '';
    let depth = 0;
    const tab = '  ';

    for (let i = 0; i < clean.length; i++) {
      const char = clean[i];
      if (char === '{') {
        res += ' {\n' + tab.repeat(++depth);
      } else if (char === '}') {
        depth = Math.max(0, depth - 1);
        res += '\n' + tab.repeat(depth) + '}\n\n' + tab.repeat(depth);
      } else if (char === ';') {
        res += ';\n' + tab.repeat(depth);
      } else {
        res += char;
      }
    }
    return res.replace(/\n\s*\n\s*\n/g, '\n\n').trim();
  }

  /**
   * JavaScript / General Code Indenter
   */
  public static formatJs(code: string): string {
    const lines = code.split('\n');
    let indentLevel = 0;
    const tab = '  ';
    const formattedLines: string[] = [];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) {
        formattedLines.push('');
        continue;
      }

      if (line.startsWith('}') || line.startsWith(']') || line.startsWith(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }

      formattedLines.push(tab.repeat(indentLevel) + line);

      if (line.endsWith('{') || line.endsWith('[') || line.endsWith('(')) {
        indentLevel++;
      }
    }

    return formattedLines.join('\n');
  }

  /**
   * Base64 Encode & Decode (UTF-8 safe)
   */
  public static encodeBase64(str: string): string {
    const bytes = new TextEncoder().encode(str);
    const binString = Array.from(bytes, (b) => String.fromCharCode(b)).join('');
    return btoa(binString);
  }

  public static decodeBase64(b64: string): string {
    const binString = atob(b64.trim());
    const bytes = Uint8Array.from(binString, (m) => m.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  /**
   * URL Encode & Decode
   */
  public static encodeUrl(str: string, component = true): string {
    return component ? encodeURIComponent(str) : encodeURI(str);
  }

  public static decodeUrl(str: string): string {
    return decodeURIComponent(str);
  }

  /**
   * Web Crypto Hash Generation (SHA-256, SHA-512, SHA-1, MD5 approximation)
   */
  public static async generateHashes(
    data: string | ArrayBuffer
  ): Promise<{ sha1: string; sha256: string; sha512: string; md5: string }> {
    const buffer = typeof data === 'string' ? new TextEncoder().encode(data).buffer : data;

    const [sha1Buffer, sha256Buffer, sha512Buffer] = await Promise.all([
      crypto.subtle.digest('SHA-1', buffer),
      crypto.subtle.digest('SHA-256', buffer),
      crypto.subtle.digest('SHA-512', buffer),
    ]);

    const toHex = (buf: ArrayBuffer) =>
      Array.from(new Uint8Array(buf))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join('');

    return {
      sha1: toHex(sha1Buffer),
      sha256: toHex(sha256Buffer),
      sha512: toHex(sha512Buffer),
      md5: this.calculateSimpleMd5(new Uint8Array(buffer)),
    };
  }

  /**
   * Client-side fast MD5 algorithm
   */
  private static calculateSimpleMd5(bytes: Uint8Array): string {
    // Standard RFC 1321 MD5 implementation in pure JS
    function md5cycle(x: any, k: any) {
      let a = x[0], b = x[1], c = x[2], d = x[3];
      a = ff(a, b, c, d, k[0], 7, -680876936);
      d = ff(d, a, b, c, k[1], 12, -389564586);
      c = ff(c, d, a, b, k[2], 17, 606105819);
      b = ff(b, c, d, a, k[3], 22, -1044525330);
      a = ff(a, b, c, d, k[4], 7, -176418897);
      d = ff(d, a, b, c, k[5], 12, 1200080426);
      c = ff(c, d, a, b, k[6], 17, -1473231341);
      b = ff(b, c, d, a, k[7], 22, -45705983);
      a = ff(a, b, c, d, k[8], 7, 1770035416);
      d = ff(d, a, b, c, k[9], 12, -1958414417);
      c = ff(c, d, a, b, k[10], 17, -42063);
      b = ff(b, c, d, a, k[11], 22, -1990404162);
      a = ff(a, b, c, d, k[12], 7, 1804603682);
      d = ff(d, a, b, c, k[13], 12, -40341101);
      c = ff(c, d, a, b, k[14], 17, -1502002290);
      b = ff(b, c, d, a, k[15], 22, 1236535329);

      a = gg(a, b, c, d, k[1], 5, -165796510);
      d = gg(d, a, b, c, k[6], 9, -1069501632);
      c = gg(c, d, a, b, k[11], 14, 643717713);
      b = gg(b, c, d, a, k[0], 20, -373897302);
      a = gg(a, b, c, d, k[5], 5, -701558691);
      d = gg(d, a, b, c, k[10], 9, 38016083);
      c = gg(c, d, a, b, k[15], 14, -660478335);
      b = gg(b, c, d, a, k[4], 20, -405537848);
      a = gg(a, b, c, d, k[9], 5, 568446438);
      d = gg(d, a, b, c, k[14], 9, -1019803690);
      c = gg(c, d, a, b, k[3], 14, -187363961);
      b = gg(b, c, d, a, k[8], 20, 1163531501);
      a = gg(a, b, c, d, k[13], 5, -1444681467);
      d = gg(d, a, b, c, k[2], 9, -51403784);
      c = gg(c, d, a, b, k[7], 14, 1735328473);
      b = gg(b, c, d, a, k[12], 20, -1926607734);

      a = hh(a, b, c, d, k[5], 4, -378558);
      d = hh(d, a, b, c, k[8], 11, -2022574463);
      c = hh(c, d, a, b, k[11], 16, 1839030562);
      b = hh(b, c, d, a, k[14], 23, -35309556);
      a = hh(a, b, c, d, k[1], 4, -1530992060);
      d = hh(d, a, b, c, k[4], 11, 1272893353);
      c = hh(c, d, a, b, k[7], 16, -155497632);
      b = hh(b, c, d, a, k[10], 23, -1094730640);
      a = hh(a, b, c, d, k[13], 4, 681279174);
      d = hh(d, a, b, c, k[0], 11, -358537222);
      c = hh(c, d, a, b, k[3], 16, -722521979);
      b = hh(b, c, d, a, k[6], 23, 76029189);
      a = hh(a, b, c, d, k[9], 4, -640364487);
      d = hh(d, a, b, c, k[12], 11, -421815835);
      c = hh(c, d, a, b, k[15], 16, 530742520);
      b = hh(b, c, d, a, k[2], 23, -995338651);

      a = ii(a, b, c, d, k[0], 6, -198630844);
      d = ii(d, a, b, c, k[7], 10, 1126891415);
      c = ii(c, d, a, b, k[14], 15, -1416354905);
      b = ii(b, c, d, a, k[5], 21, -57434055);
      a = ii(a, b, c, d, k[12], 6, 1700485571);
      d = ii(d, a, b, c, k[3], 10, -1894986606);
      c = ii(c, d, a, b, k[10], 15, -1051523);
      b = ii(b, c, d, a, k[1], 21, -2054922799);
      a = ii(a, b, c, d, k[8], 6, 1873313359);
      d = ii(d, a, b, c, k[15], 10, -30611744);
      c = ii(c, d, a, b, k[6], 15, -1560198380);
      b = ii(b, c, d, a, k[13], 21, 1309151649);
      a = ii(a, b, c, d, k[4], 6, -145523070);
      d = ii(d, a, b, c, k[11], 10, -1120210379);
      c = ii(c, d, a, b, k[2], 15, 718787259);
      b = ii(b, c, d, a, k[9], 21, -343485551);

      x[0] = add32(a, x[0]);
      x[1] = add32(b, x[1]);
      x[2] = add32(c, x[2]);
      x[3] = add32(d, x[3]);
    }

    function cmn(q: number, a: number, b: number, x: number, s: number, t: number) {
      a = add32(add32(a, q), add32(x, t));
      return add32((a << s) | (a >>> (32 - s)), b);
    }
    function ff(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & c) | (~b & d), a, b, x, s, t);
    }
    function gg(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn((b & d) | (c & ~d), a, b, x, s, t);
    }
    function hh(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function ii(a: number, b: number, c: number, d: number, x: number, s: number, t: number) {
      return cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function add32(a: number, b: number) {
      return (a + b) & 0xffffffff;
    }

    const n = bytes.length;
    const state = [1732584193, -271733879, -1732584194, 271733878];
    const tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    let i: number;

    for (i = 64; i <= n; i += 64) {
      const block: number[] = [];
      for (let j = 0; j < 16; j++) {
        const offset = i - 64 + j * 4;
        block[j] = bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24);
      }
      md5cycle(state, block);
    }

    const rem = n - (i - 64);
    for (let j = 0; j < rem; j++) {
      tail[j >> 2] |= bytes[n - rem + j] << ((j % 4) << 3);
    }
    tail[rem >> 2] |= 0x80 << ((rem % 4) << 3);
    if (rem > 55) {
      md5cycle(state, tail);
      for (let j = 0; j < 16; j++) tail[j] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);

    const hexChars = '0123456789abcdef';
    let res = '';
    for (let j = 0; j < 4; j++) {
      for (let k = 0; k < 4; k++) {
        const byte = (state[j] >> (k * 8)) & 0xff;
        res += hexChars[(byte >> 4) & 0x0f] + hexChars[byte & 0x0f];
      }
    }
    return res;
  }

  /**
   * Text Comparison & Diff Generator
   */
  public static computeDiff(original: string, modified: string): DiffLine[] {
    const origLines = original.split(/\r?\n/);
    const modLines = modified.split(/\r?\n/);
    const diffs: DiffLine[] = [];

    let i = 0;
    let j = 0;
    let leftNum = 1;
    let rightNum = 1;

    while (i < origLines.length || j < modLines.length) {
      if (i < origLines.length && j < modLines.length && origLines[i] === modLines[j]) {
        diffs.push({
          type: 'unchanged',
          text: origLines[i],
          leftLineNumber: leftNum++,
          rightLineNumber: rightNum++,
        });
        i++;
        j++;
      } else if (j < modLines.length && (i >= origLines.length || !origLines.slice(i, i + 5).includes(modLines[j]))) {
        diffs.push({
          type: 'added',
          text: modLines[j],
          rightLineNumber: rightNum++,
        });
        j++;
      } else if (i < origLines.length) {
        diffs.push({
          type: 'removed',
          text: origLines[i],
          leftLineNumber: leftNum++,
        });
        i++;
      }
    }

    return diffs;
  }
}

