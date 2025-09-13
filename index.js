const https = require('https');

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;
    const targetUrl = 'https://embedtv.digital' + path;

    https.get(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Referer': 'https://embedtv.digital/',
      }
    }, (resp) => {
      let data = '';

      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          // Remove cabeçalhos que bloqueiam exibição
          const headers = { ...resp.headers };
          delete headers['x-frame-options'];
          delete headers['content-security-policy'];

          // Reescrever todas as URLs absolutas e relativas para seu domínio
          data = data
            .replace(/https:\/\/embedtv\.digital\//g, '/')
            .replace(/src="https:\/\/embedtv\.digital\/([^"]+)"/g, 'src="/$1"')
            .replace(/src='https:\/\/embedtv\.digital\/([^']+)'/g, "src='/$1'")
            .replace(/href="https:\/\/embedtv\.digital\/([^"]+)"/g, 'href="/$1"')
            .replace(/href='https:\/\/embedtv\.digital\/([^']+)'/g, "href='/$1'")
            .replace(/action="https:\/\/embedtv\.digital\/([^"]+)"/g, 'action="/$1"')
            .replace(/url\(["']?https:\/\/embedtv\.digital\/(.*?)["']?\)/g, 'url("/$1")')
            .replace(/<iframe([^>]*)src=["']https:\/\/embedtv\.digital\/([^"']+)["']/g, '<iframe$1src="/$2"')
            .replace(/<base[^>]*>/gi, '');

          // Ajustar links relativos
          data = data
            .replace(/href='\/([^']+)'/g, "href='/$1'")
            .replace(/href="\/([^"]+)"/g, 'href="/$1"')
            .replace(/action="\/([^"]+)"/g, 'action="/$1"');

          // Alterar título e remover ícone
          data = data
            .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao Vivo</title>')
            .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

          // Injetar banner no final
          let finalHtml;
          if (data.includes('</body>')) {
            finalHtml = data.replace('</body>', `
<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank">
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
</body>`);
          } else {
            finalHtml = `
${data}
<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank">
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
</style>`;
          }

          res.writeHead(200, {
            ...headers,
            'Access-Control-Allow-Origin': '*',
            'Content-Type': resp.headers['content-type'] || 'text/html'
          });

          res.end(finalHtml);
        } catch (err) {
          console.error("Erro ao processar HTML:", err);
          res.statusCode = 500;
          res.end("Erro ao processar o conteúdo.");
        }
      });
    }).on("error", (err) => {
      console.error("Erro ao buscar conteúdo:", err);
      res.statusCode = 500;
      res.end("Erro ao carregar conteúdo.");
    });

  } catch (err) {
    console.error("Erro geral:", err);
    res.statusCode = 500;
    res.end("Erro interno.");
  }
};
