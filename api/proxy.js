// api/proxy.js
const fetch = global.fetch || require('node-fetch');

const DOMINIO = 'www.boraflix.com';

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;
    const url = `https://${DOMINIO}${path}`;
    console.log('Proxy buscando:', url);

    const reqHeaders = {
      'User-Agent': req.headers['user-agent'] || 
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
      'Referer': `https://${DOMINIO}/`,
      'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
      'Accept-Language': 'pt-BR,pt;q=0.9,en-US;q=0.8,en;q=0.7',
      'Connection': 'keep-alive',
      'Host': DOMINIO
    };

    // Busca a URL no Boraflix e segue redirecionamentos
    const response = await fetch(url, { headers: reqHeaders, redirect: 'follow' });
    const contentType = response.headers.get('content-type') || '';

    const buffer = await response.arrayBuffer();
    const data = Buffer.from(buffer);

    // HTML
    if (contentType.includes('text/html')) {
      let html = data.toString('utf-8');

      // Remove headers de segurança do Boraflix (CSP, X-Frame-Options)
      const headers = { ...Object.fromEntries(response.headers.entries()) };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      // Reescreve todos os links absolutos do Boraflix para relativos
      html = html.replace(new RegExp(`https?:\/\/${DOMINIO}`, 'g'), '');

      // Troca título
      html = html.replace(/<title>[^<]*<\/title>/, '<title>Boraflix Filmes</title>');

      // Injeta banner no final
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

    // Outros tipos de arquivo (CSS, JS, imagens, vídeos)
    res.writeHead(response.status, { 'Content-Type': contentType, 'Access-Control-Allow-Origin': '*' });
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno do proxy.');
  }
};
