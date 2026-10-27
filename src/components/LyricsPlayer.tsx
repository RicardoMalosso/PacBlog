import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { base } from '../data';
import { selectedRow, alignLyrics, formatTime, nearbyRow, parseSrt } from '../lyrics';
import type { Cue, LyricRow } from '../lyrics';

type Player = { getCurrentTime(): number; getDuration(): number; getPlayerState(): number; playVideo(): void; pauseVideo(): void; seekTo(seconds: number, allowSeekAhead: boolean): void; setVolume(value: number): void; getVolume(): number; mute(): void; unMute(): void; isMuted(): boolean; destroy(): void };
type YTNamespace = { Player: new (element: HTMLElement, options: object) => Player };
declare global { interface Window { YT?: YTNamespace; onYouTubeIframeAPIReady?: () => void } }
let apiPromise: Promise<YTNamespace> | undefined;
function youtubeApi(): Promise<YTNamespace> {
  if (window.YT?.Player) return Promise.resolve(window.YT);
  if (!apiPromise) apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const previous = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => { previous?.(); if (window.YT?.Player) resolve(window.YT); else reject(Error('YouTube API unavailable')); };
    const script = document.createElement('script'); script.src = 'https://www.youtube.com/iframe_api'; script.onerror = () => reject(Error('YouTube API unavailable')); document.head.appendChild(script);
  }).catch(error => { apiPromise = undefined; throw error; });
  return apiPromise!;
}
export type MusicPlayerConfig = { youtubeId: string; subtitles: { en: string; 'pt-br': string } };
export default function LyricsPlayer({ config }: { config: MusicPlayerConfig }) {
  const { t } = useTranslation();
  const mount = useRef<HTMLDivElement>(null); const player = useRef<Player | null>(null); const lyricsRef = useRef<HTMLDivElement>(null); const lyricsHeader = useRef<HTMLDivElement>(null); const started = useRef(false); const volumeLockUntil = useRef(0);
  const [rows, setRows] = useState<LyricRow[]>([]); const [loadError, setLoadError] = useState('');
  const [playerError, setPlayerError] = useState(false); const [ready, setReady] = useState(false);
  const [time, setTime] = useState(0); const [duration, setDuration] = useState(0); const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(100); const [muted, setMuted] = useState(false);
  const [highlight, setHighlight] = useState<{top: number; height: number} | null>(null);
  const [expanded, setExpanded] = useState(false); const [following, setFollowing] = useState(true);
  const [scrubbing, setScrubbing] = useState(false); const [scrubTime, setScrubTime] = useState(0);
  const [scriptMessage, setScriptMessage] = useState(false);

  useEffect(() => {
    const controller = new AbortController(); setRows([]); setLoadError('');
    const read = async (path: string): Promise<Cue[]> => {
      const result = await fetch(`${base}${path}`, { signal: controller.signal });
      if (!result.ok) throw Error('subtitle unavailable');
      return parseSrt(await result.text());
    };
    Promise.allSettled([read(config.subtitles['pt-br']), read(config.subtitles.en)]).then(results => {
      if (controller.signal.aborted) return;
      const pt = results[0].status === 'fulfilled' ? results[0].value : [];
      const en = results[1].status === 'fulfilled' ? results[1].value : [];
      setRows(alignLyrics(pt, en));
      if (results.some(r => r.status === 'rejected') || !pt.length || !en.length) setLoadError('lyricsLoadError');
    });
    return () => controller.abort();
  }, [config.subtitles.en, config.subtitles['pt-br']]);

  useEffect(() => {
    let cancelled = false; let instance: Player | null = null; setPlayerError(false); setReady(false);
    youtubeApi().then(YT => {
      if (cancelled || !mount.current) return;
      const node = document.createElement('div'); mount.current.replaceChildren(node);
      instance = new YT.Player(node, {
        videoId: config.youtubeId, playerVars: { playsinline: 1, origin: window.location.origin },
        events: {
          onReady: () => { if (!cancelled) setReady(true); },
          onStateChange: (event: { data: number }) => {
            if (cancelled) return;
            setPlaying(event.data === 1);
            if (event.data === 1 && !started.current) { started.current = true; lyricsHeader.current?.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' }); }
          },
          onError: () => { if (!cancelled) setPlayerError(true); },
        },
      });
      player.current = instance;
    }).catch(() => { if (!cancelled) setPlayerError(true); });
    return () => { cancelled = true; instance?.destroy(); if (player.current === instance) player.current = null; };
  }, [config.youtubeId]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      const p = player.current; if (!p || !ready) return;
      try { const current = p.getCurrentTime(); const length = p.getDuration(); if (Number.isFinite(current)) setTime(current); if (Number.isFinite(length)) setDuration(length); if (Date.now() >= volumeLockUntil.current) { const v = p.getVolume(); if (Number.isFinite(v)) setVolume(v); setMuted(p.isMuted()); } } catch { /* player is loading */ }
    }, 150);
    return () => window.clearInterval(timer);
  }, [ready]);
  const shownTime = scrubbing ? scrubTime : time;
  const current = useMemo(() => selectedRow(rows, shownTime), [rows, shownTime]);
  const center = useMemo(() => nearbyRow(rows, shownTime), [rows, shownTime]);
  const displayed = expanded ? rows.map((row, index) => ({row, index})) : rows.map((row, index) => ({row, index})).filter(({index}) => index >= center - 1 && index <= center + 1);
  const seek = (seconds: number) => { const p = player.current; if (!p || !ready) return; const next = Math.max(0, Math.min(duration || Number.MAX_SAFE_INTEGER, seconds)); p.seekTo(next, true); setTime(next); };
  const toggle = () => { const p = player.current; if (!p || !ready) return; if (p.getPlayerState() === 1) p.pauseVideo(); else p.playVideo(); };
  const seekRef = useRef(seek), toggleRef = useRef(toggle); seekRef.current = seek; toggleRef.current = toggle;
  useEffect(() => {
    const key = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey || e.repeat || target?.isContentEditable || ['INPUT','TEXTAREA','SELECT'].includes(target?.tagName || '')) return;
      const k = e.key.toLowerCase();
      if (![' ', 'arrowleft', 'arrowright', 'h', 'j', 'k', 'l'].includes(k)) return;
      e.preventDefault();
      if (k === ' ' || k === 'k') toggleRef.current();
      else { const p = player.current; if (!p) return; const delta = k === 'j' ? -10 : k === 'l' ? 10 : k === 'h' || k === 'arrowleft' ? -5 : 5; seekRef.current(p.getCurrentTime() + delta); }
    };
    window.addEventListener('keydown', key); return () => window.removeEventListener('keydown', key);
  }, []);
  useEffect(() => {
    if (!expanded || !following || current < 0) return;
    const container = lyricsRef.current; const row = container?.querySelector<HTMLElement>('[data-current="true"]');
    if (!container || !row) return;
    container.scrollTo({top: row.offsetTop - container.clientHeight / 2 + row.clientHeight / 2, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth'});
  }, [current, expanded, following]);
  useLayoutEffect(() => {
    const container = lyricsRef.current;
    if (!container) return;
    const update = () => {
      const row = container.querySelector<HTMLElement>('[data-current="true"]');
      setHighlight(row ? { top: row.offsetTop, height: row.offsetHeight } : null);
    };
    update();
    const observer = new ResizeObserver(update);
    observer.observe(container);
    for (const row of container.querySelectorAll('.sync-row')) observer.observe(row);
    return () => observer.disconnect();
  }, [current, center, expanded, rows]);
  const stopFollowing = () => { if (expanded) setFollowing(false); };
  const changeVolume = (value: number) => { const p = player.current; if (!p || !ready) return; volumeLockUntil.current = Date.now() + 1000; p.setVolume(value); if (value > 0 && p.isMuted()) p.unMute(); setVolume(value); setMuted(value === 0); };
  const toggleMute = () => { const p = player.current; if (!p || !ready) return; volumeLockUntil.current = Date.now() + 1000; if (p.isMuted() || p.getVolume() === 0) { if (p.getVolume() === 0) { p.setVolume(50); setVolume(50); } p.unMute(); setMuted(false); } else { p.mute(); setMuted(true); } };
  return <section className="music-player" aria-label={t('lyricsPlayer')}>
    <div className="music-player-header"><div><p className="eyebrow">{t('listenRead')}</p><h2>{t('lyricsPlayer')}</h2></div><div className="player-actions"><button onClick={() => {setExpanded(x => !x); setFollowing(true);}} aria-expanded={expanded}>{t(expanded ? 'compactLyrics' : 'expandLyrics')}</button></div></div>
    <div className="player-layout">
      <div className="youtube-shell"><div ref={mount} className="youtube-mount"/><noscript><a href={`https://www.youtube.com/watch?v=${config.youtubeId}`}>{t('watchOnYoutube')} ↗</a></noscript>{playerError && <p className="player-error">{t('videoError')} <a href={`https://www.youtube.com/watch?v=${config.youtubeId}`}>{t('watchOnYoutube')} ↗</a></p>}</div>
      <div className="music-controls"><div className="control-top"><button className="play-control" onClick={toggle} disabled={!ready || playerError} aria-label={t(playing ? 'pauseAudio' : 'playAudio')}>{playing ? 'Ⅱ' : '▶'}</button><div><strong>{t('videoPlayback')}</strong><p>{t('keyboardHelp')}</p></div></div><label className="sr-only" htmlFor="music-seek">{t('seek')}</label><input id="music-seek" className="music-seek" type="range" min={0} max={duration || 0} step="0.1" disabled={!ready || !duration} value={Math.min(shownTime, duration || 0)} onPointerDown={() => {setScrubTime(time);setScrubbing(true);}} onChange={e => { const value = Number(e.target.value); setScrubTime(value); if (!scrubbing) seek(value); }} onPointerUp={e => { seek(Number(e.currentTarget.value));setScrubbing(false); }} onPointerCancel={() => setScrubbing(false)}/><div className="player-times mono"><span>{formatTime(shownTime)}</span><span>{formatTime(duration)}</span></div><div className="volume-controls"><button type="button" className="volume-mute" onClick={toggleMute} disabled={!ready || playerError} aria-label={t(muted || volume === 0 ? 'unmute' : 'mute')} aria-pressed={muted || volume === 0}>{muted || volume === 0 ? '🔇' : '🔊'}</button><label htmlFor="music-volume">{t('volume')}</label><input id="music-volume" type="range" min={0} max={100} step={1} value={muted ? 0 : volume} disabled={!ready || playerError} onChange={e => changeVolume(Number(e.target.value))}/><span className="mono">{muted ? 0 : volume}%</span></div>{!ready && !playerError && <p className="player-status">{t('loadingPlayer')}</p>}</div>
    </div>
    <div ref={lyricsHeader} className="lyric-controls"><div className="lyric-column-headings"><span>{t('timestamp')}</span><span>🇨🇦 English</span><span>🇧🇷 Português</span></div>{expanded && !following && <button onClick={() => setFollowing(true)}>{t('followLine')}</button>}</div>
    {loadError && <p className="notice" role="status">{t(loadError)}</p>}
    <div ref={lyricsRef} className={`synced-lyrics ${expanded ? 'is-expanded' : 'is-compact'}`} onWheel={stopFollowing} onTouchMove={stopFollowing} onKeyDown={e => {if (['PageUp','PageDown','Home','End'].includes(e.key)) stopFollowing();}} tabIndex={expanded ? 0 : undefined} aria-label={t('lyricsPlayer')}>
      <span aria-hidden="true" className="lyric-highlight" style={highlight ? { transform: `translateY(${highlight.top}px)`, height: highlight.height, opacity: 1 } : { opacity: 0 }}/>{displayed.map(({row, index}) => <button type="button" className={`sync-row ${current === index ? 'is-current' : ''}`} data-current={current === index} key={`${row.start}-${index}`} onClick={() => {seek(row.start);setFollowing(true);}} aria-label={`${formatTime(row.start)} ${row.en?.text || ''} ${row.pt?.text || ''}`}><span className="sync-time mono">{formatTime(row.start)}</span><span className="sync-en" lang="en">{row.en?.text || ''}</span><span className="sync-pt" lang="pt-BR">{row.pt?.text || ''}</span></button>)}
      {!rows.length && !loadError && <p className="player-status">{t('loadingLyrics')}</p>}
    </div>
    <p className="player-caption">{t('keyboardHelp')} <button className="inline-button" onClick={() => setScriptMessage(x => !x)} aria-expanded={scriptMessage}>{t('keyboardDetails')}</button></p>
    {scriptMessage && <p className="player-caption">{t('keyboardExplanation')}</p>}
  </section>;
}
