import { createInstance } from 'i18next';
import type { Locale } from './types';
export const locales: Locale[] = ['pt-br', 'en'];
const en = {
  downloadLrc: 'Download selected lyrics (.lrc)',
  lyricExperiment: 'Lyrics player', lyricExperimentIntro: 'Choose a YouTube video and search LRCLIB for timed lyrics. Compare the results and choose the recording that fits.', songSearch: 'Song and artist', songPlaceholder: 'e.g. Nelson Cavaquinho Juízo Final', youtubeLink: 'YouTube URL', findLyrics: 'Find lyrics', searchingLyrics: 'Searching LRCLIB…', invalidYoutube: 'Enter a valid YouTube video URL.', missingSong: 'Enter a song name.', lrclibError: 'Could not reach LRCLIB. Please try again.', candidateMatches: 'Lyrics matches', videoDuration: 'Video duration', durationHint: 'Results with synced lyrics are ordered by closest duration; recordings can differ.', durationPending: 'Waiting for YouTube video duration. Play the video if needed; results are in search order until then.', noLyricMatches: 'No results found. Try another song or artist name.', syncedAvailable: 'Timed lyrics', noSyncedLyrics: 'No timed lyrics', lyricsSource: 'Lyrics supplied by', chooseSyncedLyrics: 'Choose a result with timed lyrics above.', durationDifference_one: '{{count}} second difference', durationDifference_other: '{{count}} seconds difference',

  syncPrompt: 'Lyrics out of sync?', lyricsEarly: 'Lyrics are early', lyricsLate: 'Lyrics are late', syncReset: 'Reset', syncOffset: 'Lyrics timing adjustment',
  volume: 'Volume', mute: 'Mute', unmute: 'Unmute',
  lyricsPlayer: 'Listen & read', listenRead: 'LYRICS / PLAYER', smallerVideo: 'Smaller video', largerVideo: 'Expand video', expandLyrics: 'Show full lyrics', compactLyrics: 'Show three lines', followLine: 'Follow current line', timestamp: 'Time', lyricsLoadError: 'Some lyrics could not be loaded. Check the subtitle files.', loadingLyrics: 'Loading lyrics…', loadingPlayer: 'Loading YouTube player…', videoError: 'The video could not be played here.', watchOnYoutube: 'Watch on YouTube', videoPlayback: 'YouTube playback', playAudio: 'Play video', pauseAudio: 'Pause video', seek: 'Playback position', keyboardHelp: 'Space / K: play or pause · ← / → / H: seek 5s · J / L: seek 10s', keyboardDetails: 'Keyboard details', keyboardExplanation: 'Shortcuts work while focus is on this page. Text fields and the seek slider keep their normal keyboard controls; the embedded YouTube player handles its own keys.',

  resume: 'Résumé', resumeIntro: 'My experience, skills, and recent projects.', downloadResume: 'Download résumé (PDF)', resumeUpdated: 'Updated',
  fullDashboardReplay: 'Full dashboard replay', chartReplay: 'Chart replay with automatic zoom',
  chartReplayCaption: 'The same nine archived national bulletins, with a three-second countdown between updates and automatic chart zoom. The recorded interface is in Portuguese.',
  studioInterface: 'The voice studio', speechControls: 'Speech controls', interfacePreview: 'Interface preview',
  interfacePreviewCaption: 'Screenshots of the actual interface with sample text. No speech was being generated when these screenshots were taken. The captured interface is in Portuguese.',
  narrationHeading: 'Hear this project description in the voice of Optimus Prime',
  narrationCaption: 'A voice demo generated with PacTTSClone.', downloadNarration: 'Download the audio description',

  playReplay: 'Play replay', pauseReplay: 'Pause replay', replayAlt: 'Archived vote-count replay with chart and state map', replayCaption: 'Replay of nine archived national bulletins, with updates every three seconds. The state map shows actual final results as a fixed reference. The recorded interface is in Portuguese.',
  portfolio: 'Portfolio', blog: 'Blog', music: 'Music', experiments: 'Experiments', contact: 'Contact',
  skip: 'Skip to content', menu: 'Navigation', language: 'Language', theme: 'Change colour theme',
  eyebrow: 'SOFTWARE · MUSIC · CURIOSITY', hello: 'Hi, I’m Ricardo.', hero: 'I build things.',
  intro: 'Software developer based in Brazil. A collection of projects, notes, music, and ideas worth exploring.',
  explore: 'Explore my work', about: 'Let’s talk', selected: 'Selected projects', selectedIntro: 'Some things I’ve been working on.',
  project: 'View project', code: 'Source on GitHub', illustration: 'Project illustration', latest: 'From the notebook', allPosts: 'All posts',
  blogIntro: 'Development notes, things I learn, and ideas that need more than a few lines.',
  musicIntro: 'Listening closely. Lyrics, translations, and the stories around the music.',
  experimentsIntro: 'Small ideas you can play with. Everything here runs in your browser.',
  contactIntro: 'Have a project in mind, a question, or a song I should hear? Get in touch.',
  email: 'Send an email', elsewhere: 'Find me elsewhere', location: 'Mogi das Cruzes, São Paulo · Brazil',
  footer: 'Made by Ricardo Malosso. Always a work in progress.', back: 'Back', read: 'Read article',
  notFound: 'Page not found.', notFoundText: 'The link may have changed, or the page does not exist yet.', home: 'Back to the portfolio',
  original: 'Original', translation: 'English translation', notes: 'Line note', credits: 'Credits',
  filter: 'Search articles', noResults: 'No articles found. Try another search.', all: 'All',
  contrast: 'The contrast lab', contrastIntro: 'Move the sliders and see how a colour affects readability.', hue: 'Hue', lightness: 'Lightness', sample: 'Make something worth sharing.', ratio: 'Contrast ratio', accessible: 'Passes WCAG AA for normal text', inaccessible: 'Does not meet WCAG AA for normal text', reset: 'Reset',
  approach: 'ABOUT MY WORK', approachTitle: 'Useful software.\nRoom to explore.', approachText: 'My work spans C#/.NET, JavaScript, Python, and AI integrations. This site brings that work together with the other things I care about.',
  fallback: 'This page is not available in the other language yet. Here are the available entries.',
};
const pt: typeof en = {
  downloadLrc: 'Baixar letra selecionada (.lrc)',
  lyricExperiment: 'Player de letras', lyricExperimentIntro: 'Escolha um vídeo do YouTube e busque letras sincronizadas no LRCLIB. Compare os resultados e escolha a gravação correspondente.', songSearch: 'Música e artista', songPlaceholder: 'ex.: Nelson Cavaquinho Juízo Final', youtubeLink: 'Link do YouTube', findLyrics: 'Buscar letra', searchingLyrics: 'Buscando no LRCLIB…', invalidYoutube: 'Insira um link válido de vídeo do YouTube.', missingSong: 'Digite o nome da música.', lrclibError: 'Não foi possível acessar o LRCLIB. Tente novamente.', candidateMatches: 'Letras encontradas', videoDuration: 'Duração do vídeo', durationHint: 'Os resultados sincronizados são ordenados pela duração mais próxima; as gravações podem ser diferentes.', durationPending: 'Aguardando a duração do vídeo. Se necessário, dê play; até lá, os resultados seguem a ordem da busca.', noLyricMatches: 'Nenhum resultado encontrado. Tente outro nome de música ou artista.', syncedAvailable: 'Letra sincronizada', noSyncedLyrics: 'Sem letra sincronizada', lyricsSource: 'Letras fornecidas por', chooseSyncedLyrics: 'Escolha acima um resultado com letra sincronizada.', durationDifference_one: '{{count}} segundo de diferença', durationDifference_other: '{{count}} segundos de diferença',

  syncPrompt: 'Letra fora de sincronia?', lyricsEarly: 'Letra adiantada', lyricsLate: 'Letra atrasada', syncReset: 'Restaurar', syncOffset: 'Ajuste de tempo da letra',
  volume: 'Volume', mute: 'Silenciar', unmute: 'Ativar som',
  lyricsPlayer: 'Ouvir e ler', listenRead: 'LETRA / PLAYER', smallerVideo: 'Reduzir vídeo', largerVideo: 'Ampliar vídeo', expandLyrics: 'Mostrar letra completa', compactLyrics: 'Mostrar três versos', followLine: 'Acompanhar verso atual', timestamp: 'Tempo', lyricsLoadError: 'Não foi possível carregar todas as letras. Verifique os arquivos de legenda.', loadingLyrics: 'Carregando letras…', loadingPlayer: 'Carregando player do YouTube…', videoError: 'Não foi possível reproduzir o vídeo aqui.', watchOnYoutube: 'Assistir no YouTube', videoPlayback: 'Reprodução do YouTube', playAudio: 'Reproduzir vídeo', pauseAudio: 'Pausar vídeo', seek: 'Posição da reprodução', keyboardHelp: 'Espaço / K: reproduzir ou pausar · ← / → / H: avançar ou voltar 5s · J / L: voltar ou avançar 10s', keyboardDetails: 'Detalhes dos atalhos', keyboardExplanation: 'Os atalhos funcionam com o foco nesta página. Campos de texto e o controle de posição mantêm seus atalhos normais; o player do YouTube tem seus próprios comandos.',

  resume: 'Currículo', resumeIntro: 'Minha experiência, competências e projetos recentes.', downloadResume: 'Baixar currículo (PDF)', resumeUpdated: 'Atualizado em',
  fullDashboardReplay: 'Replay do painel completo', chartReplay: 'Replay do gráfico com zoom automático',
  chartReplayCaption: 'Os mesmos 9 boletins nacionais arquivados, com contagem regressiva de três segundos entre atualizações e zoom automático no gráfico.',
  studioInterface: 'O estúdio de voz', speechControls: 'Controles de fala', interfacePreview: 'Prévia da interface',
  interfacePreviewCaption: 'Capturas da interface real com texto de exemplo. Não havia geração de voz em execução durante as capturas.',
  narrationHeading: 'Ouça a descrição deste projeto na voz do Bob Esponja',
  narrationCaption: 'Uma demonstração de voz gerada com o PacTTSClone.', downloadNarration: 'Baixar a descrição em áudio',

  playReplay: 'Reproduzir animação', pauseReplay: 'Pausar animação', replayAlt: 'Replay da apuração arquivada com gráfico e mapa dos estados', replayCaption: 'Replay de 9 boletins nacionais arquivados, com atualização a cada 3 segundos. Mapa estadual: resultados finais reais, como referência fixa.',
  portfolio: 'Portfólio', blog: 'Blog', music: 'Música', experiments: 'Experimentos', contact: 'Contato',
  skip: 'Pular para o conteúdo', menu: 'Navegação', language: 'Idioma', theme: 'Mudar tema de cores',
  eyebrow: 'SOFTWARE · MÚSICA · CURIOSIDADE', hello: 'Oi, eu sou o Ricardo.', hero: 'Eu construo coisas.',
  intro: 'Desenvolvedor de software no Brasil. Uma coleção de projetos, notas, músicas e ideias que valem explorar.',
  explore: 'Conheça meu trabalho', about: 'Vamos conversar', selected: 'Projetos selecionados', selectedIntro: 'Algumas coisas em que tenho trabalhado.',
  project: 'Ver projeto', code: 'Código no GitHub', illustration: 'Ilustração do projeto', latest: 'Do caderno', allPosts: 'Todos os textos',
  blogIntro: 'Notas de desenvolvimento, aprendizados e ideias que precisam de mais de algumas linhas.',
  musicIntro: 'Escutando com atenção. Letras, traduções e as histórias ao redor da música.',
  experimentsIntro: 'Pequenas ideias para testar. Tudo aqui funciona no seu navegador.',
  contactIntro: 'Tem um projeto em mente, uma pergunta ou uma música que eu preciso ouvir? Entre em contato.',
  email: 'Enviar um e-mail', elsewhere: 'Me encontre também', location: 'Mogi das Cruzes, São Paulo · Brasil',
  footer: 'Feito por Ricardo Malosso. Sempre em construção.', back: 'Voltar', read: 'Ler texto',
  notFound: 'Página não encontrada.', notFoundText: 'O endereço pode ter mudado, ou a página ainda não existe.', home: 'Voltar ao portfólio',
  original: 'Original', translation: 'Tradução em inglês', notes: 'Nota do verso', credits: 'Créditos',
  filter: 'Buscar textos', noResults: 'Nenhum texto encontrado. Tente outra busca.', all: 'Todos',
  contrast: 'Laboratório de contraste', contrastIntro: 'Mova os controles e veja como uma cor muda a legibilidade.', hue: 'Matiz', lightness: 'Luminosidade', sample: 'Faça algo que valha compartilhar.', ratio: 'Razão de contraste', accessible: 'Atende ao nível AA da WCAG para texto normal', inaccessible: 'Não atende ao nível AA da WCAG para texto normal', reset: 'Restaurar',
  approach: 'SOBRE MEU TRABALHO', approachTitle: 'Software útil.\nEspaço para explorar.', approachText: 'Meu trabalho passa por C#/.NET, JavaScript, Python e integrações com IA. Este site reúne esses projetos e as outras coisas que me interessam.',
  fallback: 'Esta página ainda não está disponível no outro idioma. Veja os textos disponíveis.',
};
export function createI18n(locale: Locale) {
  const instance = createInstance();
  void instance.init({ lng: locale, fallbackLng: 'pt-br', resources: { en: { translation: en }, 'pt-br': { translation: pt } }, initAsync: false, lowerCaseLng: true, load: 'currentOnly', showSupportNotice: false, interpolation: { escapeValue: false } });
  return instance;
}
