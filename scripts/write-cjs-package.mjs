import { mkdirSync, writeFileSync } from 'node:fs';

const cjsDir = new URL('../dist/cjs/', import.meta.url);

mkdirSync(cjsDir, { recursive: true });
writeFileSync(new URL('package.json', cjsDir), `${JSON.stringify({ type: 'commonjs' }, null, 2)}\n`);
