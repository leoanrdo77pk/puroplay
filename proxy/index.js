const express = require('express');
const request = require('request');
const app = express();

const TARGET = 'https://futebol7k.com/';

app.use('/futebol', (req, res) => {
  const url = TARGET + req.url;
  req.pipe(request({ url, headers: { 'Referer': TARGET } })).pipe(res);
});

module.exports = app;
