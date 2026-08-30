# Project: Migration to Tauri Static Export (Next.js 15)

## 🚨 Critical Constraint: Mobile Target (Android/iOS)

- **Target**: This application is strictly for **Mobile (APK/IPA)** via Tauri.
- **No Node.js Server**: Mobile environments cannot run a Node.js server.
- **Mandatory Static Export**: `output: 'export'` is non-negotiable.
- **Reject Standalone Mode**: Never suggest "standalone" mode, SSR, or Node sidecars. All logic must be compatible with a static webview.

## Mandatory Instructions for Code Reviews and Suggestions:

1. **Zero Server Logic**:
   - Remove all dependencies on `cookies()` and `headers()`.
   - Ensure no server-only modules are imported.
   - Replace any server-side authentication checks with client-side logic (e.g., `useEffect` or Auth Guards).

2. **Client-side Storage**:
   - Use Supabase client-side only.
   - Force session persistence using `localStorage`.

3. **API Migration**:
   - Identify all `route.ts` files in `/api/` folders.
   - **Do NOT fix them as API routes**.
   - **Action**: Extract their logic into client-side service functions (e.g., in `src/services/`).
   - Replace all `fetch('/api/...')` calls with direct imports and calls to these new services.

4. **Client Components**:
   - Automatically add the `'use client'` directive to any component using hooks, interactivity, or browser-specific APIs.

5. **Next.js 15 Breaking Changes**:
   - Treat `params` and `searchParams` as Promises in `Page` and `Layout` components.
   - Example: `const { id } = await params;`.

## GitOps & Database Workflow

- **Schema source of truth:** [`infra-supabase`](https://github.com/Jawjaww/infra-supabase) (`supabase/migrations/`). Do **not** add migrations in this repo.
- **Local prep:** `cd ../infra-supabase && ./scripts/prepare-db-change.sh`
- **Types:** synced copies in `src/lib/types/database.types.ts` — regenerate via `infra-supabase/scripts/gen-types.sh`
- **Cloud deploy:** merge migration on `infra-supabase` `main` → GitHub Action `deploy-db.yml` (no manual `db push` here)
- **No Dashboard:** never suggest manual schema changes via the Supabase Dashboard
