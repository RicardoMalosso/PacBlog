import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { loadContent } from '../scripts/content.mjs';
import { routes, base, alternatePath } from '../.ssr/entry-server.js';
const outputFor = route => path.join('dist', route, 'index.html');
test('all declared routes contain prerendered HTML and locale metadata', () => {
  for (const route of routes) {
    const html = fs.readFileSync(outputFor(route), 'utf8');
    assert(!html.includes('<!--app-html-->'), route);
    assert(!/__LANG__|__TITLE__|__DESCRIPTION__|__SEO__/.test(html), route);
    assert(html.includes('<h1'), route);
    if (route !== '/') assert(html.includes(`lang="${route.startsWith('/en/') ? 'en' : 'pt-BR'}"`), route);
    assert(html.includes('rel="canonical"'), route);
  }
});
test('all local links and assets resolve under the configured GitHub Pages base', () => {
  for (const route of routes) {
    const html = fs.readFileSync(outputFor(route), 'utf8');
    for (const [, url] of html.matchAll(/(?:href|src)="([^"]+)"/g)) {
      if (!url.startsWith('/')) continue;
      assert(url.startsWith(base), `${route}: outside base ${url}`);
      const pathname = decodeURIComponent(url.split(/[?#]/)[0].slice(base.length));
      const file = path.join('dist', pathname);
      assert(fs.existsSync(file) || fs.existsSync(path.join(file, 'index.html')), `${route}: broken ${url}`);
    }
  }
});
test('each published entry is rendered in both languages and translations retain the article', () => {
  const entries = loadContent();
  for (const entry of entries) {
    const other = entry.locale === 'en' ? 'pt-br' : 'en';
    const route = `/${entry.locale}/${entry.section}/${entry.slug}/`;
    assert.equal(alternatePath(route, other), `/${other}/${entry.section}/${entry.slug}/`);
    assert(fs.existsSync(outputFor(alternatePath(route, other))));
    assert(fs.readFileSync(outputFor(route), 'utf8').includes(entry.title));
  }
  assert.equal(alternatePath('/en/blog/untranslated/', 'pt-br'), '/pt-br/blog/?translation=missing');
});
test('content validation rejects duplicate slugs', () => {
  const temp = fs.mkdtempSync('/tmp/pacblog-content-');
  try {
    fs.mkdirSync(path.join(temp, 'blog')); fs.mkdirSync(path.join(temp, 'music'));
    const data = fs.readFileSync('content/blog/welcome.en.md');
    fs.writeFileSync(path.join(temp, 'blog/a.md'), data); fs.writeFileSync(path.join(temp, 'blog/b.md'), data);
    assert.throws(() => loadContent(temp), /duplicate route/);
  } finally { fs.rmSync(temp, { recursive: true }); }
});
test('interface strings are translated, with a Canadian flag for English', () => {
  const pt = fs.readFileSync('dist/pt-br/index.html', 'utf8');
  const en = fs.readFileSync('dist/en/index.html', 'utf8');
  assert(pt.includes('Projetos selecionados'));
  assert(en.includes('Selected projects'));
  assert(pt.includes('🇨🇦 EN'));
  assert(en.includes('🇧🇷 PT-BR'));
  assert(!pt.includes('🇺🇸')); assert(!en.includes('🇺🇸'));
});
test('static 404, sitemap and publishing artifacts exist', () => {
  assert(fs.readFileSync('dist/404.html', 'utf8').includes('noindex'));
  assert(fs.readFileSync('dist/sitemap.xml', 'utf8').includes(`${base}en/blog/welcome/`));
  assert(fs.existsSync('dist/.nojekyll'));
  assert(fs.readFileSync('dist/pt-br/music/lyric-page-demo/index.html', 'utf8').includes('Uma janela'));
});

test('shared interface copy stays localized across every published page', () => {
  const leakedEnglish = /Skip to content|Selected projects|DATA \/ VISUALIZATION|PYTHON \/ AI \/ AUDIO|Data visualization|Caching|Speech controls|Hear this project description/;
  const leakedPortuguese = /Pular para o conteúdo|Projetos selecionados|DADOS \/ VISUALIZAÇÃO|PYTHON \/ IA \/ ÁUDIO|Visualização de dados|Controles de fala|Ouça a descrição deste projeto/;
  for (const route of routes.filter(route => /^\/(en|pt-br)\//.test(route))) {
    const html = fs.readFileSync(outputFor(route), 'utf8');
    const english = route.startsWith('/en/');
    assert(!((english ? leakedPortuguese : leakedEnglish).test(html)), `Mixed interface language at ${route}`);
    assert(html.includes(`aria-label="Ricardo Malosso — ${english ? 'Portfolio' : 'Portfólio'}"`), route);
  }
  assert(fs.readFileSync(outputFor('/pt-br/experiments/'), 'utf8').includes('6,34'));
  assert(fs.readFileSync(outputFor('/en/experiments/'), 'utf8').includes('6.34'));
});

test('résumé routes include localized content and both downloadable PDFs', () => {
  for (const [locale, title, summary] of [['en', 'Résumé', 'Professional Summary'], ['pt-br', 'Currículo', 'Resumo profissional']]) {
    const route = `/${locale}/resume/`;
    assert(routes.includes(route));
    const html = fs.readFileSync(outputFor(route), 'utf8');
    assert(html.includes(`${title} · Ricardo Malosso`));
    assert(html.includes(summary));
    assert(html.includes('Wipro'));
    assert(html.includes('CGI Group'));
    assert(html.includes('PacTTSClone'));
    assert.equal(alternatePath(route, locale === 'en' ? 'pt-br' : 'en'), `/${locale === 'en' ? 'pt-br' : 'en'}/resume/`);
    for (const file of ['Ricardo_Malosso_Resume_EN.pdf', 'Ricardo_Malosso_CV.pdf']) {
      assert(html.includes(`${base}resumes/${file}`));
      const pdf = fs.readFileSync(`dist/resumes/${file}`);
      assert.equal(pdf.subarray(0, 5).toString(), '%PDF-');
      assert(pdf.equals(fs.readFileSync(`public/resumes/${file}`)));
    }
  }
});

test('SRT parsing, bilingual alignment and playback gaps', async () => {
  const { parseSrt, alignLyrics, activeRow, nearbyRow, formatTime } = await import('../.ssr/entry-server.js');
  const pt = parseSrt('\uFEFF1\r\n00:00:01,000 --> 00:00:03,000\r\nPrimeira linha\r\nsegunda linha\r\n\r\n2\r\n00:00:05,000 --> 00:00:06,000\r\nOutra');
  const en = parseSrt('1\n00:00:01.200 --> 00:00:02.800\nFirst line\n\n2\n00:00:07,000 --> 00:00:08,000\nUnmatched');
  assert.equal(pt[0].text, 'Primeira linha\nsegunda linha');
  const rows = alignLyrics(pt, en);
  assert.equal(rows.length, 3); assert.equal(rows[0].en.text, 'First line');
  assert.equal(rows[1].en, undefined); assert.equal(rows[2].pt, undefined);
  assert.equal(activeRow(rows, 1.5), 0); assert.equal(activeRow(rows, 4), -1);
  assert.equal(activeRow(rows, 5.5), 1); assert.equal(activeRow(rows, 7.5), 2);
  assert.equal(nearbyRow(rows, 4), 0); assert.equal(nearbyRow(rows, 20), 2);
  assert.equal(formatTime(3661), '1:01:01');
  assert.throws(() => parseSrt('1\n00:00:03,000 --> 00:00:01,000\nbroken'), /Invalid SRT cue/);
});

test('music demo config links published subtitle files and localized post', () => {
  const entries = loadContent().filter(x => x.slug === 'lyric-page-demo');
  assert.equal(entries.length, 2);
  for (const entry of entries) {
    assert.equal(entry.player.youtubeId, 'M7lc1UVf-VE');
    for (const file of Object.values(entry.player.subtitles)) assert(fs.existsSync(path.join('dist', file)));
    const html = fs.readFileSync(outputFor(`/${entry.locale}/music/${entry.slug}/`), 'utf8');
    assert(html.includes(entry.locale === 'en' ? 'Show full lyrics' : 'Mostrar letra completa'));
  }
});
