#!/usr/bin/env node

'use strict';

const express = require('express');
const app = express();

app.use(express.static('app'));

app.listen(8080, ()=>console.log('Webserver listening'));