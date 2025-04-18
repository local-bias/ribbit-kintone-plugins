// @ts-check
import { readdir, stat, access, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';

const APPS_DIR = join(process.cwd(), 'apps');

const PUBLIC_DIR = join(process.cwd(), 'public');

const TARGET_FILES = [
  '.plugin/plugin.zip',
  '.plugin/contents/desktop.js',
  '.plugin/contents/desktop.css',
  '.plugin/contents/config.css',
];

async function ensureDir(dir) {
  try {
    await mkdir(dir, { recursive: true });
  } catch (e) {}
}

async function fileExists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  const appFolders = await readdir(APPS_DIR);
  for (const appName of appFolders) {
    const appPath = join(APPS_DIR, appName);
    const statResult = await stat(appPath);
    if (!statResult.isDirectory()) {
      continue;
    }

    const pluginZipPath = join(appPath, '.plugin/plugin.zip');
    if (!(await fileExists(pluginZipPath))) {
      continue;
    }

    for (const relPath of TARGET_FILES) {
      const src = join(appPath, relPath);
      if (await fileExists(src)) {
        const dest = join(PUBLIC_DIR, appName, relPath);
        await ensureDir(dirname(dest));
        await copyFile(src, dest);
        console.log(`Copied: ${src} -> ${dest}`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
