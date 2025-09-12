const https = require('https');
const http = require('http');
const zlib = require('zlib');
const { URL } = require('url');

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;
    const targetBase = 'https://futebol7k.com';
    const targetUrl = targetBase + path;

    // Função que busca a URL, segue redirects e descomprime conteúdo se necessário
    const fetchUrl = (url, redirects = 0) => new Promise((resolve, reject) => {
      if (redirects > 6) return reject(new Error('Too many redirects'));
      let parsed;
      try { parsed = new URL(url); } catch (e) { return reject(e); }
      const lib = parsed.protocol === 'https:' ? https : http;

      const reqOptions = {
        headers: {
          'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
          'Referer': targetBase + '/'
        },
        timeout: 15000
      };

      const r = lib.get(parsed, reqOptions, (resp) => {
        // Segue redirects simples (301/302/307/308)
        if (resp.statusCode >= 300 && resp.statusCode < 400 && resp.headers.location) {
          const loc = resp.headers.location.startsWith('http') ? resp.headers.location : `${parsed.protocol}//${parsed.host}${resp.headers.location}`;
          resp.resume();
          return resolve(fetchUrl(loc, redirects + 1));
        }

        const chunks = [];
        resp.on('data', (c) => chunks.push(c));
        resp.on('end', () => {
          const buffer = Buffer.concat(chunks);
          const enc = (resp.headers['content-encoding'] || '').toLowerCase();

          if (enc.includes('br')) {
            zlib.brotliDecompress(buffer, (err, out) => {
              if (err) return reject(err);
              resolve({ statusCode: resp.statusCode, headers: resp.headers, body: out.toString('utf8') });
            });
          } else if (enc.includes('gzip')) {
            zlib.gunzip(buffer, (err, out) => {
              if (err) return reject(err);
              resolve({ statusCode: resp.statusCode, headers: resp.headers, body: out.toString('utf8') });
            });
          } else if (enc.includes('deflate')) {
            zlib.inflate(buffer, (err, out) => {
              if (err) return reject(err);
              resolve({ statusCode: resp.statusCode, headers: resp.headers, body: out.toString('utf8') });
            });
          } else {
            resolve({ statusCode: resp.statusCode, headers: resp.headers, body: buffer.toString('utf8') });
          }
        });
      });

      r.on('error', reject);
      r.on('timeout', () => { r.destroy(new Error('Timeout fetching target')); });
    });

    const { statusCode, headers, body } = await fetchUrl(targetUrl);

    // Manipula o HTML retornado (substituições que você já usava)
    let data = body || '';

    data = data
      .replace(/https?:\/\/futebol7k\.com\//g, '/')
      .replace(/href='\/([^']+)'/g, "href='/$1'")
      .replace(/href="\/([^"]+)"/g, 'href="/$1"')
      .replace(/action="\/([^"]+)"/g, 'action="/$1"')
      .replace(/<base[^>]*>/gi, '')
      .replace(/<title>[^<]*<\/title>/i, '<title>Futebol ao vivo</title>')
      .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://i.imgur.com/Fen20UR.gif" style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" alt="Banner" />
  </a>
</div>

<style>
  #custom-footer {
    position: fixed;
    bottom: 0;
    left: 0;
    width: 100%;
    background: transparent;
    text-align: center;
    z-index: 9999;
  }
  body { padding-bottom: 120px !important; }
</style>
`;

    // Insere a injeção antes do </body> (case-insensitive). Se não existir, anexa ao final.
    let finalHtml;
    if (/<\/body>/i.test(data)) {
      finalHtml = data.replace(/<\/body>/i, `${injection}</body>`);
    } else {
      finalHtml = `${data}${injection}`;
    }

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Content-Type', headers['content-type'] || 'text/html; charset=utf-8');
    res.statusCode = statusCode || 200;
    res.end(finalHtml);
  } catch (err) {
    console.error('Erro ao processar proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno.');
  }
};
