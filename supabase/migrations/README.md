# Migrations — not in this repo

**Source of truth:** [`Jawjaww/infra-supabase`](https://github.com/Jawjaww/infra-supabase) → `supabase/migrations/`

Do not add SQL migration files here. Cloud deploy is GitOps on `infra-supabase` (`deploy-db.yml`).

## Local schema + types

From the workspace sibling folder:

```bash
cd ../infra-supabase
./scripts/prepare-db-change.sh   # db reset + gen-types + pgTAP
```

Types are synced into this app at `src/lib/types/database.types.ts` (and legacy `supabase/src/types/supabase.ts`).
