export interface Cue { start: number; end: number; text: string }
export interface LyricRow { start: number; end: number; en?: Cue; pt?: Cue }

/** Parse SRT blocks, tolerating BOM, CRLF, missing cue numbers and multiline text. */
export function parseSrt(input: string): Cue[] {
  const normalized = input.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n').trim();
  if (!normalized) return [];
  const timestamp = '(\\d{1,2}):(\\d{2}):(\\d{2})[,.](\\d{3})';
  const pattern = new RegExp(`^${timestamp}\\s*-->\\s*${timestamp}(?:\\s+.*)?$`);
  const seconds = (h: string, m: string, s: string, ms: string) => +h * 3600 + +m * 60 + +s + +ms / 1000;
  return normalized.split(/\n[\t ]*\n/).map((block, index) => {
    const lines = block.split('\n');
    const timeIndex = lines.findIndex(line => line.includes('-->'));
    const match = timeIndex >= 0 ? lines[timeIndex].trim().match(pattern) : null;
    if (!match) throw new Error(`Invalid timestamp in SRT block ${index + 1}`);
    const start = seconds(...match.slice(1, 5) as [string, string, string, string]);
    const end = seconds(...match.slice(5, 9) as [string, string, string, string]);
    const text = lines.slice(timeIndex + 1).join('\n').trim();
    if (!text || end <= start || +match[2] > 59 || +match[3] > 59 || +match[6] > 59 || +match[7] > 59) throw new Error(`Invalid SRT cue ${index + 1}`);
    return { start, end, text };
  }).sort((a, b) => a.start - b.start);
}

/** Pair each Portuguese cue with the unused English cue with greatest time overlap. */
export function alignLyrics(pt: Cue[], en: Cue[]): LyricRow[] {
  const used = new Set<number>();
  const rows: LyricRow[] = pt.map(p => {
    let best = -1, overlap = 0;
    en.forEach((e, i) => { const amount = Math.min(p.end, e.end) - Math.max(p.start, e.start); if (!used.has(i) && amount > overlap) { best = i; overlap = amount; } });
    const match = best < 0 ? undefined : en[best];
    if (match) used.add(best);
    return { start: Math.min(p.start, match?.start ?? p.start), end: Math.max(p.end, match?.end ?? p.end), pt: p, en: match };
  });
  en.forEach((e, i) => { if (!used.has(i)) rows.push({ start: e.start, end: e.end, en: e }); });
  return rows.sort((a, b) => a.start - b.start);
}
export function activeRow(rows: LyricRow[], time: number): number {
  return rows.findIndex(row => (row.pt && time >= row.pt.start && time < row.pt.end) || (row.en && time >= row.en.start && time < row.en.end));
}
/** Hold the most recent line through silence; seeking before the first line clears it. */
export function selectedRow(rows: LyricRow[], time: number): number {
  const active = activeRow(rows, time);
  if (active >= 0) return active;
  for (let i = rows.length - 1; i >= 0; i--) if (rows[i].start <= time) return i;
  return -1;
}
export function nearbyRow(rows: LyricRow[], time: number): number {
  const active = activeRow(rows, time);
  if (active >= 0) return active;
  const next = rows.findIndex(row => row.start > time);
  return next < 0 ? rows.length - 1 : Math.max(0, next - 1);
}
export function formatTime(time: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(time) ? time : 0));
  const h = Math.floor(total / 3600), m = Math.floor(total / 60) % 60, s = total % 60;
  return `${h ? `${h}:` : ''}${h ? String(m).padStart(2, '0') : String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

/** A positive adjustment delays lyrics relative to the video's playback time. */
export const lyricTime = (videoSeconds: number, offsetMs: number): number => videoSeconds - offsetMs / 1000;
export const videoTimeForLyric = (lyricSeconds: number, offsetMs: number): number => Math.max(0, lyricSeconds + offsetMs / 1000);
