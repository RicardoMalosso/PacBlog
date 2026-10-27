export type Locale = 'pt-br' | 'en';
export type Section = 'portfolio' | 'blog' | 'music' | 'experiments' | 'contact';
export interface Entry { section: 'blog' | 'music'; title: string; description: string; slug: string; locale: Locale; date: string; tags?: string[]; body: string; artist?: string; credits?: string; originalLanguage?: string; lyrics?: { time: string; original: string; translation: string; note?: string }[] }
