// Dentro do bloco de HTML, antes de enviar para o cliente
if (respOrig.headers['content-type'] && respOrig.headers['content-type'].includes('text/html')) {
  let html = data;

  const headers = { ...respOrig.headers };
  delete headers['x-frame-options'];
  delete headers['content-security-policy'];

  // Reescreve links
  const dominioRegex = new RegExp(`https?:\/\/(?:${DOMINIOS.join('|')})\/`, 'g');
  html = html.replace(dominioRegex, '/');

  html = html
    .replace(/src=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'src="/$1"')
    .replace(/href=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'href="/$1"')
    .replace(/action=["']https?:\/\/(?:startflix[^\/]+)\/([^"']+)["']/g, 'action="/$1"');

  html = html
    .replace(/<title>[^<]*<\/title>/, '<title>StartFlix Filmes</title>')
    .replace(/<link[^>]*rel=["']icon["'][^>]*>/gi, '');

  // === BLOQUEIO DE POPUPS ===
  // Remove iframes de domínios suspeitos de ads/popups
  html = html.replace(/<iframe[^>]+src=["']https?:\/\/.*?ads.*?["'][^>]*><\/iframe>/gi, '');
  // Remove scripts de domínios de ads conhecidos
  html = html.replace(/<script[^>]+src=["']https?:\/\/.*?ads.*?["'][^>]*><\/script>/gi, '');
  // Remove divs com id ou classe comum de popup
  html = html.replace(/<div[^>]+class=["'].*?(popup|modal|ads).*?["'][^>]*>.*?<\/div>/gi, '');

  // Injetar banner (mantém seu banner)
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
  #custom-footer { position: fixed; bottom: 0; left: 0; width: 100%; text-align: center; z-index: 9999; }
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
