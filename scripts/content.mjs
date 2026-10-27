import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';

export function loadContent(root = 'content') {
  const entries = [];
  for (const section of ['blog', 'music']) {
    for (const file of fs.readdirSync(path.join(root, section)).filter(f => f.endsWith('.md'))) {
      const { data, content } = matter(fs.readFileSync(path.join(root, section, file), 'utf8'));
      if (data.draft === true) continue;
      for (const key of ['title', 'description', 'slug', 'locale', 'date']) {
        if (typeof data[key] !== 'string' || !data[key].trim()) throw Error(`${file}: ${key} must be a quoted, nonempty string`);
      }
      if (!['pt-br', 'en'].includes(data.locale)) throw Error(`${file}: unsupported locale`);
      if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(data.slug)) throw Error(`${file}: invalid slug`);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(data.date) || Number.isNaN(Date.parse(data.date))) throw Error(`${file}: invalid date`);
      if (data.tags && (!Array.isArray(data.tags) || data.tags.some(x => typeof x !== 'string'))) throw Error(`${file}: tags must be strings`);
      if (data.player) {
        const validPath = value => typeof value === 'string' && /^lyrics\/(?:[a-z0-9-]+\/)*[a-z0-9-]+\.srt$/.test(value);
        if (section !== 'music' || !/^[a-zA-Z0-9_-]{11}$/.test(data.player.youtubeId || '') || !validPath(data.player.subtitles?.en) || !validPath(data.player.subtitles?.['pt-br'])) throw Error(`${file}: invalid player configuration`);
        for (const subtitle of Object.values(data.player.subtitles)) if (!fs.existsSync(path.join('public', subtitle))) throw Error(`${file}: missing subtitle ${subtitle}`);
      }
      if (data.lyrics && (!Array.isArray(data.lyrics) || data.lyrics.some(x => !/^\d{2}:\d{2}$/.test(x.time) || typeof x.original !== 'string' || typeof x.translation !== 'string'))) throw Error(`${file}: invalid timed lyrics`);
      if (entries.some(x => x.section === section && x.locale === data.locale && x.slug === data.slug)) throw Error(`${file}: duplicate route`);
      entries.push({ ...data, section, body: content });
    }
  }
  return entries.sort((a, b) => b.date.localeCompare(a.date));
}
if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  const entries = loadContent();
  fs.writeFileSync('src/content.generated.json', JSON.stringify(entries, null, 2) + '\n');
  console.log(`Validated ${entries.length} content entries.`);
}
