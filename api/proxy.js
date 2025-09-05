// api/proxy.js
const fetch = global.fetch || require('node-fetch');

const DOMINIO = 'www9.redecanais.in';

module.exports = async (req, res) => {
  const path = req.url === '/' ? '' : req.url;
  const url = `https://${DOMINIO}${path}`;
  console.log('Proxy tentando acessar:', url);

  const reqHeaders = {
    'User-Agent': req.headers['user-agent'] ||
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'Referer': `https://${DOMINIO}/`,
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
    'Connection': 'keep-alive',
    'Host': DOMINIO
  };

  let response;
  try {
    response = await fetch(url, { headers: reqHeaders, redirect: 'follow' });
  } catch (err) {
    console.error('Erro no fetch:', err);
    res.statusCode = 502;
    return res.end('Erro ao buscar conteúdo do RedeCanais.');
  }

  if (!response.ok) {
    console.error(`Erro HTTP ${response.status} do RedeCanais`);
    res.statusCode = response.status;
    return res.end(`Erro HTTP ${response.status} do RedeCanais.`);
  }

  const contentType = response.headers.get('content-type') || '';
  const buffer = await response.arrayBuffer();
  const data = Buffer.from(buffer);

  if (contentType.includes('text/html')) {
    let html = data.toString('utf-8');

    // Remove headers de segurança
    const headers = { ...Object.fromEntries(response.headers.entries()) };
    delete headers['x-frame-options'];
    delete headers['content-security-policy'];

    // Reescreve links do RedeCanais para relativo
    html = html.replace(new RegExp(`https?:\/\/${DOMINIO}`, 'g'), '');
    html = html.replace(/(href|src|action)=["']\/?([^"'>]+)["']/g, (match, p1, p2) => {
      if (p2.startsWith('http') || p2.startsWith('//')) return match;
      return `${p1}="/${p2}"`;
    });

    // Título
    html = html.replace(/<title>[^<]*<\/title>/, '<title>RedeCanais Filmes</title>');

    // Banner
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

    res.writeHead(200, {
      ...headers,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/html'
    });
    return res.end(html);
  }

  // Outros tipos de arquivo
  res.writeHead(response.status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
  res.end(data);
};
