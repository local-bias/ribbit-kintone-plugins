// @ts-check
import { readdir, stat, access, mkdir, copyFile } from 'fs/promises';
import { join, dirname } from 'path';

const APPS_DIR = join(process.cwd(), 'apps');

const PUBLIC_DIR = join(process.cwd(), 'public');

/** @type { { src: string; dst: string | ((params: { appName: string }) => string) }[] } */
const TARGET_FILES = [
  {
    src: '.plugin/plugin.zip',
    dst: ({ appName }) => `kintone-plugin-${appName}.zip`,
  },
  {
    src: '.plugin/contents/desktop.js',
    dst: `desktop.js`,
  },
  {
    src: '.plugin/contents/desktop.css',
    dst: `desktop.css`,
  },
  {
    src: '.plugin/contents/config.js',
    dst: `config.js`,
  },
  {
    src: '.plugin/contents/config.css',
    dst: `config.css`,
  },
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

    for (const { src, dst } of TARGET_FILES) {
      const srcPath = join(appPath, src);
      if (await fileExists(srcPath)) {
        const dest = join(PUBLIC_DIR, appName, typeof dst === 'function' ? dst({ appName }) : dst);
        await ensureDir(dirname(dest));
        await copyFile(srcPath, dest);
      }
    }
    console.log(`🚚 Plugin files have been copied: ${appName}`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
