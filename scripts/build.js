#!/usr/bin/env node

// Builds what players get: app/ without its TypeScript, then the game bundled
// from app/src/game.ts into one dist/src/game.js. The tests and their helpers
// are not imported by the game, so they never get into the bundle.

import fs from 'node:fs';
import path from 'node:path';
import { build } from 'esbuild';

const root = path.join(import.meta.dirname, '..');
const source = path.join(root, 'app');
const target = path.join(root, 'dist');

const isTypeScript = (file) => file.endsWith('.ts');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true, filter: (file) => !isTypeScript(file) });
await build({
    entryPoints: [path.join(source, 'src', 'game.ts')],
    outfile: path.join(target, 'src', 'game.js'),
    bundle: true,
    format: 'esm',
    target: 'es2022',
    logLevel: 'warning',
});

console.log(`Built ${path.relative(root, target)}/`);
