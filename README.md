# CLYVO Web Alpha

**Be ready for every conversation.**

A browser application for interview preparation, live conversation context, meetings, memory, search and review. No API key or paid service is required. The assistant is a deterministic local provider that creates structured suggestions from saved context.

## Local run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Verify with `npm run lint`, `npm test`, and `npm run build`.

## Routes and features

`/` landing; `/auth` local identity; `/onboarding` resume text, goals, job description, company and projects; `/dashboard` data-derived metrics; `/live` manual questions, simulation, optional speech recognition, notes and screen preview; `/interview` preparation and practice; `/meetings` transcripts, decisions and actions; `/memory` CRUD, pins, tags and filters; `/search` type/date filters and highlighted results; `/history` open, rename, delete, reuse and review; `/feedback` descriptive review; `/settings` profile, audio check, preferences and JSON import/export.

## Architecture

- `src/features/`: separate product screens.
- `src/components/`: shell, shared controls, accessible dialog, audio monitor and SVG branding.
- `src/lib/model.ts`: Zod schemas, stable IDs and fictional sample data.
- `src/providers/`: application state, storage, AI, transcription, screen and search adapters.
- `tests/domain.test.ts`: persistence, import/export, migration, merge, contextual response and search checks.

The storage schema is version 1. `clyvo:state` stores the complete snapshot; documented profile, session, memory, settings, prep, meeting and active-session keys are also written. Invalid data is copied to `clyvo:corrupt-backup` before fallback. Data stays in one browser profile and does not sync. Export before clearing browser storage.

## GitHub Pages deployment

Set the repository Pages source to **GitHub Actions**. The included workflow runs lint, tests and a static build, then publishes it. It sets `NEXT_PUBLIC_BASE_PATH=/clyvo`; update that value if the repository name changes. Pushes to `main` publish automatically.

## Vercel alternative

Import this repository using the Next.js preset, with no environment variables. The default base path is empty. The static app needs no server functions or API keys. Hosting remains subject to provider limits.

## Browser and product limitations

This is a local-first Alpha, not cloud authentication. Screen sharing requires an explicit click and browser permission. Screen previews and snapshots are temporary; arbitrary screenshots are not analyzed by AI. SpeechRecognition varies by browser and may use the browser vendor's speech service. Manual questions and simulation remain available. The device selector controls the local audio monitor; speech recognition uses the browser's default microphone. Resume import accepts plain text and Markdown. Feedback is descriptive and rule-based, with no claimed precision score.

## Brand

The written brand tokens and available product/UI and social/marketing boards were reviewed. The primary logo board was unavailable, so exact logo geometry remains subject to comparison. The app uses dark neutral surfaces, restrained accents, custom SVG V marks, Inter/Manrope fallbacks, and reduced-motion support.

## Upgrade paths

Replace `AIProvider` with a real server-backed AI provider, `StorageProvider` with authenticated database storage, `TranscriptionProvider` with consent-based real-time transcription, and the manual screen interpreter with a multimodal provider. Before cloud use, add authentication, access control, server-side secrets, retention controls, durable migrations and provider failure handling.
