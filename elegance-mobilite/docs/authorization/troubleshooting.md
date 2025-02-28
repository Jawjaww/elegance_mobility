# Authentication Troubleshooting Guide

This guide helps resolve common authentication issues, especially those related to the @supabase/ssr package.

## Common Issues

### 1. Session Not Persisting

**Symptom**: User needs to log in again after page refresh

**Solutions**:
```typescript
// 1. Check cookie handling in middleware
const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // Ensure both request and response cookies are set
        request.cookies.set({ name, value, ...options })
        response.cookies.set({ name, value, ...options })
      }
    }
  }
)

// 2. Verify session refresh in ClientProviders
useEffect(() => {
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange((event, currentSession) => {
    if (currentSession?.user) {
      setSession(currentSession)
    }
  })

  return () => subscription.unsubscribe()
}, [supabase])
```

### 2. Role-Based Access Issues

**Symptom**: Users can access restricted routes despite role restrictions

**Solutions**:
```typescript
// 1. Check middleware role verification
if (request.nextUrl.pathname.startsWith("/admin")) {
  const { data: profile } = await supabase
    .from("users")
    .select("role")
    .eq("id", user.id)
    .single()

  if (!profile || profile.role !== "admin") {
    return NextResponse.redirect(new URL("/", request.url))
  }
}

// 2. Verify client-side role checks
const { data: profile } = await supabase
  .from("users")
  .select("role")
  .eq("id", session.user.id)
  .single()

if (profile?.role !== "admin") {
  router.push("/")
}
```

### 3. Cookie Handling Errors

**Symptom**: Authentication state inconsistent between pages

**Solutions**:
1. Ensure secure cookie settings:
```typescript
cookies.set({
  name,
  value,
  path: "/",
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax"
})
```

2. Check cookie domain configuration:
```typescript
// In .env
NEXT_PUBLIC_COOKIE_DOMAIN=your-domain.com
```

### 4. Type Errors with SSR

**Symptom**: TypeScript errors with Supabase client

**Solutions**:
```typescript
// 1. Proper type imports
import { createBrowserClient, createServerClient } from "@supabase/ssr"
import type { Database } from "@/lib/database.types"

// 2. Type-safe client creation
const supabase = createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

### 5. Server Component Issues

**Symptom**: Authentication not working in server components

**Solutions**:
```typescript
// 1. Use createServerClient in server components
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

async function ServerComponent() {
  const cookieStore = cookies()
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
      },
    }
  )
  
  const { data } = await supabase.auth.getSession()
  // ...
}
```

## Debugging Steps

1. **Check Environment Variables**:
```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

2. **Verify Cookie Settings**:
- Check secure flag
- Verify domain settings
- Confirm path configuration

3. **Authentication Flow**:
- Monitor network requests
- Check console errors
- Verify redirects

4. **Role Verification**:
- Check database queries
- Verify middleware execution
- Test role-based redirects

## Common Error Messages

1. "Failed to get user session":
- Check cookie configuration
- Verify Supabase URL and key
- Check network connectivity

2. "Invalid JWT":
- Session expired
- Cookie not set properly
- Token manipulation attempt

3. "Role not found":
- Database query issue
- Missing user profile
- Incorrect role assignment

## Performance Optimization

1. **Reduce Authentication Calls**:
```typescript
// Cache session checks
const sessionCache = new Map()

function getCachedSession(userId: string) {
  if (sessionCache.has(userId)) {
    return sessionCache.get(userId)
  }
  // Fetch and cache session
}
```

2. **Optimize Role Checks**:
```typescript
// Batch role checks
const roles = await supabase
  .from("users")
  .select("id, role")
  .in("id", userIds)
```

## Security Best Practices

1. Always use HTTPS
2. Implement proper CORS settings
3. Set secure cookie flags
4. Use environment variables
5. Validate user input
6. Implement rate limiting
7. Monitor auth attempts

## Support Resources

1. [Supabase SSR Documentation](https://supabase.com/docs)
2. [Next.js Authentication Docs](https://nextjs.org/docs/authentication)
3. [Security Guidelines](./SECURITY.md)
4. [Migration Guide](./MIGRATION_SSR.md)
