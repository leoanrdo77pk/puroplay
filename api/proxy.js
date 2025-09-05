const https = require('https');

const DOMINIO = 'www.boraflix.com';

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
    const path = req.url === '/' ? '' : req.url;

    const reqHeaders = {
      'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
      'Referer': `https://${DOMINIO}/`,
      'Host': DOMINIO
    };

    const url = `https://${DOMINIO}${path}`;
    console.log("Proxy buscando:", url);

    let fetched;
    try {
      fetched = await fetchUrl(url, reqHeaders);
    } catch (err) {
      console.error("Erro ao buscar:", url, err.message);
      res.statusCode = 404;
      return res.end('Conteúdo não encontrado.');
    }

    const { res: respOrig, data } = fetched;

    // Proxy de HTML
    if (respOrig.headers['content-type'] && respOrig.headers['content-type'].includes('text/html')) {
      let html = data;

      // Remove headers que bloqueiam iframe, CSP, etc.
      const headers = { ...respOrig.headers };
      delete headers['x-frame-options'];
      delete headers['content-security-policy'];

      // Reescreve todos os links absolutos do Boraflix para relativos
      html = html.replace(new RegExp(`https?:\/\/${DOMINIO}`, 'g'), '');

      // Altera título do site
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

    // Proxy de arquivos estáticos (CSS, JS, imagens, vídeos)
    res.writeHead(respOrig.statusCode, respOrig.headers);
    res.end(data);

  } catch (err) {
    console.error('Erro geral proxy:', err);
    res.statusCode = 500;
    res.end('Erro interno do proxy.');
  }
};
