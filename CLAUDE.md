# forward-mobile — Repository Instructions

## Language Policy

- Code, variables, functions, components: always in English.
- Comments: bilingual when helpful.
- User-facing text: always via i18n keys, never hardcoded.
- Supported locales: en, pt-BR.

## Stack

- React Native with Expo (managed workflow)
- Expo Router for navigation
- Supabase JS SDK for data and auth
- TypeScript strict mode

## Project Structure

- `app/`: Expo Router pages (file-based routing)
- `app/(tabs)/`: main tab navigation screens
- `components/ui/`: reusable UI primitives
- `components/domain/`: business-specific components
- `lib/`: Supabase client config, API calls, utilities
- `i18n/`: localization files

## Mandatory Patterns

### Navigation
- Use Expo Router file-based routing exclusively.
- Tab navigation for main screens, stack for detail views.

### Data
- Supabase SDK is the primary data source.
- Go API called only for WhatsApp send actions.
- Never store sensitive data in AsyncStorage without encryption.

### Components
- UI components are generic. Domain components are business-specific.
- All props must be typed with TypeScript interfaces.
