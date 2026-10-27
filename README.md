# PacBlog

Ricardo Malosso’s bilingual portfolio, blog, music pages, and browser experiments.

**Production target:** https://ricardomalosso.github.io/PacBlog/

## Stack

React + TypeScript, Vite, React Router, i18next / react-i18next, and Markdown with GFM. The build renders every known route to HTML with React DOM Server. React hydrates those files in the browser for client navigation and interactions. **No runtime server, database, or ChatGPT Sites hosting.**

## Run locally

Use Node.js 24 (the same version as CI).

```sh
npm ci
npm run dev
```

Open the printed URL with `/PacBlog/` appended. To check the actual static export:

```sh
npm run build
npm test
npm run preview
```

Open `/PacBlog/pt-br/` or `/PacBlog/en/`. Markdown is compiled before dev starts; after editing content, restart `npm run dev` (or run `npm run content` while Vite is running).

## Deploy on GitHub Pages

1. In **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
2. Push to `main`. `.github/workflows/pages.yml` installs pinned dependencies with `npm ci`, checks TypeScript, builds, runs export checks, and deploys `dist/`.
3. PRs build and test without deploying. You can also run the workflow manually from Actions.

`vite.config.ts` defaults to `/PacBlog/`. `BASE_PATH=/ npm run build` produces a root-hosted export for a future custom domain. Update `siteUrl` in `src/data.ts` at the same time. No SPA rewrite service is required: every published content route has its own `index.html`, and unknown routes receive GitHub Pages’ native 404.

## Structure

| Path | Purpose |
| --- | --- |
| `src/App.tsx` | Shared layout, navigation, page components |
| `src/i18n.ts` | PT-BR and English interface strings |
| `src/data.ts` | Portfolio projects, route helpers, SEO metadata |
| `src/components/` | Interactive components |
| `src/styles/global.css` | Responsive Gruvbox-inspired styling |
| `content/blog/*.md` | Blog posts |
| `content/music/*.md` | Music articles and optional timed lyric data |
| `public/images/` | Project thumbnails (currently labeled illustrations) |
| `scripts/content.mjs` | Frontmatter validation and content compilation |
| `scripts/prerender.mjs` | Static HTML, alternate language links, sitemap, 404 |
| `tests/site.test.mjs` | Export, internal link, translation, and content validation checks |
| `dist/` | Generated website; ignored by Git |

## Add an article

Create a Markdown file in `content/blog/` or `content/music/`:

```yaml
---
title: "Your title"
description: "A short description for the listing and search previews."
slug: "your-post"
locale: "en"
date: "2026-10-27"
tags: ["Development"]
draft: false
---
Your Markdown content.
```

Create the other language’s file with the **same section and slug**, and `locale: "pt-br"`. Filenames are for organization; the frontmatter controls the URL. Dates must be quoted ISO dates. Drafts are excluded from listings, routes, and sitemaps. Markdown accepts headings, links, images, code blocks, lists, and GFM tables. Raw HTML is disabled.

The language switch preserves the article when its translation exists. Otherwise, it links to the other language’s section with an explanatory notice. The initial language is chosen from a saved preference, then the browser language; explicit language URLs always win. Without JavaScript, the root page provides links to both languages and all prerendered content remains readable.

## Music posts and synchronized lyrics

Music posts are Markdown files in `content/music/`, one per language. Write the article body normally; the player appears after it. To add a synchronized player, include this frontmatter in both localized posts:

```yaml
player:
  youtubeId: "M7lc1UVf-VE"
  subtitles:
    en: "lyrics/demo/en.srt"
    pt-br: "lyrics/demo/pt-br.srt"
```

Place UTF-8 SRT files under `public/lyrics/`; their timestamps refer to the linked YouTube video's timeline. Use paths relative to `public/` (no leading slash). Both files are fetched and parsed in the browser; no backend is required. A valid 11-character YouTube ID and two existing SRT paths are checked at build time. Cue pairs are matched by their greatest overlapping time, one-to-one; unmatched cues are shown with a blank translation. Keep translations segmented similarly for best alignment. SRT cues support multiline text, CRLF and comma or dot millisecond separators. End times must be after start times. Instrumental gaps do not highlight a line.

Visitors can switch between three-line and full lyrics, click a line to seek, and use Space/K to play or pause, arrows/H for five-second jumps, and J/L for ten-second jumps while focused on the page. Inputs and the seek slider retain their native keyboard controls; the embedded YouTube player receives its own keys. The YouTube embed must remain at least 200 × 200 pixels. Provide a public embeddable video and publish only lyrics you are entitled to use. The included demo uses original sample lines and an unrelated YouTube API demonstration video; its timing illustrates the feature rather than transcribing that video.

Existing posts with `lyrics` frontmatter still render as static lyric pages. Credits and article copy remain localized independently of the bilingual SRT text.

## Portfolio and contact

Edit `projects` in `src/data.ts` and put thumbnails in `public/images/`. Each project has PT-BR/English summaries and details, tags, and an optional repository URL. Omit `repo` for private source. PacTTSClone uses captured UI previews on the landing page and shows the studio and speech controls on its project page. The Portuguese page includes the supplied Bob Esponja narration, and the English page includes the supplied Optimus Prime narration. Election Tracker uses a replay captured from the actual interface with nine archived national bulletins, three seconds per update, automatic chart zoom, and no reaction media. Its filled state map shows real final state results as a clearly labeled fixed reference: historical state snapshots were not archived. The full-dashboard replay appears on the landing page. Project details show both the full-dashboard and chart-focused GIFs, each with its own pause control and a static poster for reduced-motion preferences.

Contact links are in `Contact` in `src/App.tsx`. Email uses `mailto:`; it does not submit a form to a server. Google Fonts is optional: the site falls back to system fonts if it is unavailable. No analytics or tracking code is included.

### Résumé PDFs

The localized résumé pages use Markdown in `src/resumes/` and downloads in `public/resumes/`. After replacing either PDF, run `python3 scripts/link-resume-pdfs.py` (requires PyMuPDF) to add a clickable portfolio link to every page. The script is safe to run repeatedly. Keep the portfolio contact link in both Markdown sources when updating the résumé.
