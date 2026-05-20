import { execFileSync } from 'node:child_process';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const rootDir = new URL('..', import.meta.url).pathname;
const tempDir = mkdtempSync(join(tmpdir(), 'dominant-color-pack-'));
const cacheDir = join(tempDir, 'npm-cache');
const packageDir = join(tempDir, 'package-consumer');

function run(command, args, options = {}) {
  execFileSync(command, args, {
    cwd: rootDir,
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
    },
    stdio: 'inherit',
    ...options,
  });
}

function runWithOutput(command, args, options = {}) {
  return execFileSync(command, args, {
    cwd: rootDir,
    encoding: 'utf8',
    env: {
      ...process.env,
      npm_config_cache: cacheDir,
    },
    ...options,
  });
}

try {
  const packOutput = runWithOutput('npm', ['pack', '--json', '--pack-destination', tempDir]);
  const [{ filename }] = JSON.parse(packOutput);
  const tarballPath = join(tempDir, filename);

  run('npm', ['init', '-y'], { cwd: tempDir });
  run('npm', ['install', '--ignore-scripts', '--no-audit', '--no-fund', tarballPath], { cwd: tempDir });

  writeFileSync(
    join(tempDir, 'runtime-smoke.mjs'),
    [
      "import { getDominantColor, getDominantColorAsync } from '@rtcoder/dominant-color';",
      "if (typeof getDominantColor !== 'function') throw new Error('getDominantColor is not exported');",
      "if (typeof getDominantColorAsync !== 'function') throw new Error('getDominantColorAsync is not exported');",
      "console.log('runtime import smoke passed');",
      '',
    ].join('\n'),
  );
  run('node', [join(tempDir, 'runtime-smoke.mjs')], { cwd: tempDir });

  writeFileSync(
    join(tempDir, 'type-smoke.ts'),
    [
      "import { getDominantColorAsync } from '@rtcoder/dominant-color';",
      "import type { DominantColorOptions, DominantColorResult } from '@rtcoder/dominant-color';",
      '',
      "const options: Partial<DominantColorOptions> = {",
      "  colorFormat: 'hex',",
      "  colorQuantization: 'bucket',",
      '};',
      '',
      "async function run(img: HTMLImageElement): Promise<DominantColorResult> {",
      '  return getDominantColorAsync(img, options);',
      '}',
      '',
      'void run;',
      '',
    ].join('\n'),
  );
  writeFileSync(
    join(tempDir, 'tsconfig.json'),
    JSON.stringify(
      {
        compilerOptions: {
          lib: ['dom', 'es2020'],
          module: 'esnext',
          moduleResolution: 'node',
          noEmit: true,
          strict: true,
          target: 'es2020',
        },
        include: ['type-smoke.ts'],
      },
      null,
      2,
    ),
  );

  run('node', [join(rootDir, 'node_modules/typescript/bin/tsc'), '-p', join(tempDir, 'tsconfig.json')], { cwd: tempDir });
  console.log('pack smoke test passed');
} finally {
  rmSync(tempDir, { force: true, recursive: true });
}
