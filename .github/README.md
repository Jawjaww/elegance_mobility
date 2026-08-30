# GitHub Actions — branch protection (manual)

After the first successful CI run, enable on **Settings → Branches → main**:

- Require status checks: **Build & typecheck**, **Unit tests**
- (Optional) Require pull request before merging

Vercel deploys via Git integration after merge; CI prevents broken builds from reaching `main`.
