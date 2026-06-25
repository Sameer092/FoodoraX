# 🍕 FoodoraX

![Expo](https://img.shields.io/badge/Expo-SDK%2052-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.76.9-61DAFB?logo=react&logoColor=black)
![React](https://img.shields.io/badge/React-18.3.1-61DAFB?logo=react&logoColor=black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)

> FoodoraX is a production-ready, full-stack food delivery app built with React Native, Expo, and Supabase.
> It serves three distinct roles — Customer, Restaurant Owner, and Delivery Rider — each with a dedicated
> experience: real-time order tracking, Stripe payments, live GPS navigation, push notifications, and a modern glassmorphism UI.

---

## 📖 Overview

FoodoraX is built with scalability and clean architecture in mind, suitable for a production launch or as a standout portfolio project. The feature-based structure keeps each domain self-contained, server state flows through React Query with Supabase Realtime sync, and all data access is enforced at the database level via Row Level Security.

---

## ✨ Features

### Customer
- Browse & search restaurants with filters/sorting
- Full cart system with promo codes
- Stripe payment (Card, Apple Pay, Google Pay, Cash)
- Real-time order tracking with rider GPS
- Push notifications for every order milestone
- Favorites + order history with reviews & ratings

### Restaurant Owner
- Dashboard with live order stats
- Full menu management (categories, items, images)
- Real-time order management with status updates

### Delivery Rider
- Go online/offline with GPS tracking
- Accept available delivery orders
- Turn-by-turn navigation + earnings dashboard

---

## 🧱 Tech Stack

| Category | Technology |
|---|---|
| Framework | React Native 0.76.9 + Expo SDK 52 |
| Language | TypeScript 5.x (strict) |
| Navigation | React Navigation v6 |
| State | Zustand + TanStack Query v5 |
| Forms | React Hook Form + Zod |
| Styling | NativeWind (Tailwind CSS) |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Payments | Stripe |
| Maps | React Native Maps (Google Maps) |
| Animations | Reanimated v3 + Gesture Handler |
| Notifications | Expo Notifications |

---

## 🗂 Project Structure

```
FoodoraX/
├── app.json               # Expo config (plugins, maps keys, Stripe)
├── index.ts / App.tsx      # Entry point & root providers
├── supabase/
│   ├── migrations/         # 001 schema · 002 RLS · 003 seed
│   └── functions/          # create-payment-intent, send-notification
└── src/
    ├── features/           # auth, home, restaurants, cart, checkout, orders,
    │                       #   favorites, notifications, profile, restaurant-management, rider
    ├── navigation/         # stack & tab navigators
    ├── store/              # Zustand stores
    ├── hooks/              # React Query hooks
    ├── services/           # Supabase API layer
    ├── components/         # reusable UI
    ├── constants/          # colors, theme, config
    ├── types/              # TypeScript types
    └── utils/              # helpers
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 20+
- A [Supabase](https://supabase.com) account
- Google Maps API key
- iOS Simulator / Android Emulator, or the Expo Go app

### Installation & Run
```bash
cd FoodoraX
npm install
cp .env.example .env        # fill in Supabase, Stripe, Google Maps keys
npx expo start
```

---

## ⚙️ Environment Variables

Copy `.env.example` → `.env` and provide your Supabase URL/anon key, Stripe publishable key, and Google Maps key. Edge-function secrets are set via the Supabase CLI:

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_test_...
supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_...
```

> **Note:** `app.json` sets the Stripe plugin `merchantIdentifier` to a placeholder (`merchant.com.foodorax`). Replace it with your real Apple Pay merchant ID before a production build.

---

## 🗄 Supabase Setup

1. Create a project at [supabase.com](https://supabase.com).
2. Run migrations in order: `001_initial_schema.sql` → `002_rls_policies.sql` → `003_seed_data.sql`.
3. Enable providers in **Auth → Providers**: Email, Google, Apple.
4. Create storage buckets: `avatars`, `restaurants`, `menu-items`, `reviews`.
5. Deploy edge functions: `create-payment-intent`, `send-notification`.
6. Enable a Google Maps API key (Maps SDK iOS/Android, Directions, Geocoding) and add it to `app.json` + `.env`.

---

## 📦 Deployment

```bash
npm install -g eas-cli
eas login
eas build --platform ios       # or: --platform android
```

**Production checklist:** replace all placeholder keys, configure OAuth in Supabase, set up Stripe webhooks + production keys, enable realtime replication for `orders` and `rider_locations`, set up DB backups, configure APNs/FCM push certificates.

---

## 📄 License

MIT — for portfolio/demo use.
