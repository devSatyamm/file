import fs from 'fs';
import path from 'path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');
const docsDir = path.join(rootDir, 'docs');

// 1. If index.source.html was built to dist, make sure dist/index.html is created
const distSourceHtml = path.join(distDir, 'index.source.html');
const distIndexHtml = path.join(distDir, 'index.html');
if (fs.existsSync(distSourceHtml)) {
  fs.copyFileSync(distSourceHtml, distIndexHtml);
}

// 2. Refresh docs/ directory for GitHub Pages (docs folder source)
if (fs.existsSync(docsDir)) {
  fs.rmSync(docsDir, { recursive: true, force: true });
}
fs.cpSync(distDir, docsDir, { recursive: true });

// 3. Sync compiled production bundle to root directory for GitHub Pages (root source) & direct HTML execution
if (fs.existsSync(distIndexHtml)) {
  fs.copyFileSync(distIndexHtml, path.join(rootDir, 'index.html'));
}

const distAssets = path.join(distDir, 'assets');
const rootAssets = path.join(rootDir, 'assets');
if (fs.existsSync(distAssets)) {
  if (fs.existsSync(rootAssets)) {
    fs.rmSync(rootAssets, { recursive: true, force: true });
  }
  fs.cpSync(distAssets, rootAssets, { recursive: true });
}

// 4. Sync PWA and service worker artifacts to root
const rootArtifacts = [
  'sw.js',
  'manifest.webmanifest',
  'offline.html',
  '404.html',
  '.nojekyll'
];

for (const file of rootArtifacts) {
  const src = path.join(distDir, file);
  if (fs.existsSync(src)) {
    fs.copyFileSync(src, path.join(rootDir, file));
  }
}

// Copy workbox js files
const distFiles = fs.readdirSync(distDir);
for (const file of distFiles) {
  if (file.startsWith('workbox-') && file.endsWith('.js')) {
    fs.copyFileSync(path.join(distDir, file), path.join(rootDir, file));
  }
}

console.log('✓ Successfully synchronized production bundles to /docs and /root!');
