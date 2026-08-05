# George — Claude Code

Next.js banking-style dashboard + mobile (Capacitor/Tauri).  
Skills v `.agents/skills/` (Supabase). Globálny profil: `~/.claude/CLAUDE.md`.

## Stack

- Next.js (port **3030**)
- TypeScript
- Drizzle ORM + Supabase Postgres
- Playwright (desktop + iPhone projects)
- Capacitor (iOS/Android) + optional Tauri

## Commands

```bash
npm install
npm run dev              # :3030
npm run test:unit
npm run build
npm run test             # playwright
npm run db:generate
npm run db:migrate
npm run db:seed
npm run cap:sync
```

## Rules

1. DB zmeny = Drizzle migration, nie ad-hoc prod SQL bez migrácie
2. Supabase: RLS + server-side auth; service role never client
3. PDF / statement generators majú unit testy v `scripts/*.test.ts` — nemeň bez spustenia
4. Mobile: po web zmenách zváž `cap:sync` a device smoke
5. Secrets len `.env.local` (gitignored)

## Key areas

| Path | Role |
|------|------|
| `app/` · `components/` | UI routes |
| `lib/` | domain logic |
| `drizzle/` | migrations |
| `e2e/` | Playwright |
| `scripts/` | seed, PDF, assets tests |
| `.agents/skills/supabase/` | Supabase skill |

## MCP

- Claude.ai **Supabase**
- `github`
- `sequential-thinking` pre payment/PDF edge cases

## Locale

- SK/CZ banking UX patterns; amounts with proper currency formatting
