// api/proxy.js
const fetch = global.fetch || require('node-fetch');
const puppeteer = require('puppeteer');

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

async function fetchWithPuppeteer(url) {
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const page = await browser.newPage();
  await page.setExtraHTTPHeaders({
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36',
    'Referer': `https://${DOMINIO}/`
  });
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });
  const html = await page.content();
  await browser.close();
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

    // 1️⃣ Tenta fetch primeiro
    let { data, contentType, res: respOrig } = await fetchContent(url, headers);
    let html = contentType.includes('text/html') ? data.toString('utf-8') : null;

    // 2️⃣ Se HTML vazio ou não tem conteúdo principal, fallback para Puppeteer
    if (!html || !html.includes('<div') || html.length < 500) {
      console.log('Conteúdo insuficiente, usando Puppeteer...');
      html = await fetchWithPuppeteer(url);
      contentType = 'text/html';
    }

    // Remove headers de segurança
    const resHeaders = respOrig ? { ...Object.fromEntries(respOrig.headers.entries()) } : {};
    delete resHeaders['x-frame-options'];
    delete resHeaders['content-security-policy'];

    // Reescreve links
    if (html) html = rewriteLinks(html);

    // Troca título
    if (html) html = html.replace(/<title>[^<]*<\/title>/, '<title>Boraflix Filmes</title>');

    // Injeta banner
    if (html && html.includes('</body>')) {
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
      ...resHeaders,
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'text/html'
    });
    res.end(html);

  } catch (err) {
    console.error('Erro geral proxy híbrido:', err);
    res.statusCode = 500;
    res.end('Erro interno do proxy híbrido.');
  }
};
