#!/usr/bin/env node

/**
 * PostToolUse hook: ファイル編集ツール実行後に biome check --write を自動実行する
 *
 * 対象ツール:
 *   - replace_string_in_file
 *   - create_file
 *   - multi_replace_string_in_file
 */

const { execSync } = require('node:child_process');
const { existsSync } = require('node:fs');
const { dirname, resolve } = require('node:path');

const SUPPORTED_EXTENSIONS = /\.(ts|tsx|js|jsx|mjs|mts|cjs|cts|json|css)$/;

const FILE_WRITING_TOOLS = new Set([
  'replace_string_in_file',
  'create_file',
  'multi_replace_string_in_file',
]);

function findProjectRoot(filePath) {
  let dir = dirname(filePath);
  while (dir !== dirname(dir)) {
    if (existsSync(resolve(dir, 'biome.json')) || existsSync(resolve(dir, 'biome.jsonc'))) {
      return dir;
    }
    dir = dirname(dir);
  }
  return null;
}

function extractFilePaths(toolName, toolInput) {
  if (!FILE_WRITING_TOOLS.has(toolName)) return [];

  if (toolName === 'multi_replace_string_in_file') {
    const paths = (toolInput.replacements || []).map((r) => r.filePath).filter(Boolean);
    return [...new Set(paths)];
  }

  return toolInput.filePath ? [toolInput.filePath] : [];
}

async function main() {
  let inputData = '';
  for await (const chunk of process.stdin) {
    inputData += chunk;
  }

  let input;
  try {
    input = JSON.parse(inputData);
  } catch {
    process.exit(0);
  }

  const filePaths = extractFilePaths(input.tool_name || '', input.tool_input || {});

  const checked = new Set();

  for (const filePath of filePaths) {
    if (!SUPPORTED_EXTENSIONS.test(filePath) || checked.has(filePath)) {
      continue;
    }
    checked.add(filePath);

    const projectRoot = findProjectRoot(filePath);
    if (!projectRoot) continue;

    try {
      execSync(`pnpm biome check --write "${filePath}"`, {
        cwd: projectRoot,
        stdio: 'pipe',
      });
      process.stderr.write(`[biome] ✓ ${filePath}\n`);
    } catch (err) {
      // biome は自動修正できないエラーがある場合に非ゼロで終了する
      // エージェントの処理はブロックせず警告のみ表示する
      process.stderr.write(`[biome] ⚠ Issues found in ${filePath}\n`);
      if (err.stdout) process.stderr.write(err.stdout.toString());
      if (err.stderr) process.stderr.write(err.stderr.toString());
    }
  }

  process.exit(0);
}

main().catch(() => process.exit(0));
