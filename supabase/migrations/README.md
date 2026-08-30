# Deprecated — do not edit

Schema migrations live in **`Jawjaww/infra-supabase`** (`supabase/migrations/`).

This folder is a stale copy kept for historical reference only. Changes here are **not** deployed.

**Workflow:**
1. Add migration in `infra-supabase`
2. Run `./scripts/prepare-db-change.sh` locally
3. Open PR → CI pgTAP + types-check
4. Merge `main` → `infra-supabase` GitHub Action runs `supabase db push` on cloud

See [infra-supabase README](https://github.com/Jawjaww/infra-supabase).
