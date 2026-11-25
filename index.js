#!/usr/bin/env node

'use strict';

const express = require('express');
const app = express();

// The tests sit next to the game code in app/, but players must not get them.
app.use((req, res, next) => /\.test\.ts$|\/fixtures\.ts$/.test(req.path) ? res.sendStatus(404) : next());

app.use(express.static('app'));

app.listen(8080, ()=>console.log('Webserver listening'));