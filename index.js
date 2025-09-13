const https = require('https');

module.exports = async (req, res) => {
  try {
    const path = req.url === '/' ? '' : req.url;
    const targetUrl = 'https://futebol7k.com/' + path;

    https.get(targetUrl, {
      headers: {
        'User-Agent': req.headers['user-agent'] || 'Mozilla/5.0',
        'Referer': 'https://futebol7k.com/',
      }
    }, (resp) => {
      let data = '';

      resp.on('data', chunk => data += chunk);
      resp.on('end', () => {
        try {
          // Reescreve links
          data = data
            .replace(/https:\/\/futebol7k\.com\//g, '/')
            .replace(/href='\/([^']+)'/g, "href='/$1'")
            .replace(/href="\/([^"]+)"/g, 'href="/$1"')
            .replace(/action="\/([^"]+)"/g, 'action="/$1"')
            .replace(/<base[^>]*>/gi, '');

          // Ajusta título e ícone
          data = data
            .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao vivo</title>')
            .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

          // Banner fixo
          const banner = `
<div id="custom-footer">
  <a href="https://8xbet86.com/" target="_blank" rel="noopener noreferrer">
    <img src="https://i.imgur.com/Fen20UR.gif" 
         style="width:100%;max-height:100px;object-fit:contain;cursor:pointer;" 
         alt="Banner" />
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
  body { 
    padding-bottom: 120px !important; 
  }
</style>
`;

          let finalHtml;

          // Se tiver </body>, injeta antes dela
          if (/<\/body>/i.test(data)) {
            finalHtml = data.replace(/<\/body>/i, `${banner}</body>`);
          } 
          // Se não tiver </body>, força o banner no fim
          else {
            finalHtml = `${data}${banner}</body></html>`;
          }

          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Content-Type', resp.headers['content-type'] || 'text/html; charset=utf-8');
          res.statusCode = 200;
          res.end(finalHtml);

        } catch (err) {
          console.error("Erro ao processar o HTML:", err);
          res.statusCode = 500;
          res.end("Erro ao processar o conteúdo.");
        }
      });
    }).on("error", (err) => {
      console.error("Erro ao fazer requisição HTTPS:", err);
      res.statusCode = 500;
      res.end("Erro ao carregar conteúdo.");
    });

  } catch (err) {
    console.error("Erro geral:", err);
    res.statusCode = 500;
    res.end("Erro interno.");
  }
};
