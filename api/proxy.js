// api/proxy.js
const https = require('https');

const DOMINIOS = [
  'startflix.vip',
  // Adicione outros mirrors se necessário
];

function fetchUrl(url, reqHeaders) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: reqHeaders }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ res, data }));
      } else {
        res.resume();
        reject(new Error('Status ' + res.statusCode));
      }
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;

    const reqHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Referer': `https://${DOMINIOS[0]}/`,
    };

    let fetched = null;
    let dominioUsado = null;

    for (const dominio of DOMINIOS) {
      try {
        const url = `https://${dominio}${path}`;
        fetched = await fetchUrl(url, reqHeaders);
        dominioUsado = dominio;
        break;
      } catch (_) { /* tenta próximo domínio */ }
    }

    if (!fetched) {
      res.statusCode = 404;
      return res.end('Conteúdo não encontrado em nenhum domínio.');
    }

    const { res: respOrig, data } = fetched;

    // Proxy para arquivos de mídia
    if (/\.(ts|mp4|webm|ogg|jpg|jpeg|png|gif|css|js)$/i.test(path)) {
      https.get(`https://${dominioUsado}${path}`, { headers: reqHeaders }, (streamResp) => {
        res.writeHead(streamResp.statusCode, streamResp.headers);
        streamResp.pipe(res);
      }).on('error', (err) => {
        console.error('Erro proxy stream:', err);
        res.statusCode = 500;
        res.end('Erro no proxy de arquivo.');
      });
      return;
    }

    // HTML
    if (respOrig.headers['content-type'] && respOrig.headers['content-type'].includes('text/html')) {
      let html = data;

      const headers = { ...respOrig.headers };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      const dominioRegex = new RegExp(`https?:\/\/(?:${DOMINIOS.join('|')})\/`, 'g');
      html = html.replace(dominioRegex, '/');

      html = html
        .replace(/src=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'src="/$1"')
        .replace(/href=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'href="/$1"')
        .replace(/action=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'action="/$1"');

      html = html
        .replace(/<title>[^<]*<\/title>/, '<title>Puro Play</title>')
        .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

      // ================= SAFE ADBLOCK =================
      try {
        html = html.replace(/<iframe[^>]+src=["']https?:\/\/.*?(ads|pop).*?["'][^>]*><\/iframe>/gi, '');
        html = html.replace(/<script[^>]+src=["']https?:\/\/.*?(ads|pop).*?["'][^>]*><\/script>/gi, '');
        html = html.replace(/<div[^>]+class=["'][^"']*(popup|modal|ads)[^"']*["'][^>]*>/gi, '');
      } catch(e) {
        console.error("Erro ao bloquear popups:", e);
      }
      // =================================================

      // ================= CUSTOM HEADER =================
      if (html.includes('<body')) {
        html = html.replace('<body', `<body>
<header id="custom-header">
  <div style="
    background:#111;
    color:#fff;
    height:500px;
    display:flex;
    flex-direction:column;
    justify-content:center;
    align-items:center;
    text-align:center;
  ">
    <h1 style="font-size:64px; font-weight:bold; margin:0;">Puro Play</h1>
    <nav style="margin-top:20px;">
      <a href="/" style="color:#fff;margin:0 15px;font-size:20px;text-decoration:none;">Home</a>
      <a href="https://puroplay.vercel.app/series/" style="color:#fff;margin:0 15px;font-size:20px;text-decoration:none;">Séries</a>
      <a href="https://puroplay.vercel.app/filmes/" style="color:#fff;margin:0 15px;font-size:20px;text-decoration:none;">Filmes</a>
    </nav>
  </div>
</header>
<style>
  body { padding-top:500px !important; } /* espaço para o header gigante */
</style>
`);
      }
      // =================================================

      // Injetar banner no final
      if (html.includes('</body>')) {
        html = html.replace('</body>', `
<div id="custom-footer">
  <a href="https://s.shopee.com.br/4VSYYPCHx2" target="_blank">
    <img src="https://i.ibb.co/XfhTxV5g/Design-sem-nome-1.png"
         style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;"
         alt="Banner" />
  </a>
</div>
<style>
  #custom-footer { position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; z-index: 9999; }
  body { padding-bottom: 120px !important; }
</style>
</body>`);
      }

      res.writeHead(200, {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': respOrig.headers['content-type'] || 'text/html'
      });
      return res.end(html);
    }

    // Outros tipos
    res.writeHead(respOrig.statusCode, respOrig.headers);
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno.');
  }
};
