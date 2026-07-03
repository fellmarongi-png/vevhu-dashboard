# Vevhu Dashboard — CLAUDE.md

## Project Overview
Manager dashboard for the Vevhu field data collection app. Built with Next.js 16 App Router, Supabase for auth and data, and shadcn/ui components.

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16.x (App Router, Turbopack) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS v4 + shadcn/ui (nova style) |
| Auth & DB | Supabase (SSR cookies via @supabase/ssr) |
| Tables | @tanstack/react-table |
| Charts | recharts + shadcn chart primitives |
| Maps | react-map-gl + maplibre-gl (free, no API key) |
| Storage | Supabase Storage (bucket: vevhu-media) |
| Export | xlsx + exceljs |
| Drag & Drop | @dnd-kit/core, @dnd-kit/sortable |
| Forms | react-hook-form + @hookform/resolvers + zod |
| Theming | next-themes (light/dark/system) |
| Date utils | date-fns |

## File Structure

```
vevhu-dashboard/
├── app/
│   ├── layout.tsx              # Root layout — ThemeProvider + TooltipProvider + fonts
│   ├── globals.css             # Tailwind base + shadcn CSS variables
│   ├── login/
│   │   └── page.tsx            # Email+password login form (client component)
│   └── dashboard/
│       ├── layout.tsx          # Dashboard shell — SidebarProvider + AppSidebar + DashboardTopbar
│       └── page.tsx            # Overview page with KPI cards
├── components/
│   ├── app-sidebar.tsx         # Sidebar nav using shadcn Sidebar primitive
│   ├── dashboard-topbar.tsx    # Topbar with sidebar trigger + theme toggle + avatar
│   ├── theme-provider.tsx      # Thin wrapper around next-themes ThemeProvider
│   └── ui/                     # shadcn/ui auto-generated components
├── lib/
│   ├── utils.ts                # shadcn cn() utility
│   └── supabase/
│       ├── client.ts           # createBrowserClient (use in client components)
│       └── server.ts           # createServerSupabaseClient (use in server components/actions)
├── hooks/
│   └── use-mobile.ts           # Responsive hook from shadcn
├── proxy.ts                 # Auth guard (Next.js 16: proxy replaces middleware) — redirects /dashboard/* if not logged in
├── .env.local                  # Environment variables (not committed)
├── components.json             # shadcn/ui config
└── CLAUDE.md                   # This file
```

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL        Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY   Supabase anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY       Supabase service role (server-only, never expose)
NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET  Supabase Storage bucket (default: vevhu-media)
```

## Key Conventions

- **Path alias**: `@/` maps to the project root (e.g. `@/lib/supabase/client`)
- **Auth**: All `/dashboard/*` routes are protected by `middleware.ts`. Use `createServerSupabaseClient()` in Server Components and `createClient()` in Client Components.
- **Components**: Prefer shadcn/ui primitives from `@/components/ui/`. Add new shadcn components with `npx shadcn@latest add <name>`.
- **Theming**: Dark/light toggle is in `DashboardTopbar`. Theme state persists via next-themes.
- **Data fetching**: Use Server Components + Supabase server client for initial loads. Use client components + SWR/React Query for real-time or interactive data.

## Development

```bash
npm run dev       # Start dev server (Turbopack)
npm run build     # Production build
npm run lint      # ESLint
```

## Adding New Dashboard Pages

1. Create `app/dashboard/<section>/page.tsx`
2. Add nav entry in `components/app-sidebar.tsx` navItems array
3. Fetch data with `createServerSupabaseClient()` at top of page (Server Component)
