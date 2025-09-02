const https = require('https');

const DOMINIOS = [
  'embedtv.digital',
  'embedtv-1.icu',
  'embedtv-2.icu',
  'embedtv-3.icu',
];

function fetchUrl(url, reqHeaders) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: reqHeaders }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ res, data }));
      } else {
        // Não é 200, rejeita para tentar próximo domínio
        res.resume(); // descarta dados
        reject(new Error('Status ' + res.statusCode));
      }
    }).on('error', reject);
  });
}

module.exports = async (req, res) => {
  try {
    let path = req.url === '/' ? '' : req.url;

    const reqHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Referer': `https://${DOMINIOS[0]}/`,
    };

    let fetched = null;
    let dominioUsado = null;

    // Tenta todos os domínios até achar o conteúdo
    for (const dominio of DOMINIOS) {
      try {
        const url = `https://${dominio}${path}`;
        fetched = await fetchUrl(url, reqHeaders);
        dominioUsado = dominio;
        break; // achou, sai do loop
      } catch (_) {
        // continua tentando próximo domínio
      }
    }

    if (!fetched) {
      res.statusCode = 404;
      return res.end('Conteúdo não encontrado em nenhum domínio.');
    }

    const { res: respOrig, data } = fetched;

    // Se for m3u8, reescreve os caminhos dos .ts para passarem pelo proxy
    if (/\.m3u8$/i.test(path)) {
      let playlist = data.replace(/(.*\.ts)/g, (match) => {
        if (match.startsWith('http')) {
          // troca domínio para relativo ao proxy
          return match.replace(new RegExp(`https?:\/\/${dominioUsado}\/`), '/');
        }
        return `/${match}`;
      });
      res.writeHead(200, {
        'Content-Type': 'application/vnd.apple.mpegurl',
        'Access-Control-Allow-Origin': '*'
      });
      return res.end(playlist);
    }

    // Se for arquivo estático (ts, mp4, imagens, css, js), faz proxy direto (stream)
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

    // Se for HTML, reescreve links para manter no seu domínio
    if (respOrig.headers['content-type'] && respOrig.headers['content-type'].includes('text/html')) {
      let html = data;

      // Remove headers que bloqueiam iframe, CSP, etc.
      const headers = { ...respOrig.headers };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      // Reescreve os links dos domínios para relativos
      const dominioRegex = new RegExp(`https?:\/\/(?:${DOMINIOS.join('|')})\/`, 'g');
      html = html.replace(dominioRegex, '/');

      html = html
        .replace(/src=["']https?:\/\/(?:embedtv[^\/]+)\/([^"']+)["']/g, 'src="/$1"')
        .replace(/href=["']https?:\/\/(?:embedtv[^\/]+)\/([^"']+)["']/g, 'href="/$1"')
        .replace(/action=["']https?:\/\/(?:embedtv[^\/]+)\/([^"']+)["']/g, 'action="/$1"')
        .replace(/url\(["']?https?:\/\/(?:embedtv[^\/]+)\/(.*?)["']?\)/g, 'url("/$1")')
        .replace(/<iframe([^>]*)src=["']https?:\/\/(?:embedtv[^\/]+)\/([^"']+)["']/g, '<iframe$1src="/$2"')
        .replace(/<base[^>]*>/gi, '');

      // Ajustes de links relativos
      html = html
        .replace(/href='\/([^']+)'/g, "href='/$1'")
        .replace(/href="\/([^"]+)"/g, 'href="/$1"')
        .replace(/action="\/([^"]+)"/g, 'action="/$1"');

      // Trocar título e remover ícone
      html = html
        .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao Vivo</title>')
        .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

      // Injetar banner no fim
      if (html.includes('</body>')) {
        html = html.replace('</body>', `
<div id="custom-footer">
  <a href="https://s.shopee.com.br/4VSYYPCHx2" target="_blank">
    <img src="https://i.ibb.co/XfhTxV5g/Design-sem-nome-1.png" style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" alt="Banner" />
  </a>
  <!-- Bidvertiser2101686 -->
</div>
<style>
  #custom-footer {
    position: fixed;
    bottom: 0; left: 0; width: 100%;
    background: transparent;
    text-align: center;
    z-index: 9999;
  }
  body { padding-bottom: 120px !important; }
</style>
</body>`);
      } else {
        html += `
<div id="custom-footer">
  <a href="https://s.shopee.com.br/4VSYYPCHx2" target="_blank">
    <img src="https://i.ibb.co/XfhTxV5g/Design-sem-nome-1.png" style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" alt="Banner" />
  </a>
  <!-- Bidvertiser2101686 -->
</div>
<style>
  #custom-footer {
    position: fixed;
    bottom: 0; left: 0; width: 100%;
    background: transparent;
    text-align: center;
    z-index: 9999;
  }
  body { padding-bottom: 120px !important; }
</style>`;
      }

      res.writeHead(200, {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': respOrig.headers['content-type'] || 'text/html'
      });
      return res.end(html);
    }

    // Para outros tipos, só repassa puro
    res.writeHead(respOrig.statusCode, respOrig.headers);
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno.');
  }
};
