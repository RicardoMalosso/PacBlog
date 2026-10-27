import type { Cue } from './lyrics';
export type Track = { id: number; trackName: string; artistName: string; albumName: string; duration: number; instrumental: boolean; syncedLyrics: string | null; plainLyrics: string | null };
export function youtubeId(input: string): string | null {
  try {
    const url = new URL(input.trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, '').replace(/^m\./, '');
    let id: string | null = null;
    if (host === 'youtu.be') id = url.pathname.split('/')[1];
    else if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
      const parts = url.pathname.split('/');
      id = parts[1] === 'watch' ? url.searchParams.get('v') : ['embed','shorts','live'].includes(parts[1]) ? parts[2] : null;
    }
    return id && /^[a-zA-Z0-9_-]{11}$/.test(id) ? id : null;
  } catch { return null; }
}
export function parseLrc(input: string): Cue[] {
  const raw: {start:number;text:string}[] = [];
  for (const line of input.replace(/\r\n?/g,'\n').split('\n')) {
    const matches = [...line.matchAll(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g)];
    const text = line.replace(/\[(\d{1,3}):(\d{2})(?:[.:](\d{1,3}))?\]/g, '').trim();
    if (!text) continue;
    for (const m of matches) if (+m[2] < 60) raw.push({start: +m[1]*60 + +m[2] + Number('0.' + (m[3] || '0')), text});
  }
  raw.sort((a,b) => a.start-b.start);
  return raw.map((line,i) => ({...line,end: raw[i+1]?.start > line.start ? raw[i+1].start : line.start + 0.001}));
}
export function rankedTracks(tracks: Track[], duration: number): Track[] {
  return tracks.map((track,index)=>({track,index})).sort((a,b)=> {
    const availableA = !!a.track.syncedLyrics, availableB = !!b.track.syncedLyrics;
    if (availableA !== availableB) return availableA ? -1 : 1;
    if (duration > 0) {
      const deltaA = Number.isFinite(a.track.duration) && a.track.duration > 0 ? Math.abs(a.track.duration-duration) : Infinity;
      const deltaB = Number.isFinite(b.track.duration) && b.track.duration > 0 ? Math.abs(b.track.duration-duration) : Infinity;
      if (deltaA !== deltaB) return deltaA-deltaB;
    }
    return a.index-b.index;
  }).map(x=>x.track);
}
