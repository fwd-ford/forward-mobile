# forward-mobile

![org](https://img.shields.io/badge/org-fwd--ford-blue?style=flat-square)
![stack](https://img.shields.io/badge/stack-React_Native_·_Expo_·_TypeScript-333?style=flat-square)

Mobile app for **ForwardService** — attendant view (leads, Vista 360, messaging) and customer view (scheduling, status, Ford Care).

## Stack

- React Native with Expo SDK 51 (managed workflow)
- Expo Router (file-based navigation) with typed routes
- Supabase SDK for auth (session persisted via `expo-secure-store`)
- TypeScript strict mode
- i18next (pt-BR + en), device locale detection

## Structure

```
app/                    File-based routes (Expo Router)
  (tabs)/               Bottom tab navigator
    _layout.tsx
    index.tsx           Home: today's leads + pull to refresh
    leads.tsx           Leads list, navigates to detail
    profile.tsx         Profile + sign out
  lead/[id].tsx         Lead detail
  login.tsx             Auth screen
  _layout.tsx           Root stack
components/
  ui/                   Button, Card, Badge (primitives)
  domain/               LeadCard (business)
lib/
  api.ts                Typed client for forward-api
  supabase.ts           Supabase client (SecureStore-backed session)
  auth.ts               useSession hook + sign in/out
  theme.ts              Design tokens (colors, spacing, radius, typography)
i18n/
  index.ts              bootstrap
  en.json, pt-BR.json   translations
```

## Quick start

```bash
cp .env.example .env
npm install
npm run start        # opens Expo Dev Tools; scan QR on Expo Go
```

Android: `npm run android`
iOS: `npm run ios`
Web (for quick testing): `npm run web`

## Configuration

`app.json` holds the three runtime values under `expo.extra`:

- `apiBaseUrl` — URL of `forward-api` (default `http://localhost:18080`)
- `supabaseUrl` — Supabase project URL
- `supabaseAnonKey` — Supabase anon/publishable key

On a physical device, replace `localhost` with your machine's LAN IP so the phone can reach the API.

## Conventions

- User-facing strings always via `t("key")` — never hardcoded.
- Paths imported via `@/...` alias (configured in `tsconfig.json`).
- Components typed with explicit interfaces; no `any`.
- Design decisions live in `lib/theme.ts` — edit there, not inline.

## Sprint 1 scope

- Auth (email/password) via Supabase
- Home: today's leads (from `forward-api`)
- Leads list with detail view
- Profile + sign out
- i18n (pt-BR default, en supported)

Later sprints add: customer Vista 360, schedule, WhatsApp send action, push notifications.
