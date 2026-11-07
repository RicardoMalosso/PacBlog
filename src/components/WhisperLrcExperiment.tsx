import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { youtubeId } from '../lrclib';
import './WhisperLrcExperiment.css';

type Line = { id: number; time: string; text: string };
type SpeechResult = { text?: string; chunks?: { text: string; timestamp: [number | null, number | null] }[] };
type SpeechPipeline = (audio: Float32Array, options: Record<string, unknown>) => Promise<SpeechResult>;
type ProgressEvent = { status?: string; progress?: number };
const modelCache = new Map<string, Promise<SpeechPipeline>>();
const MAX_DURATION = 20 * 60;

const labels = {
  en: {
    heading: 'AI LRC generator',
    intro: 'Transcribe a recording with Whisper and turn its timed phrases into an editable .lrc file. Processing happens on your device.',
    youtube: 'YouTube video (optional)',
    youtubeHelp: 'The video is for reference. Browsers cannot extract its audio directly from a YouTube embed. Supply an audio file of the same recording below.',
    invalidYoutube: 'That is not a valid YouTube video URL.',
    file: 'audio recording',
    fileHelp: 'MP3, WAV, M4A and other formats supported by your browser. Maximum 20 minutes. The audio is never uploaded.',
    title: 'song title', artist: 'artist', language: 'language', model: 'Whisper model',
    auto: 'automatic', portuguese: 'portuguese', english: 'english', spanish: 'spanish',
    tiny: 'tiny · faster', base: 'base · more accurate',
    generate: 'generate LRC', working: 'generating…',
    noFile: 'Select an audio file to begin.',
    decoding: 'decoding audio…', downloading: 'loading AI model…', transcribing: 'transcribing audio (this may take a while)…',
    done: 'Generated lyrics. Check every line and correct the timing before publishing.',
    failed: 'Could not generate lyrics. Check the audio format and model download, then retry.',
    tooLong: 'Please use a recording shorter than 20 minutes.',
    noSpeech: 'Whisper did not return timed phrases for this recording.',
    result: 'timed lyrics', preview: 'preview the matching audio',
    lineTime: 'time (mm:ss.xx)', lineText: 'lyrics', play: 'play from here', remove: 'remove line',
    add: 'add line', earlier: 'all −0.1s', later: 'all +0.1s',
    download: 'download .lrc', copy: 'copy LRC', copied: 'copied',
    invalidTime: 'Fix invalid timestamps before exporting (mm:ss.xx).',
    modelNote: 'The first run downloads an AI model from Hugging Face. Whisper can make mistakes with singing and instrumental sections. Vocal separation is not included.',
    youtubeTitle: 'YouTube reference video',
  },
  pt: {
    heading: 'gerador de LRC com IA',
    intro: 'Transcreva uma gravação com o Whisper e transforme as frases sincronizadas em um arquivo .lrc editável. O processamento acontece no seu dispositivo.',
    youtube: 'vídeo do YouTube (opcional)',
    youtubeHelp: 'O vídeo é uma referência. O navegador não consegue extrair o áudio diretamente do player do YouTube. Selecione abaixo o arquivo de áudio da mesma gravação.',
    invalidYoutube: 'Esse não é um link válido de vídeo do YouTube.',
    file: 'arquivo de áudio',
    fileHelp: 'MP3, WAV, M4A e outros formatos compatíveis com o navegador. Máximo de 20 minutos. O áudio não é enviado a um servidor.',
    title: 'título da música', artist: 'artista', language: 'idioma', model: 'modelo Whisper',
    auto: 'automático', portuguese: 'português', english: 'inglês', spanish: 'espanhol',
    tiny: 'tiny · mais rápido', base: 'base · mais preciso',
    generate: 'gerar LRC', working: 'gerando…',
    noFile: 'Selecione um arquivo de áudio para começar.',
    decoding: 'decodificando áudio…', downloading: 'carregando modelo de IA…', transcribing: 'transcrevendo áudio (pode demorar)…',
    done: 'Letra gerada. Revise as palavras e a sincronização antes de publicar.',
    failed: 'Não foi possível gerar a letra. Confira o formato do áudio e o download do modelo e tente novamente.',
    tooLong: 'Use uma gravação com menos de 20 minutos.',
    noSpeech: 'O Whisper não retornou frases com marcação de tempo para essa gravação.',
    result: 'letra sincronizada', preview: 'ouvir o áudio correspondente',
    lineTime: 'tempo (mm:ss.xx)', lineText: 'letra', play: 'tocar a partir daqui', remove: 'remover linha',
    add: 'adicionar linha', earlier: 'tudo −0,1s', later: 'tudo +0,1s',
    download: 'baixar .lrc', copy: 'copiar LRC', copied: 'copiado',
    invalidTime: 'Corrija os tempos inválidos antes de exportar (mm:ss.xx).',
    modelNote: 'Na primeira execução, um modelo de IA será baixado do Hugging Face. O Whisper pode errar em músicas, principalmente com instrumentos. Este experimento ainda não separa os vocais.',
    youtubeTitle: 'vídeo de referência no YouTube',
  },
} as const;

function formatTimestamp(seconds: number) {
  const centis = Math.max(0, Math.round(seconds * 100));
  return String(Math.floor(centis / 6000)).padStart(2, '0') + ':' +
    String(Math.floor((centis % 6000) / 100)).padStart(2, '0') + '.' +
    String(centis % 100).padStart(2, '0');
}

function parseTimestamp(input: string): number | null {
  const match = /^(\d{1,3}):([0-5]\d)(?:[.,](\d{1,2}))?$/.exec(input.trim());
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]) + Number((match[3] || '0').padEnd(2, '0')) / 100;
}

function createLrc(lines: Line[], title: string, artist: string, duration: number) {
  const metadata = [
    title.trim() && '[ti:' + title.replace(/[\r\n\]]/g, ' ').trim() + ']',
    artist.trim() && '[ar:' + artist.replace(/[\r\n\]]/g, ' ').trim() + ']',
    '[length:' + formatTimestamp(duration).slice(0, 5) + ']',
  ].filter(Boolean);
  return metadata.concat(lines
    .map(line => ({ time: parseTimestamp(line.time), text: line.text.trim().replace(/[\r\n]+/g, ' ') }))
    .filter((line): line is { time: number; text: string } => line.time !== null && !!line.text)
    .sort((a, b) => a.time - b.time)
    .map(line => '[' + formatTimestamp(line.time) + ']' + line.text)).join('\n') + '\n';
}

async function decodeRecording(file: File): Promise<{ samples: Float32Array; duration: number }> {
  const context = new AudioContext();
  try {
    const decoded = await context.decodeAudioData(await file.arrayBuffer());
    if (!Number.isFinite(decoded.duration) || decoded.duration > MAX_DURATION) throw new Error('tooLong');
    const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(decoded.duration * 16000)), 16000);
    const source = offline.createBufferSource();
    source.buffer = decoded;
    source.connect(offline.destination); // Browser downmixes multiple channels to mono.
    source.start(0);
    const result = await offline.startRendering();
    return { samples: result.getChannelData(0).slice(), duration: decoded.duration };
  } finally {
    await context.close();
  }
}

async function loadModel(model: 'tiny' | 'base', onProgress: (event: ProgressEvent) => void) {
  // The CDN import keeps Whisper out of the site's normal bundle and SSR build.
  // @ts-expect-error: external CDN module is loaded only in the browser.
  const { pipeline } = await import(/* @vite-ignore */ 'https://cdn.jsdelivr.net/npm/@huggingface/transformers@3.8.1');
  const device = 'gpu' in navigator ? 'webgpu' : 'wasm';
  const key = model + ':' + device;
  if (!modelCache.has(key)) {
    const loading = pipeline('automatic-speech-recognition', 'onnx-community/whisper-' + model, {
      device: device === 'webgpu' ? 'webgpu' : 'wasm',
      dtype: device === 'webgpu' ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : 'q8',
      progress_callback: onProgress,
    }) as Promise<SpeechPipeline>;
    modelCache.set(key, loading);
    void loading.catch(() => modelCache.delete(key));
  }
  return modelCache.get(key)!;
}

function saveText(content: string, name: string) {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function WhisperLrcExperiment() {
  const { i18n } = useTranslation();
  const l = labels[i18n.language === 'en' ? 'en' : 'pt'];
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [audioUrl, setAudioUrl] = useState('');
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [language, setLanguage] = useState('pt');
  const [model, setModel] = useState<'tiny' | 'base'>('base');
  const [lines, setLines] = useState<Line[]>([]);
  const [duration, setDuration] = useState(0);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');
  const [progress, setProgress] = useState<number | null>(null);
  const [running, setRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const nextId = useRef(1);
  const videoId = useMemo(() => youtubeId(url), [url]);

  useEffect(() => {
    if (!file) { setAudioUrl(''); return; }
    const localUrl = URL.createObjectURL(file);
    setAudioUrl(localUrl);
    return () => URL.revokeObjectURL(localUrl);
  }, [file]);

  const badTimes = lines.some(line => parseTimestamp(line.time) === null);
  const exported = useMemo(() => createLrc(lines, title, artist, duration), [lines, title, artist, duration]);

  function chooseFile(selected: File | null) {
    setFile(selected);
    setLines([]);
    setDuration(0);
    setError('');
    setStatus('');
    setProgress(null);
    if (selected && !title.trim()) setTitle(selected.name.replace(/\.[^.]+$/, ''));
  }

  async function generate(event: React.FormEvent) {
    event.preventDefault();
    if (!file || running) return;
    if (url.trim() && !videoId) { setError(l.invalidYoutube); return; }
    setRunning(true); setError(''); setStatus(l.decoding); setProgress(null); setLines([]);
    try {
      const recording = await decodeRecording(file);
      setDuration(recording.duration);
      setStatus(l.downloading);
      const transcriber = await loadModel(model, event => {
        if (event.status === 'progress' && typeof event.progress === 'number') {
          setProgress(Math.max(0, Math.min(100, Math.round(event.progress))));
        }
      });
      setStatus(l.transcribing); setProgress(null);
      const options: Record<string, unknown> = {
        task: 'transcribe', return_timestamps: true, chunk_length_s: 30, stride_length_s: 5,
      };
      if (language !== 'auto') options.language = { pt: 'portuguese', en: 'english', es: 'spanish' }[language];
      const result = await transcriber(recording.samples, options);
      const chunks = (result.chunks || []).filter(chunk =>
        Number.isFinite(chunk.timestamp?.[0]) && chunk.text?.trim() &&
        !/^\[(music|applause|noise|silence)\]$/i.test(chunk.text.trim()));
      if (!chunks.length) throw new Error('noSpeech');
      setLines(chunks.map(chunk => ({
        id: nextId.current++,
        time: formatTimestamp(chunk.timestamp[0] as number),
        text: chunk.text.trim(),
      })));
      setStatus(l.done);
    } catch (err) {
      setError(err instanceof Error && err.message === 'tooLong' ? l.tooLong :
        err instanceof Error && err.message === 'noSpeech' ? l.noSpeech : l.failed);
      setStatus('');
    } finally { setRunning(false); setProgress(null); }
  }

  function shift(amount: number) {
    setLines(existing => existing.map(line => {
      const time = parseTimestamp(line.time);
      return time === null ? line : { ...line, time: formatTimestamp(time + amount) };
    }));
  }

  function playAt(time: string) {
    const seconds = parseTimestamp(time);
    if (!audioRef.current || seconds === null) return;
    audioRef.current.currentTime = seconds;
    void audioRef.current.play().catch(() => {});
  }

  const filename = (artist.trim() ? artist.trim() + ' - ' : '') + (title.trim() || 'lyrics');
  const safeFilename = filename.replace(/[<>:"/\\|?*\x00-\x1f]/g, '_').slice(0, 140) + '.lrc';

  return <section className="whisper-lrc-experiment" aria-labelledby="whisper-lrc-title">
    <p className="eyebrow">WHISPER / ON-DEVICE AI</p>
    <h2 id="whisper-lrc-title">{l.heading}</h2>
    <p className="whisper-intro">{l.intro}</p>
    <form onSubmit={generate} className="whisper-form">
      <label className="whisper-full">{l.youtube}
        <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.youtube.com/watch?v=…" disabled={running}/>
        <small>{l.youtubeHelp}</small>
        {url.trim() && !videoId && <small className="whisper-error">{l.invalidYoutube}</small>}
      </label>
      {videoId && <div className="whisper-video whisper-full"><iframe src={'https://www.youtube-nocookie.com/embed/' + videoId} title={l.youtubeTitle} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen/></div>}
      <label className="whisper-full">{l.file}
        <input type="file" accept="audio/*,.mp3,.wav,.m4a,.aac,.flac,.ogg,.opus" disabled={running} onChange={e => chooseFile(e.target.files?.[0] || null)}/>
        <small>{l.fileHelp}</small>
      </label>
      <label>{l.title}<input value={title} onChange={e => setTitle(e.target.value)} placeholder={l.title}/></label>
      <label>{l.artist}<input value={artist} onChange={e => setArtist(e.target.value)} placeholder={l.artist}/></label>
      <label>{l.language}<select value={language} onChange={e => setLanguage(e.target.value)} disabled={running}>
        <option value="pt">{l.portuguese}</option><option value="en">{l.english}</option>
        <option value="es">{l.spanish}</option><option value="auto">{l.auto}</option>
      </select></label>
      <label>{l.model}<select value={model} onChange={e => setModel(e.target.value as 'tiny' | 'base')} disabled={running}>
        <option value="base">{l.base}</option><option value="tiny">{l.tiny}</option>
      </select></label>
      <button className="button" type="submit" disabled={!file || running || !!(url.trim() && !videoId)}>{running ? l.working : l.generate}</button>
    </form>
    <p className="whisper-note">{l.modelNote}</p>
    {status && <p role="status" className="whisper-status">{status}{progress !== null ? ' ' + progress + '%' : ''}</p>}
    {error && <p role="alert" className="whisper-error whisper-message">{error}</p>}
    {audioUrl && <div className="whisper-preview"><label htmlFor="whisper-audio">{l.preview}</label><audio id="whisper-audio" ref={audioRef} src={audioUrl} controls preload="metadata"/></div>}
    {lines.length > 0 && <div className="whisper-results">
      <div className="whisper-results-head">
        <h3>{l.result} <span className="mono">({lines.length})</span></h3>
        <div className="whisper-actions">
          <button type="button" onClick={() => shift(-0.1)}>{l.earlier}</button>
          <button type="button" onClick={() => shift(0.1)}>{l.later}</button>
        </div>
      </div>
      <div className="whisper-lines">
        {lines.map((line, index) => <div className="whisper-line" key={line.id}>
          <button type="button" className="whisper-play" title={l.play} aria-label={l.play + ' ' + (index + 1)} onClick={() => playAt(line.time)}>▶</button>
          <label><span className="sr-only">{l.lineTime} {index + 1}</span>
            <input className="mono" value={line.time} aria-invalid={parseTimestamp(line.time) === null}
              onChange={e => setLines(current => current.map(item => item.id === line.id ? { ...item, time: e.target.value } : item))}/>
          </label>
          <label><span className="sr-only">{l.lineText} {index + 1}</span>
            <input value={line.text} onChange={e => setLines(current => current.map(item => item.id === line.id ? { ...item, text: e.target.value } : item))}/>
          </label>
          <button type="button" className="whisper-remove" title={l.remove} aria-label={l.remove + ' ' + (index + 1)}
            onClick={() => setLines(current => current.filter(item => item.id !== line.id))}>×</button>
        </div>)}
      </div>
      {badTimes && <p role="alert" className="whisper-error">{l.invalidTime}</p>}
      <div className="whisper-actions whisper-export">
        <button type="button" onClick={() => setLines(current => [...current, { id: nextId.current++, time: formatTimestamp(duration), text: '' }])}>{l.add}</button>
        <button type="button" disabled={badTimes} onClick={() => { void navigator.clipboard.writeText(exported).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }); }}>{copied ? l.copied : l.copy}</button>
        <button type="button" className="button" disabled={badTimes} onClick={() => saveText(exported, safeFilename)}>{l.download} ↓</button>
      </div>
    </div>}
  </section>;
}
