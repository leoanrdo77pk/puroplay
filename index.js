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

          // Remove título e ícone original
          data = data
            .replace(/<title>[^<]*<\/title>/, '<title>Futebol ao vivo</title>')
            .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

          // Banner fixo (sempre visível)
          const bannerHtml = `
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

          // PopIn (carregado dinamicamente após DOM)
          const popinScript = `
<script>
document.addEventListener("DOMContentLoaded", function() {
  var crakPopInParamsIframe = {
    url: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptUrl: false,
    contentUrl: 'https://t.mbsrv2.com/273605/10163/optimized?aff_sub5=SF_006OG000004lmDN&aff_sub4=AT_0016&aff_id=1&transaction_id=postitial',
    decryptContentUrl: false,
    contentType: 'iframe',
    width: '85%',
    height: '85%',
    timeout: false,
    delayClose: 0,
    clickStart: false,
    closeIntent: false,
    postitialBehavior: true,
    closeButtonColor: '#000',
    closeCrossColor: '#fff',
    shadow: true,
    shadowColor: '#000',
    shadowOpacity: '.5',
    shadeColor: '#111',
    shadeOpacity: '0',
    border: '1px',
    borderColor: '#000',
    borderRadius: '0px',
    leadOut: true,
    animation: 'slide',
    direction: 'up',
    verticalPosition: 'center',
    horizontalPosition: 'center',
    expireDays: 0.01
  };

  var script = document.createElement('script');
  script.src = "https://crxcr1.com/popin/latest/popin-min.js";
  document.body.appendChild(script);
});
</script>
`;

          // Injeta banner logo após <body>
          let finalHtml;
          if (/<body[^>]*>/i.test(data)) {
            finalHtml = data.replace(/<body[^>]*>/i, `$&${bannerHtml}${popinScript}`);
          } else {
            finalHtml = `${bannerHtml}${popinScript}${data}`;
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
