export type LyricNote = { time: string; language: 'en' | 'pt-br'; text: string; explanation: string };
export type Locale = 'pt-br' | 'en';
export type Section = 'portfolio' | 'blog' | 'music' | 'experiments' | 'resume' | 'contact';
export interface Entry { lyricNotes?: LyricNote[]; player?: { youtubeId: string; subtitles: { en: string; 'pt-br': string }; offsetMs?: number };  section: 'blog' | 'music'; title: string; description: string; slug: string; locale: Locale; date: string; tags?: string[]; body: string; artist?: string; credits?: string; originalLanguage?: string; lyrics?: { time: string; original: string; translation: string; note?: string }[] }
