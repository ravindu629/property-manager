# AGENTS.md

Instructions for AI coding agents working on the Procuratio frontend.
Procuratio is a UK leasehold property management app. This repo is the React frontend;
the Spring Boot backend lives in the separate `procuratio-backend` repo.

## Commands

Run from this folder (Windows PowerShell).

| Task | Command |
| --- | --- |
| Install packages | `npm install` |
| Start the dev server (http://localhost:5173) | `npm run dev` |
| Type check | `npm run typecheck` |
| Lint | `npm run lint` |
| Production build | `npm run build` |

Before finishing a change, run `npm run typecheck` and `npm run lint` and fix anything your change caused.

## Tech stack

React 18, TypeScript, Vite, Tailwind CSS, lucide-react icons, pdfme 6 (PDF templates),
Supabase client (legacy data, see below).

## Project structure

```
src/
  App.tsx              App shell: sidebar, routing between sections, Template Studio tab state
  components/          Shared UI (Sidebar, Modal, DataTable, Card, Badge ...)
  sections/            One file per page (Finance, Units, UnitDetail ...)
  pdfme-demo/          Template Studio (see src/pdfme-demo/AGENTS.md)
  lib/                 Supabase client, shared types, formatting helpers
supabase/migrations/   Legacy Supabase schema (reference only)
```

New pages go in `src/sections/` and get a sidebar entry in `src/components/Sidebar.tsx`
and a case in `App.tsx`.

## Code style

- TypeScript everywhere. No `any` unless there is no reasonable type.
- Import project files with the `@/` alias (`@/components/Modal`), not deep relative paths.
- Styling with Tailwind classes only. Icons from `lucide-react`.
- Do not add UI, icon or styling packages unless asked.
- Designs should look polished and production-ready, matching the existing slate and sky colour scheme.
- Keep components small; put shared UI in `src/components/`.

## Product rules

- Users must never see the library name "pdfme". The feature is called "Template Studio".
- User-facing text uses UK English (colour, organisation) and plain, short wording.
- Never show developer notes (server names, storage details) in the UI.

## Data and backend

- Template Studio saves to the Spring Boot API when `VITE_TEMPLATE_API_URL` is set in `.env`,
  otherwise to browser storage. The API contract is `src/pdfme-demo/api/API_CONTRACT.md`.
- Everything else still uses Supabase (`src/lib/supabase.ts`). This is legacy: the plan is to move
  each area to the Spring Boot backend. Do not add new Supabase tables or features.

## Known issues (do not copy these patterns)

- `src/sections/UnitDetail.tsx` has 3 known type errors.
- Older Bolt-generated files (Finance and Units sections) have unused-variable lint errors.
- Leave these alone unless the task is to fix them, and do not count them as caused by your change.

## Git and commits

- Never commit to `main`. Use a branch (`feature/...`, `fix/...`, `docs/...`) and a pull request.
- Conventional Commits: `feat(scope): ...`, `fix(scope): ...`, `refactor:`, `chore:`, `docs:`.
- One logical change per commit, with a short body explaining why.
- Files use Windows line endings (CRLF). Keep them as they are.

## Security

- Never commit `.env` or any key, token or password. `.env` is git-ignored.
- Do not log or display Supabase keys or user data.
