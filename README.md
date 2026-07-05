# Vevhu Management Dashboard

[![Download Field App APK](https://img.shields.io/badge/Download_Mobile_APK-Latest-orange?style=for-the-badge&logo=android)](https://vevhu-dashboard.vercel.app/downloads/vevhu-mobile-latest.apk)

> 📱 **Field Worker Android APK Download:** [vevhu-mobile-latest.apk (124 MB)](https://vevhu-dashboard.vercel.app/downloads/vevhu-mobile-latest.apk)

Vevhu Management Dashboard for real estate verification, property urbanization auditing, stand mapping, and field worker monitoring.

## Tech Stack

- **Framework:** Next.js (App Router)
- **Database & Auth:** Supabase (Postgres, Row Level Security, Realtime, Storage)
- **Offline Data Sync Engine:** PowerSync Sync Service
- **UI Components:** TailwindCSS, Radix UI, Lucide Icons

## Getting Started

First, run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Downloads & Distribution

The latest compiled production Android APK for field workers is hosted on Vercel:
- **Download URL:** https://vevhu-dashboard.vercel.app/downloads/vevhu-mobile-latest.apk

> **Note:** The APK is served directly via Vercel (not GitHub), as it exceeds GitHub's 100MB file size limit.
> After building a new APK, copy it to `public/downloads/vevhu-mobile-latest.apk` and run `vercel --prod` to publish.
