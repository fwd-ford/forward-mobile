# forward-mobile

![org](https://img.shields.io/badge/org-fwd--ford-blue?style=flat-square)
![stack](https://img.shields.io/badge/stack-React_Native_·_Expo_·_TypeScript-333?style=flat-square)

Mobile app for **ForwardService** — attendant view (leads, Vista 360, messaging) and customer view (scheduling, status, Ford Care).

## Stack

- **React Native** with **Expo** (managed workflow)
- **Expo Router** for file-based navigation
- **Supabase SDK** for data and auth
- **TypeScript** (strict)

## Structure

```
app/                    # Expo Router (file-based routing)
├── (tabs)/             # Tab navigation
│   ├── index.tsx       # Home (vehicle summary / leads of the day)
│   ├── leads.tsx       # Pulse Leads (attendant)
│   ├── schedule.tsx    # Scheduling (customer)
│   └── profile.tsx     # Profile + settings
├── customer/
│   └── [id].tsx        # Customer Vista 360 detail
├── lead/
│   └── [id].tsx        # Lead detail + action
├── _layout.tsx         # Root layout
└── login.tsx           # Auth screen
components/
├── ui/                 # Primitives (Button, Card, Badge)
└── domain/             # ChurnScore, VehicleCard, LeadCard
lib/                    # Supabase client, API calls, utils
i18n/                   # Localization (en, pt-BR)
```
