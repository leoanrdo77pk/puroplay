// api/proxy.js
const fetch = global.fetch || require('node-fetch');

const DOMINIO = 'www.boraflix.com';

async function fetchContent(url, headers) {
  const res = await fetch(url, { headers, redirect: 'follow' });
  const contentType = res.headers.get('content-type') || '';
  const buffer = await res.arrayBuffer();
  return { data: Buffer.from(buffer), contentType, res };
}

function rewriteLinks(html) {
  // Reescreve links absolutos
  html = html.replace(new RegExp(`https?:\/\/${DOMINIO}`, 'g'), '');

  // Reescreve href, src, action
  html = html.replace(/(href|src|action)=["']\/?([^"'>]+)["']/g, (match, p1, p2) => {
    if (p2.startsWith('http') || p2.startsWith('//')) return match;
    return `${p1}="/${p2}"`;
  });

  // Reescreve URLs dentro de scripts simples
  html = html.replace(/(https?:\/\/www\.boraflix\.com\/[^\s"']+)/g, (match) => {
    const pathMatch = match.replace(`https://www.boraflix.com`, '');
    return pathMatch.startsWith('/') ? pathMatch : '/' + pathMatch;
  });

  return html;
}

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;
    const url = `https://${DOMINIO}${path}`;
    console.log('Proxy buscando:', url);

    const headers = {
      'User-Agent': req.headers['user-agent'] ||
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Referer': `https://${DOMINIO}/`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Host': DOMINIO
    };

    const { data, contentType, res: respOrig } = await fetchContent(url, headers);

    if (contentType.includes('text/html')) {
      let html = data.toString('utf-8');

      // Remove headers de segurança
      const resHeaders = { ...Object.fromEntries(respOrig.headers.entries()) };
      delete resHeaders['x-frame-options'];
      delete resHeaders['content-security-policy'];

      // Reescreve links
      html = rewriteLinks(html);

      // Troca título
      html = html.replace(/<title>[^<]*<\/title>/, '<title>Boraflix Filmes</title>');

      // Injeta banner
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
  #custom-footer { position: fixed; bottom: 0; width: 100%; text-align: center; z-index: 9999; }
  body { padding-bottom: 120px !important; }
</style>
</body>`);
      }

      return res.writeHead(200, {
        ...resHeaders,
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'text/html'
      }), res.end(html);
    }

    // Outros tipos de arquivo
    res.writeHead(respOrig.status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy otimizado:', err);
    res.statusCode = 500;
    res.end('Erro interno do proxy otimizado.');
  }
};
