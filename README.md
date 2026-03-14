# Engineering Analytics Platform — Frontend

## Tech Stack
- **React 18** + **TypeScript** (strict)
- **Vite** — dev server + bundler
- **React Router v6** — routing + URL filter state
- **TanStack Query** — server state, caching
- **TanStack Virtual** — virtualised table (handles 50k+ rows)
- **Zustand** — client UI state (filters, theme, settings)
- **Recharts** — bar chart, donut chart
- **D3** — activity heatmap
- **react-hot-toast** — notifications
- **CSS Modules** — component-scoped styles, no Tailwind

---

## Getting Started

### 1. Install dependencies
```bash
cd frontend
npm install
```

### 2. Run WITHOUT backend (uses dummy data)
```bash
# .env.local already has VITE_USE_MOCK=true
npm run dev
```
Opens at http://localhost:3000 with mock Jira data.

### 3. Run WITH backend
```bash
# Edit .env.local
VITE_USE_MOCK=false

# Start backend first
cd ../backend
python3 -m uvicorn main:app --reload --port 8000

# Then start frontend
cd ../frontend
npm run dev
```

---

## Project Structure

```
src/
├── app/                  # App shell, router
├── features/             # Feature-first (colocation)
│   ├── dashboard/        # KPIs, charts, heatmap
│   ├── tickets/          # Virtualised table + AI search
│   ├── team/             # Engineer grid
│   ├── export/           # Report builder
│   └── settings/         # Jira config + theme picker
├── components/
│   ├── layout/           # Topbar, Sidebar, AppShell
│   ├── ui/               # Badge, Skeleton, EmptyState
│   └── charts/           # Shared chart components
├── store/                # Zustand slices
├── services/             # API layer (axios)
├── hooks/                # useDebounce, useURLFilters
├── config/               # themes.ts, queryKeys.ts
├── types/                # All TypeScript types
├── utils/                # formatters, aiParser, dummyData
└── styles/               # globals.css, components.css
```

---

## Theming

The design system uses CSS custom properties. Switch accent color by setting `data-theme` on `<html>`:

```
default  → Cobalt  #4F7EFF
emerald  → Emerald #10B981
violet   → Violet  #8B5CF6
rose     → Rose    #F43F5E
```

Light mode: set `data-mode="light"` on `<html>`.

Both are controlled from Settings → Appearance and persisted in `localStorage`.

---

## Scripts
```bash
npm run dev      # Start dev server
npm run build    # TypeScript check + production build
npm run preview  # Preview production build
npm run test     # Run Vitest tests
npm run lint     # ESLint
```
