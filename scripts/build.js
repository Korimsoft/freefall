#!/usr/bin/env node

// Builds what players get: app/ without its TypeScript, then app/src compiled
// to JavaScript by tsconfig.build.json, which leaves out the tests and their helpers.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.join(import.meta.dirname, '..');
const source = path.join(root, 'app');
const target = path.join(root, 'dist');
const tsc = fileURLToPath(import.meta.resolve('typescript/bin/tsc'));

const isTypeScript = (file) => file.endsWith('.ts');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true, filter: (file) => !isTypeScript(file) });
execFileSync(process.execPath, [tsc, '-p', path.join(root, 'tsconfig.build.json')], { stdio: 'inherit' });

console.log(`Built ${path.relative(root, target)}/`);
