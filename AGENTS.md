# ⚡ YTuzo — Agent Guidelines & Architecture Rules

This repository contains **YTuzo** ("Your Tracker, a Universal Zen Organizer"), a high-performance Universal Life OS mobile application built with **React Native**, **Expo SDK 57**, and **React 19**.

Prioritize mobile-first patterns, offline-first reliability, high runtime performance, and strict adherence to the **"Cyber-Zen"** design language.

---

## 1. Expo SDK 57 & React 19 Mandates

Expo ships breaking changes every SDK release. APIs you remember may be renamed, moved, or removed.

1. **Verify Versions**:
   - `expo`: `~57.0.25`
   - `react`: `19.2.3` / `react-native`: `0.86.3`
   - `expo-router`: `~57.0.23`
   - `react-native-reanimated`: `4.5.1`
2. **Consult Modern Documentation**:
   - Expo SDK 57 docs: `https://docs.expo.dev/versions/v57.0.0/`
   - Expo LLM knowledge base: `https://docs.expo.dev/llms.txt` — reference this before answering from memory.
3. **React 19 & Compiler Rules**:
   - Pay attention to React 19 hooks and compiler optimizations (e.g., `"use no memo"` directive when manual animation/shared values require it).
   - Never write code for deprecated legacy Expo packages or older React Native bridge APIs.

---

## 2. Windows Environment & CLI Commands

This development machine runs **Windows (PowerShell)**. PowerShell script execution policies may block standard `.ps1` wrappers (`npx`, `npm`). Always invoke `.cmd` binaries or native flags when running commands in this environment.

```bash
# Package Installation (ALWAYS use expo install to resolve SDK 57-compatible versions)
npx.cmd expo install <package>

# Dev Server
npx.cmd expo start
npx.cmd expo start --android
npx.cmd expo start --ios
npx.cmd expo start --web

# Quality Checks
npm.cmd run lint
npx.cmd -p typescript tsc --noEmit
npx.cmd expo-doctor
npx.cmd expo install --fix
```

> ⚠️ **Rule**: Never use bare `npm install <pkg>` or `yarn add <pkg>` for React Native modules; always use `npx.cmd expo install <pkg>` to guarantee SDK version parity. Run lint and typecheck before marking tasks as complete.

---

## 3. Project Architecture & Directory Map

Routes and project code live in the root folders (there is **no** `src/` directory):

```
YTuzo/
├── app/                        # Expo Router file-based routes & API routes
│   ├── _layout.tsx             # Root layout: splash animation, SQLiteProvider, DarkTheme
│   ├── (tabs)/                 # Bottom tab navigator group
│   │   ├── _layout.tsx         # Tab layout embedding FloatingTabBar
│   │   ├── index.tsx           # Home Dashboard (Executive Summary, Quick Actions, Activity)
│   │   ├── finance.tsx         # Finance Hub (Overview, Transactions, Scheduled, Budgets)
│   │   ├── english/            # English Mastery Hub (Dashboard & Dictionary)
│   │   │   ├── index.tsx       # English hub dashboard & category picker
│   │   │   └── dictionary.tsx  # Master dictionary lookup, search, and vocab progress
│   │   ├── sports.tsx          # Sports & Fitness tracker (scaffolded)
│   │   ├── vehicle.tsx         # Vehicle odometer & fuel efficiency (scaffolded)
│   │   └── settings.tsx        # App settings, profile, neon switches, sync engine
│   ├── api/                    # Expo Router Server API Routes (output: "server")
│   │   ├── sync+api.ts         # Two-way sync endpoint for SQLite <-> PostgreSQL
│   │   ├── init-db+api.ts      # Cloud database schema initializer
│   │   └── enrich-word+api.ts  # Vocabulary enrichment endpoint
│   └── modules.tsx             # Full grid view for all core modules
├── assets/                     # Fonts, app icons, and bundled database assets
│   ├── fonts/                  # Custom typography (SpaceMono, etc.)
│   └── dictionary.db           # Bundled offline master dictionary
├── components/                 # Modular, reusable UI components by domain
│   ├── dashboard/              # Home screen widgets (SummaryCard, QuickActions, etc.)
│   ├── english/                # Vocab modals and word practice components
│   ├── finance/                # Finance tabs, forms, modals, and financeStyles.ts
│   ├── navigation/             # FloatingTabBar and bottom bar components
│   └── ui/                     # Primitives (TouchableScale, CalendarPicker, EmptyState)
├── constants/                  # System design tokens & defaults
│   ├── Colors.ts               # Cyber-Zen color palette & themes
│   └── defaults.ts             # Default wallet IDs, category IDs, constants
├── database/                   # Local database engine & seed scripts
│   ├── db.ts                   # SQLite migration runner (migrateDbIfNeeded)
│   └── seed.ts                 # Initial data seeding for wallets, categories, dictionary
├── hooks/                      # Custom React hooks (business logic separation)
│   ├── useFinanceData.ts       # Finance transactions, wallets, budgets, categories
│   ├── useSyncEngine.ts        # Client-side synchronization engine
│   └── useVocab.ts             # English vocabulary queries & progress state
├── server/                     # Backend connection handlers
│   └── db.ts                   # PostgreSQL connection pool (pg.Pool)
├── types/                      # TypeScript definitions (finance.ts, etc.)
├── utils/                      # Pure helper utilities
│   ├── finance.ts              # Currency formatting (IDR) & color alpha helpers
│   └── scheduler.ts            # Scheduled/recurring transaction automated processor
├── app.json                    # Expo configuration & plugins
└── metro.config.js             # Metro config (supports bundling .db assets)
```

---

## 4. Routing & Navigation Rules

1. **Expo Router**:
   - File-based routing exclusively inside `app/`.
   - Modals and screens must be registered in their respective `_layout.tsx`.
   - Use `router` from `expo-router` for imperative navigation (`router.push`, `router.back`, `router.setParams`).
   - Use `useLocalSearchParams` to read navigation parameters.
2. **Tab Bar Structure**:
   - Tabs use a custom `FloatingTabBar` (`components/navigation/FloatingTabBar.tsx`).
   - Screens with `href: null` in `(tabs)/_layout.tsx` (like `finance`, `sports`, `vehicle`) are rendered inside the tab context but opened via contextual actions or the central FAB.
3. **API Routes**:
   - API endpoints use the `+api.ts` file suffix (e.g., `app/api/sync+api.ts`).
   - Export standard HTTP handlers (`GET`, `POST`, `PUT`, `DELETE`).
   - Metro config has `output: "server"` enabled in `app.json`.

---

## 5. Offline-First Database & Cloud Sync Protocol

YTuzo is strictly **Offline-First**. The app must function seamlessly without an active internet connection.

### Local Storage (`expo-sqlite`)
- Managed by `SQLiteProvider` in `app/_layout.tsx` with database name `ytuzo_clean_v2.db`.
- Always enable WAL mode and foreign keys:
  ```sql
  PRAGMA journal_mode = 'wal';
  PRAGMA foreign_keys = ON;
  ```
- All schema changes must be versioned in `database/db.ts` using `PRAGMA user_version`. Never mutate schema ad-hoc.
- Bundled database assets (`assets/dictionary.db`) are attached during initial migration (`ATTACH DATABASE ... AS dict_db;`) to inject bulk dictionary data.
- Recurring transactions are automatically evaluated on app launch via `utils/scheduler.ts` using `withExclusiveTransactionAsync`.

### Cloud Synchronization (`sync_status`)
- All core log tables (`finance_logs`, `sport_logs`, `fuel_logs`, `master_dictionary`, `user_vocab_progress`) have a `sync_status` integer column:
  - `0`: Local only / Pending sync to cloud.
  - `1`: Successfully synced to PostgreSQL.
- Two-way background synchronization is triggered via `useSyncEngine.ts` targeting `POST /api/sync`.
- When modifying database records locally, always set `sync_status = 0` and update `updated_at`.

---

## 6. Design System: "Cyber-Zen" / "Neon Zest"

Never produce dull, generic, light-mode-default UIs. YTuzo has a distinctive visual language:

- **Color Tokens** (Always import from `constants/Colors.ts`):
  - Primary Background: `Colors.background.primary` (`#09090B`, Zinc 950)
  - Secondary Background: `Colors.background.secondary` (`#18181B`, Zinc 900)
  - Card Glass: `Colors.background.card` (`rgba(39, 39, 42, 0.7)`)
  - Yuzu Yellow (Hero Brand): `Colors.brand.yuzu` (`#FACC15`)
  - Blaze Orange: `Colors.brand.blaze` (`#F97316`)
  - Ruby / Alert: `Colors.brand.ruby` (`#F43F5E`)
  - Mint / Success: `Colors.brand.mint` (`#10B981`)
- **Typography & Layout**:
  - OLED-friendly deep contrast.
  - Monospace accents (`SpaceMono`) for numbers, tickers, and financial amounts.
  - Currency amounts formatted using `formatMoney(amount)` in `utils/finance.ts` (`id-ID`, `IDR`).
- **Micro-Interactions & Haptics**:
  - Wrap interactive elements in `TouchableScale` (`components/ui/TouchableScale.tsx`) for tactile feedback.
  - Use `expo-haptics` (`Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)`) on key button taps and confirmations.
  - Implement fluid entrance/exit animations with `react-native-reanimated`.
- **Icon Strategy**:
  - Prefer `SymbolView` from `expo-symbols` for native SF Symbols, with fallback to `Ionicons` from `@expo/vector-icons`.

---

## 7. Native Builds & Continuous Native Generation (CNG)

- Do **not** manually create or alter `ios/` or `android/` folders. They are generated via Expo Prebuild (Continuous Native Generation).
- Native configurations, permissions, and splash screen settings belong strictly in `app.json` or config plugins.
- For EAS builds, use `npx.cmd eas-cli@latest <command>`.

---

## 8. Definition of Done Checklist for Agents

Before completing any task, ensure:
1. `npm.cmd run lint` passes without errors.
2. `npx.cmd -p typescript tsc --noEmit` passes without type errors.
3. Path imports use the standard project paths or `@/*` aliases (`tsconfig.json`).
4. Any new database table or column includes `sync_status` and a corresponding migration step in `database/db.ts`.
5. Screen and modal layouts account for safe area insets via `useSafeAreaInsets()`.
6. Cyber-Zen styling and dark theme tokens from `constants/Colors.ts` are strictly honored.
