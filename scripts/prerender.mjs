import fs from 'node:fs';
import path from 'node:path';
import { render, routes, routeMetadata, publicPath, alternatePath, siteUrl } from '../.ssr/entry-server.js';
const template = fs.readFileSync('dist/index.html', 'utf8');
const escape = s => s.replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
const absolute = route => siteUrl + publicPath(route);
function page(route, notFound = false) {
  const meta = routeMetadata(route);
  const alternates = ['pt-br', 'en'].map(locale => ({ locale, route: route === '/' ? `/${locale}/` : alternatePath(route, locale).split('?')[0] }));
  const seo = `${notFound ? '<meta name="robots" content="noindex"/>' : `<link rel="canonical" href="${absolute(route)}"/>`}<meta property="og:type" content="website"/><meta property="og:title" content="${escape(meta.title)}"/><meta property="og:description" content="${escape(meta.description)}"/><meta property="og:url" content="${absolute(route)}"/>` + alternates.map(x => `<link rel="alternate" hreflang="${x.locale === 'en' ? 'en' : 'pt-BR'}" href="${absolute(x.route)}"/>`).join('');
  return template.replace('<body>', notFound ? '<body data-not-found>' : '<body>').replace('__LANG__', meta.locale === 'en' ? 'en' : 'pt-BR').replace('__TITLE__', escape(meta.title)).replace('__DESCRIPTION__', escape(meta.description)).replace('__SEO__', seo).replace('<!--app-html-->', () => render(route));
}
for (const route of routes) {
  const output = path.join('dist', route, 'index.html');
  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, page(route));
}
fs.writeFileSync('dist/404.html', page('/pt-br/page-not-found/', true));
fs.writeFileSync('dist/.nojekyll', '');
fs.writeFileSync('dist/sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${routes.map(route => `<url><loc>${absolute(route)}</loc></url>`).join('')}</urlset>`);
fs.writeFileSync('dist/robots.txt', `User-agent: *\nAllow: /\nSitemap: ${absolute('/sitemap.xml')}\n`);
console.log(`Prerendered ${routes.length} pages + 404, sitemap, and robots.txt.`);
