# Authentication System Migration - March 2025

## Major Changes

### 1. Migrated to @supabase/ssr
- Replaced client-side auth helpers with server-side components
- Improved security by moving auth logic to the server
- Better integration with Next.js App Router

### 2. Native PostgreSQL Roles
- Moved from custom role management to native PostgreSQL roles
- Roles structure:
  - `app_super_admin`: Full system access
  - `app_admin`: Administrative access
  - `app_driver`: Driver-specific access
  - `app_customer`: Basic user access
- Simplified RLS policies using native role checks

### 3. Server Components Integration
- Authentication checks performed server-side
- Middleware enhanced for role-based route protection
- Session management through server components

## New Architecture

### Core Components

1. **Server Authentication Client** (`src/lib/auth/server.ts`):
```typescript
export function createServerClient(cookieStore?: CookieStore) {
  return createSupabaseServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) { /* ... */ },
        set(name: string, value: string, options: CookieOptions) { /* ... */ },
        remove(name: string, options: CookieOptions) { /* ... */ }
      }
    }
  )
}
```

2. **Role Validation** (`src/lib/types/auth.types.ts`):
```typescript
export const hasAdminAccess = (role?: string): boolean => {
  return role === 'app_super_admin' || role === 'app_admin';
}

export const hasSuperAdminAccess = (role?: string): boolean => {
  return role === 'app_super_admin';
}
```

3. **Middleware Protection** (`src/middleware.ts`):
```typescript
// Protected routes check
if (requestUrl.pathname.startsWith('/backoffice')) {
  if (!hasAdminAccess(session.user.role)) {
    return NextResponse.redirect(new URL('/auth/admin-login?error=insufficient_permissions', request.url));
  }
}
```

## Security Improvements

1. **Cookie Security**:
- HttpOnly cookies for session management
- Secure flag in production
- SameSite=Lax policy

2. **Role-Based Security**:
- Direct PostgreSQL role checks
- No reliance on JWT claims or metadata
- Simplified RLS policies

3. **Server-Side Validation**:
- Session checks performed server-side
- Protected routes enforced through middleware
- No client-side role spoofing possible

## Deprecated Components

The following files are now deprecated and should be removed:

```
src/utils/supabase/server.ts
src/utils/supabase/client.ts
src/lib/services/authService.ts
src/lib/services/roleService.ts
src/lib/auth/roles.ts
src/utils/auth/roles.ts
src/utils/auth/guards.ts
```

## Migration Guide

1. Replace client-side auth with server components:
```typescript
// Old (client-side)
const { data: { user } } = await supabase.auth.getUser()

// New (server-side)
const cookieStore = cookies()
const user = await getAuthenticatedUser(cookieStore)
```

2. Update role checks:
```typescript
// Old
if (isAdmin(user))

// New
if (hasAdminAccess(user.role))
```

3. Protected routes:
```typescript
// Use middleware for route protection
export const config = {
  matcher: [
    '/auth/:path*',
    '/backoffice/:path*',
    '/account/:path*',
  ]
}
```

## Best Practices

1. Always use server components for authentication logic
2. Rely on native PostgreSQL roles instead of custom role management
3. Use middleware for route protection
4. Keep auth logic in dedicated authentication modules
5. Implement proper error handling for auth failures
