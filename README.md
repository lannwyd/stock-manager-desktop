# Storage Manager

A warehouse/stock management system for a pharmacy operating two separate storage locations (**Pharmacie** and **Maison**), sharing one database. Available as a mobile app (Arabic, RTL) and a desktop app, both backed by the same Supabase project.

## Structure

Each warehouse is organized as:

```
Warehouse
 └── Sections (e.g. "Orange rack")
      └── Floors (e.g. "Floor 1")
           └── Stock batches (a product + lot + expiry + quantity)
```

Products (drug name + DCI) are a separate shared table — the same drug can exist as multiple batches, with different lots/expiry dates, across different floors and even different warehouses.

## Features

- Browse warehouse → sections → floors → products
- Add / edit / delete sections, floors, and stock batches
- Search products by name or DCI, with sorting (name, soonest/latest expiry)
- Switch between warehouses from a dropdown
- Transfer stock between warehouses, logged in a history/audit table (the source batch is decremented or removed; the destination is **not** auto-incremented — transfers only record that a movement happened, matching a manual physical handoff workflow)
- Pull-to-refresh / manual refresh across all list screens
- Full Arabic (RTL) interface on mobile

## Stack

**Backend**
- [Supabase](https://supabase.com) — Postgres database, auto-generated REST API, row-level security

**Mobile**
- [Expo](https://expo.dev) / React Native
- [Expo Router](https://docs.expo.dev/router/introduction/) — file-based navigation
- [NativeWind](https://www.nativewind.dev/) — Tailwind CSS for React Native
- [EAS Build](https://docs.expo.dev/eas/) — cloud builds for Android/iOS
- `lottie-react-native` for loading/error animations

**Desktop**
- [Tauri](https://tauri.app/) — native shell wrapping a web frontend
- React + Vite
- React Router (`react-router-dom`)
- Tailwind CSS
- `lottie-react`

Both frontends share the same conceptual data layer (hooks + context), talking to the same Supabase project.
