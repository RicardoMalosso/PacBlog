import entries from './content.generated.json';
import type { Entry, Locale } from './types';
export const content = entries as Entry[];
export const base = import.meta.env.BASE_URL;
export const siteUrl = 'https://ricardomalosso.github.io';
export const projects = [
  { slug: 'pacttsclone', name: 'PacTTSClone', category: 'PYTHON / AI / AUDIO', image: 'pacttsclone-studio.jpg', replay: null, tags: ['Python', 'OmniVoice', 'Twitch / OBS'], repo: 'https://github.com/RicardoMalosso/PacTTSClone',
    en: { description: 'Local voice generation, built for streamers.', detail: 'A desktop-hosted application that turns a reference MP3 and text into generated speech with OmniVoice. Includes saved voices, generation monitoring, and Twitch and OBS integrations.' },
    'pt-br': { description: 'Geração de voz local, pensada para streamers.', detail: 'Uma aplicação executada localmente que transforma um MP3 de referência e um texto em fala com o OmniVoice. Inclui vozes salvas, monitoramento de geração e integrações com Twitch e OBS.' } },
  { slug: 'election-tracker', name: 'Election Tracker', category: 'DATA / VISUALIZATION', image: 'election-tracker-poster.jpg', replay: 'election-tracker-replay.gif', tags: ['TSE', 'Data visualization', 'Caching'], repo: null,
    en: { description: 'Making the vote count easier to follow.', detail: 'An election dashboard that collects official TSE results and presents the progress of the count. A shared cache and adaptive polling strategy reduce repeated requests as updates slow down.' },
    'pt-br': { description: 'A apuração dos votos mais fácil de acompanhar.', detail: 'Um painel eleitoral que coleta resultados oficiais do TSE e apresenta a evolução da apuração. Um cache compartilhado e uma estratégia de consulta adaptativa reduzem requisições repetidas conforme as atualizações ficam menos frequentes.' } },
];
export const pathFor = (locale: Locale, section = '', slug = '') => `/${locale}/${section ? `${section}/` : ''}${slug ? `${slug}/` : ''}`;
export const publicPath = (route: string) => `${base.replace(/\/$/, '')}${route}`;
export function alternatePath(pathname: string, locale: Locale) {
  const parts = pathname.split('/').filter(Boolean);
  parts[0] = locale;
  if (parts.length > 2 && ['blog', 'music'].includes(parts[1]) && !content.some(x => x.locale === locale && x.section === parts[1] && x.slug === parts[2])) return pathFor(locale, parts[1]) + '?translation=missing';
  return '/' + parts.join('/') + '/';
}
export function routeMetadata(route: string) {
  const [first, section = '', slug] = route.split('/').filter(Boolean);
  const locale: Locale = first === 'en' ? 'en' : 'pt-br';
  const entry = content.find(x => x.locale === locale && x.section === section && x.slug === slug);
  const project = section === 'portfolio' ? projects.find(x => x.slug === slug) : undefined;
  const labels = locale === 'en' ? { '': 'Portfolio', portfolio: 'Portfolio', blog: 'Blog', music: 'Music', experiments: 'Experiments', contact: 'Contact' } : { '': 'Portfólio', portfolio: 'Portfólio', blog: 'Blog', music: 'Música', experiments: 'Experimentos', contact: 'Contato' };
  return { locale, title: `${entry?.title || project?.name || labels[section as keyof typeof labels] || '404'} · Ricardo Malosso`, description: entry?.description || project?.[locale].description || (locale === 'en' ? 'Software projects, development notes, music, and experiments by Ricardo Malosso.' : 'Projetos de software, notas de desenvolvimento, música e experimentos de Ricardo Malosso.') };
}
export const routes = ['/', ...(['pt-br', 'en'] as Locale[]).flatMap(locale => [pathFor(locale), ...['blog', 'music', 'experiments', 'contact'].map(section => pathFor(locale, section)), ...projects.map(x => pathFor(locale, 'portfolio', x.slug)), ...content.filter(x => x.locale === locale).map(x => pathFor(locale, x.section, x.slug))])];
