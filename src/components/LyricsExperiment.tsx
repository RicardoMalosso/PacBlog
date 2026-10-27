import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import LyricsPlayer from './LyricsPlayer';
import { youtubeId, rankedTracks } from '../lrclib';
import type { Track } from '../lrclib';
import { formatTime } from '../lyrics';

export default function LyricsExperiment() {
  const { t } = useTranslation();
  const [query,setQuery] = useState(''); const [url,setUrl] = useState('');
  const [video,setVideo] = useState(''); const [duration,setDuration] = useState(0);
  const [tracks,setTracks] = useState<Track[]>([]); const [choice,setChoice] = useState<number|null>(null);
  const [loading,setLoading] = useState(false); const [error,setError] = useState(''); const [searched,setSearched] = useState(false);
  const controller = useRef<AbortController|null>(null);
  useEffect(() => () => controller.current?.abort(), []);
  const ordered = useMemo(()=>rankedTracks(tracks,duration),[tracks,duration]);
  const picked = choice === null ? ordered.find(x=>x.syncedLyrics) : tracks.find(x=>x.id===choice);
  const durationChanged = useCallback((value:number)=>setDuration(value),[]);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); const id = youtubeId(url);
    if (!id) { setError('invalidYoutube'); return; }
    if (!query.trim()) { setError('missingSong'); return; }
    controller.current?.abort(); const abort = new AbortController(); controller.current=abort;
    setError(''); setLoading(true); setSearched(true); setTracks([]); setChoice(null); setVideo(id); setDuration(0);
    try {
      const endpoint = new URL('https://lrclib.net/api/search'); endpoint.searchParams.set('q',query.trim());
      const res = await fetch(endpoint, {signal:abort.signal}); if (!res.ok) throw Error('request failed');
      const data: unknown = await res.json(); if (!Array.isArray(data)) throw Error('bad response');
      const valid = data.filter((x): x is Track => x && typeof x.id === 'number' && typeof x.trackName === 'string' && typeof x.artistName === 'string').slice(0,50);
      if (!abort.signal.aborted) setTracks(valid);
    } catch { if (!abort.signal.aborted) setError('lrclibError'); }
    finally { if (!abort.signal.aborted) setLoading(false); }
  }
  return <section className="lyrics-experiment" aria-labelledby="lyric-experiment-title">
    <p className="eyebrow">LRCLIB / YOUTUBE</p><h2 id="lyric-experiment-title">{t('lyricExperiment')}</h2><p>{t('lyricExperimentIntro')}</p>
    <form className="lyric-search" onSubmit={submit}>
      <label>{t('songSearch')}<input required value={query} onChange={e=>setQuery(e.target.value)} placeholder={t('songPlaceholder')}/></label>
      <label>{t('youtubeLink')}<input required type="url" value={url} onChange={e=>setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…"/></label>
      <button className="button" type="submit" disabled={loading}>{t(loading?'searchingLyrics':'findLyrics')}</button>
    </form>
    {error && <p className="notice" role="alert">{t(error)}</p>}
    {video && <>
      <div className="match-section"><h3>{t('candidateMatches')}</h3><p>{duration ? `${t('videoDuration')}: ${formatTime(duration)}. ${t('durationHint')}` : t('durationPending')}</p>
        {loading && <p className="notice" role="status">{t('searchingLyrics')}</p>}
        {!loading && searched && !error && !ordered.length && <p className="notice">{t('noLyricMatches')}</p>}
        {!loading && !!ordered.length && <div className="match-list">{ordered.map((track,index)=>{
          const delta = duration > 0 && Number.isFinite(track.duration) && track.duration > 0 ? Math.round(Math.abs(track.duration-duration)) : null;
          return <button key={track.id} className="match-option" type="button" disabled={!track.syncedLyrics} aria-pressed={picked?.id===track.id} onClick={()=>setChoice(track.id)}>
            <span className="match-number mono">{String(index+1).padStart(2,'0')}</span><span><strong>{track.trackName}</strong><small>{track.artistName}{track.albumName && track.albumName.trim().toLowerCase() !== 'null' ? ` · ${track.albumName}` : ''}</small></span><span className="match-meta">{Number.isFinite(track.duration) && track.duration > 0 ? formatTime(track.duration) : '—'}{delta !== null && <small>{t('durationDifference', {count:delta})}</small>}<small>{t(track.syncedLyrics?'syncedAvailable':'noSyncedLyrics')}</small></span>
          </button>;
        })}</div>}
        <p className="player-caption">{t('lyricsSource')} <a href="https://lrclib.net/" target="_blank" rel="noreferrer">LRCLIB ↗</a></p>
      </div>
      <LyricsPlayer key={video} config={{youtubeId:video,lrc:picked?.syncedLyrics ?? '',lyricLabel: picked?.trackName}} onDuration={durationChanged}/>
    </>}
  </section>;
}
