#!/usr/bin/env node

'use strict';

// Builds what players get: app/ without its TypeScript, then app/src compiled
// to JavaScript by tsconfig.build.json, which leaves out the tests and their helpers.

const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const root = path.join(__dirname, '..');
const source = path.join(root, 'app');
const target = path.join(root, 'dist');

const isTypeScript = (file) => file.endsWith('.ts');

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true, filter: (file) => !isTypeScript(file) });
execFileSync(process.execPath, [require.resolve('typescript/bin/tsc'), '-p', path.join(root, 'tsconfig.build.json')], { stdio: 'inherit' });

console.log(`Built ${path.relative(root, target)}/`);
