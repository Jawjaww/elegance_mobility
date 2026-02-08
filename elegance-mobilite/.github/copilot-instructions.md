Project: Migration to Tauri Static Export (Next.js 15)

## Mandatory Instructions for Code Reviews and Suggestions:

1. **Zero Server Logic**: 
      - Remove all dependencies on `cookies()` and `headers()`.
      - Ensure no server-only modules are imported.

2. **Client-side Storage**: 
      - Use Supabase client-side only.
      - Force persistence using `localStorage`.

3. **API Migration**: 
      - Identify all `route.ts` files in `/api` folders.
      - Do NOT fix them as API routes.
      - Extract their logic into client-side service functions (e.g., in `src/services/`).
      - Replace all `fetch('/api/...')` calls in components with direct imports and calls to these new services.

4. **Client Components**: 
      - Automatically add the `'use client'` directive to any component using hooks, interactivity, or browser-specific APIs.

5. **Next.js 15 Breaking Changes**: 
      - Treat `params` and `searchParams` as Promises in `Page` and `Layout` components.
      - Example: Use `const { id } = await params;`.

## GitOps & Database Workflow

- **GitOps Mode**: We use Supabase CLI for all database changes.
- **Migrations**: Database changes MUST be suggested as new SQL files in `supabase/migrations/`. 
- **CI/CD Integration**: We have a GitHub Action for automated migrations using `supabase db push`. Ensure all SQL is compatible with non-interactive execution.
- **No Dashboard**: Never suggest manual changes via the Supabase Dashboard.
