// api/proxy.js
const https = require('https');

const DOMINIOS = [
  'superflix.fun',
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
      } catch (_) { }
    }

    if (!fetched) {
      res.statusCode = 404;
      return res.end('Conteúdo não encontrado em nenhum domínio.');
    }

    const { res: respOrig, data } = fetched;

    // Proxy para mídia
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

      // Substituir URLs absolutas por rotas locais
      const dominioRegex = new RegExp(`https?:\/\/(?:${DOMINIOS.join('|')})\/`, 'g');
      html = html.replace(dominioRegex, '/');

      // NÃO altera título e NÃO mexe no favicon
      html = html
        .replace(/src=["']https?:\/\/(?:superflix\.fun[^\/]*)\/([^"']+)["']/g, 'src="/$1"')
        .replace(/href=["']https?:\/\/(?:superflix\.fun[^\/]*)\/([^"']+)["']/g, 'href="/$1"')
        .replace(/action=["']https?:\/\/(?:superflix\.fun[^\/]*)\/([^"']+)["']/g, 'action="/$1"');

      // Adblock
      try {
        html = html.replace(/<iframe[^>]+src=["']https?:\/\/.*?(ads|pop|banner).*?["'][^>]*><\/iframe>/gi, '');
        html = html.replace(/<script[^>]+src=["']https?:\/\/.*?(ads|pop|banner).*?["'][^>]*><\/script>/gi, '');
        html = html.replace(/<div[^>]+class=["'][^"']*(popup|modal|ads|banner)[^"']*["'][^>]*>.*?<\/div>/gi, '');
      } catch(e) {
        console.error("Erro ao bloquear anúncios:", e);
      }

      res.writeHead(200, {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': respOrig.headers['content-type'] || 'text/html'
      });
      return res.end(html);
    }

    res.writeHead(respOrig.statusCode, respOrig.headers);
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno.');
  }
};
