# FoodoraX 🍕

FoodoraX is a production-ready, full-stack food delivery mobile application built with React Native, Expo SDK, and Supabase — designed to showcase senior-level mobile engineering skills across the entire product lifecycle.
It supports three distinct user roles — Customer, Restaurant Owner, and Delivery Rider — each with a fully dedicated experience including real-time order tracking, Stripe-powered payments, live GPS navigation, push notifications, and a modern glassmorphism UI inspired by Uber Eats and DoorDash.
Built with scalability and clean architecture in mind, FoodoraX is suitable for a production launch or as a standout portfolio project demonstrating advanced React Native, TypeScript, and backend-as-a-service expertise.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React Native + Expo SDK 51 |
| Language | TypeScript (strict) |
| Navigation | React Navigation v6 |
| State | Zustand + React Query v5 |
| Forms | React Hook Form + Zod |
| Styling | NativeWind (Tailwind CSS) |
| Backend | Supabase (Postgres, Auth, Realtime, Storage) |
| Payments | Stripe |
| Maps | React Native Maps (Google Maps) |
| Animations | Reanimated v3 + Gesture Handler |
| Notifications | Expo Notifications |

---

## Features

### Customer
- Browse & search restaurants with filters/sorting
- Full cart system with promo codes
- Stripe payment (Card, Apple Pay, Google Pay, Cash)
- Real-time order tracking with rider GPS
- Push notifications for every order milestone
- Favorites (restaurants & menu items)
- Order history with reviews & ratings

### Restaurant Owner
- Dashboard with live order stats
- Full menu management (categories, items, images)
- Real-time order management with status updates
- Analytics overview

### Delivery Rider
- Go online/offline toggle with GPS tracking
- Accept available delivery orders
- Turn-by-turn navigation to restaurant & customer
- Earnings dashboard

---

## Project Structure

```
src/
├── features/          # Feature-based modules
│   ├── auth/          # Login, signup, forgot password
│   ├── home/          # Home screen
│   ├── restaurants/   # Restaurant list & detail
│   ├── cart/          # Cart management
│   ├── checkout/      # Checkout + payments
│   ├── orders/        # Order tracking, history, reviews
│   ├── favorites/     # Saved restaurants
│   ├── notifications/ # Push notification inbox
│   ├── profile/       # Profile, addresses, settings
│   ├── restaurant-management/  # Owner dashboard
│   └── rider/         # Rider dashboard
├── navigation/        # Stack & tab navigators
├── store/             # Zustand stores
├── hooks/             # React Query hooks
├── services/          # Supabase API layer
├── components/        # Reusable UI components
├── constants/         # Colors, theme, config
├── types/             # TypeScript types
└── utils/             # Helpers
```

---

## Setup

### 1. Install dependencies
```bash
npm install
```

### 2. Configure environment
```bash
cp .env.example .env
# Fill in your Supabase, Stripe, and Google Maps keys
```

### 3. Supabase Setup
1. Create a Supabase project at [supabase.com](https://supabase.com)
2. Run migrations in order:
   ```sql
   -- Run in Supabase SQL editor:
   -- supabase/migrations/001_initial_schema.sql
   -- supabase/migrations/002_rls_policies.sql
   -- supabase/migrations/003_seed_data.sql
   ```
3. Enable providers in Auth → Providers: Email, Google, Apple
4. Create storage buckets: `avatars`, `restaurants`, `menu-items`, `reviews`
5. Deploy edge functions:
   ```bash
   supabase functions deploy create-payment-intent
   supabase functions deploy send-notification
   ```
6. Set edge function secrets:
   ```bash
   supabase secrets set STRIPE_SECRET_KEY=sk_test_...
   supabase secrets set STRIPE_PUBLISHABLE_KEY=pk_test_...
   ```

### 4. Google Maps
- Get an API key from [Google Cloud Console](https://console.cloud.google.com)
- Enable: Maps SDK (iOS & Android), Directions API, Geocoding API
- Add to `app.json` and `.env`

### 5. Start the app
```bash
npx expo start
```

---

## Database Schema

The database uses PostgreSQL with full Row Level Security. Key tables:

- `users` — all user accounts (customer, restaurant_owner, rider, admin)
- `restaurants` — restaurant profiles with location
- `menu_categories` + `menu_items` — full menu system
- `carts` + `cart_items` — shopping cart
- `orders` + `order_items` — order management
- `payments` — Stripe payment records
- `riders` + `rider_locations` — rider tracking
- `reviews` + `favorites` + `notifications` — social features

---

## Deployment

### EAS Build (Expo Application Services)
```bash
npm install -g eas-cli
eas login
eas build --platform ios
eas build --platform android
```

### Production Checklist
- [ ] Replace all `YOUR_*_KEY` placeholders
- [ ] Configure Apple/Google OAuth in Supabase
- [ ] Set up Stripe webhooks for payment reconciliation
- [ ] Configure production Stripe keys
- [ ] Enable real-time replication for `orders` and `rider_locations` tables
- [ ] Set up database backups in Supabase
- [ ] Configure push notification certificates (APNs / FCM)

---

## Architecture Decisions

- **Feature-based structure** — each feature owns its screens, making the codebase easy to navigate and scale
- **React Query** — server state with caching, optimistic updates, and real-time sync via Supabase Realtime
- **Zustand** — client state (cart, auth, app preferences) with persistence via AsyncStorage
- **Row Level Security** — all data access is enforced at the database level, not just the API layer
- **Payment abstraction** — the payment service layer can swap providers without touching UI code
- **Reanimated v3** — all animations run on the UI thread for 60fps performance

---

Built with ❤️ as a production-ready portfolio project.
