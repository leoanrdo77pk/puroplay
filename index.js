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
          // Reescreve links para manter no domínio Vercel
          data = data
            .replace(/https:\/\/futebol7k\.com\//g, '/')
            .replace(/href='\/([^']+)'/g, "href='/$1'")
            .replace(/href="\/([^"]+)"/g, 'href="/$1"')
            .replace(/action="\/([^"]+)"/g, 'action="/$1"')
            .replace(/<base[^>]*>/gi, '');

          // Remover ou alterar o título e o ícone
          data = data
            .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao vivo</title>')
            .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

          // Bloco a injetar (PopIn + Banner)
          const injection = `
<!-- Script PopIn (impressões + cliques) -->
<script>
  var crakPopInParamsIframe = {};
  crakPopInParamsIframe.url = 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial';
  crakPopInParamsIframe.decryptUrl = false;
  crakPopInParamsIframe.contentUrl = 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial';
  crakPopInParamsIframe.decryptContentUrl = false;
  crakPopInParamsIframe.contentType = 'iframe';
  crakPopInParamsIframe.width = '85%';
  crakPopInParamsIframe.height = '85%';
  crakPopInParamsIframe.timeout = false;
  crakPopInParamsIframe.delayClose = 0;
  crakPopInParamsIframe.clickStart = false;
  crakPopInParamsIframe.closeIntent = false;
  crakPopInParamsIframe.postitialBehavior = true;
  crakPopInParamsIframe.closeButtonColor = '#000';
  crakPopInParamsIframe.closeCrossColor = '#fff';
  crakPopInParamsIframe.shadow = true;
  crakPopInParamsIframe.shadowColor = '#000';
  crakPopInParamsIframe.shadowOpacity = '.5';
  crakPopInParamsIframe.shadeColor = '#111';
  crakPopInParamsIframe.shadeOpacity = '0';
  crakPopInParamsIframe.border = '1px';
  crakPopInParamsIframe.borderColor = '#000';
  crakPopInParamsIframe.borderRadius = '0px';
  crakPopInParamsIframe.leadOut = true;
  crakPopInParamsIframe.animation = 'slide';
  crakPopInParamsIframe.direction = 'up';
  crakPopInParamsIframe.verticalPosition = 'center';
  crakPopInParamsIframe.horizontalPosition = 'center';
  crakPopInParamsIframe.expireDays = 0.01;
</script>
<script src="https://crxcr1.com/popin/latest/popin-min.js"></script>

<!-- Banner fixo no rodapé -->
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

          // Injeta no final do body
          let finalHtml;
          if (/<\/body>/i.test(data)) {
            finalHtml = data.replace(/<\/body>/i, `${injection}</body>`);
          } else {
            finalHtml = `${data}${injection}`;
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
