const https = require('https');

const DOMINIOS = [
  'embedtv.best',
  'embedtv-5.icu',
  'embedtv-6.icu',
  'embedtv-7.icu',
];

function fetchUrl(url, reqHeaders) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: reqHeaders }, (res) => {
      if (res.statusCode === 200) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ res, data }));
      } else {
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
        break;
      } catch (_) {}
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

    // Proxy para arquivos estáticos
    if (/\.(ts|mp4|webm|ogg|jpg|jpeg|png|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/i.test(path)) {
      const fileUrl = `https://${dominioUsado}${path.startsWith('/') ? path : '/' + path}`;
      https.get(fileUrl, { headers: reqHeaders }, (streamResp) => {
        res.writeHead(streamResp.statusCode, streamResp.headers);
        streamResp.pipe(res);
      }).on('error', (err) => {
        console.error('Erro proxy estático:', err);
        res.statusCode = 500;
        res.end('Erro ao carregar assets.');
      });
      return;
    }

    // Se for HTML, reescreve links e remove cabeçalho
    if (respOrig.headers['content-type'] && respOrig.headers['content-type'].includes('text/html')) {
      let html = data;

      // Remove headers que bloqueiam iframe e CSP
      const headers = { ...respOrig.headers };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      // Reescreve links para manter no seu domínio
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

      // 🔹 REMOVE cabeçalhos visuais do site original
      html = html
        .replace(/<header[\s\S]*?<\/header>/gi, '') // remove <header>...</header>
        .replace(/<div[^>]*id=["']header["'][^>]*>[\s\S]*?<\/div>/gi, '') // remove <div id="header">
        .replace(/<nav[\s\S]*?<\/nav>/gi, ''); // remove menus de navegação

      // 🔹 Trocar título e remover ícone
      html = html
        .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao Vivo</title>')
        .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

      // 🔹 Injetar meta tag de verificação no <head>
      html = html.replace(
        /<head>/i,
        `<head>\n<meta name="ppck-ver" content="82de547bce4b26acfb7d424fc45ca87d" />`
      );

      // 🔹 Injetar banner no fim
      if (html.includes('</body>')) {
        html = html.replace('</body>', `
<div id="custom-footer">

<script type="text/javascript">
   var uid = '455197';
   var wid = '743023';
   var pop_tag = document.createElement('script');pop_tag.src='//cdn.popcash.net/show.js';document.body.appendChild(pop_tag);
   pop_tag.onerror = function() {pop_tag = document.createElement('script');pop_tag.src='//cdn2.popcash.net/show.js';document.body.appendChild(pop_tag)};
</script>
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
      }

      res.writeHead(200, {
        ...headers,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': respOrig.headers['content-type'] || 'text/html'
      });
      return res.end(html);
    }

    // Outros tipos: envia direto
    res.writeHead(respOrig.statusCode, respOrig.headers);
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno.');
  }
};
