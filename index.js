#!/usr/bin/env node

'use strict';

const express = require('express');
const app = express();

// dist/ is made by `pnpm build`: app/ without the tests.
app.use(express.static('dist'));

app.listen(8080, ()=>console.log('Webserver listening'));