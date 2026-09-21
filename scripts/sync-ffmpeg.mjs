/**
 * Copies the ffmpeg.wasm single-thread core from node_modules into
 * public/ffmpeg/ so the media tool loads it same-origin (works offline after
 * the first use, no third-party requests). 25 MB — gitignored.
 */
import { copyFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const src = fileURLToPath(new URL('../node_modules/@ffmpeg/core/dist/umd/', import.meta.url));
const dest = fileURLToPath(new URL('../public/ffmpeg/', import.meta.url));

mkdirSync(dest, { recursive: true });
for (const file of ['ffmpeg-core.js', 'ffmpeg-core.wasm']) {
  try {
    copyFileSync(src + file, dest + file);
    console.log(`[ffmpeg] copied ${file}`);
  } catch {
    console.warn(`[ffmpeg] could not find ${file} in @ffmpeg/core — the media tool will show a setup error`);
  }
}
