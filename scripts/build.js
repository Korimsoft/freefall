#!/usr/bin/env node

'use strict';

// Builds what players get: app/ without the tests and their helpers.
// The TypeScript migration replaces the copy of src/ with a compile step.

const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const source = path.join(root, 'app');
const target = path.join(root, 'dist');

const isTestFile = (file) => /\.test\.ts$/.test(file) || path.basename(file) === 'fixtures.ts';

fs.rmSync(target, { recursive: true, force: true });
fs.cpSync(source, target, { recursive: true, filter: (file) => !isTestFile(file) });

console.log(`Built ${path.relative(root, target)}/`);
