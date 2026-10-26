import fs from 'node:fs';
import path from 'node:path';

const outputDir = path.resolve('.output/public');
const indexPath = path.join(outputDir, 'index.html');
const shellPath = path.join(outputDir, '_shell.html');

try {
  if (!fs.existsSync(indexPath) && fs.existsSync(shellPath)) {
    fs.copyFileSync(shellPath, indexPath);
    console.log('[build-post] Copied _shell.html to index.html for SPA routing.');
  } else if (fs.existsSync(indexPath)) {
    console.log('[build-post] index.html already verified.');
  }
} catch (err) {
  console.warn('[build-post] Notice: could not copy shell fallback:', err.message);
}
