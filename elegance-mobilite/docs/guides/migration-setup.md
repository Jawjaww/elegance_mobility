# Migration Setup Guide: @supabase/ssr

This guide walks you through setting up the new @supabase/ssr package in your Élégance Mobilité project.

## Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher
- Next.js 14.x

## Installation Steps

1. **Remove old packages**:
```bash
npm uninstall @supabase/auth-helpers-nextjs
```

2. **Install new packages**:
```bash
npm install @supabase/ssr @supabase/supabase-js
```

3. **Environment Variables**:
Verify your `.env.local` has the required variables:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

## File Updates

1. **Update middleware.ts**:
```typescript
import { createServerClient } from "@supabase/ssr"
// ... update middleware implementation
```

2. **Update supabaseClient.ts**:
```typescript
import { createBrowserClient } from "@supabase/ssr"
// ... update client creation
```

3. **Update layout files**:
```typescript
import { createServerClient } from "@supabase/ssr"
// ... update session handling
```

## Type Safety

1. **Verify Database Types**:
```typescript
import { Database } from "@/lib/database.types"

const supabase = createServerClient<Database>(
  // ... configuration
)
```

2. **Update Auth Types**:
```typescript
import { Session, User } from "@supabase/supabase-js"
// ... use updated types
```

## Cookie Handling

1. **Server Components**:
```typescript
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
```

2. **Middleware**:
```typescript
cookies: {
  get(name: string) {
    return request.cookies.get(name)?.value
  },
  set(name: string, value: string, options: CookieOptions) {
    request.cookies.set({ name, value, ...options })
    response.cookies.set({ name, value, ...options })
  },
  remove(name: string, options: CookieOptions) {
    request.cookies.set({ name, value: "", ...options })
    response.cookies.set({ name, value: "", ...options })
  },
}
```

## Authentication Updates

1. **Client-side Auth**:
```typescript
const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Login
const { data, error } = await supabase.auth.signInWithPassword({
  email,
  password,
})

// Logout
await supabase.auth.signOut()
```

2. **Server-side Auth**:
```typescript
const { data: { session } } = await supabase.auth.getSession()
```

## Testing Changes

1. **Auth Flow Testing**:
- Test login
- Test session persistence
- Test logout
- Test protected routes

2. **Role Verification**:
- Test admin access
- Test driver access
- Test unauthorized access

## Common Issues

1. **Session Not Persisting**:
- Verify cookie handling in middleware
- Check session refresh logic
- Verify cookie domain settings

2. **Type Errors**:
- Update type imports
- Verify Database type usage
- Check auth type declarations

## Performance Considerations

1. **Client-side**:
- Use proper error boundaries
- Implement loading states
- Handle auth state changes efficiently

2. **Server-side**:
- Cache responses where appropriate
- Handle errors gracefully
- Use proper revalidation strategies

## Security Checklist

1. **Authentication**:
- ☐ Secure session handling
- ☐ Proper role verification
- ☐ Protected route guards

2. **Cookie Security**:
- ☐ HttpOnly flags
- ☐ Secure flags in production
- ☐ Proper domain configuration

3. **Error Handling**:
- ☐ No sensitive info in errors
- ☐ Proper client messages
- ☐ Server-side logging

## Next Steps

1. Review the [Migration Guide](../authorization/MIGRATION_SSR.md)
2. Check [Security Guidelines](../authorization/SECURITY.md)
3. Update related documentation
4. Run full test suite
5. Deploy changes gradually

## Support

If you encounter issues:
1. Check troubleshooting guide
2. Review error logs
3. Contact the development team

## Additional Resources

- [Supabase SSR Documentation](https://supabase.com/docs)
- [Next.js 14 Documentation](https://nextjs.org/docs)
- [Authentication Architecture](../authorization/ARCHITECTURE.md)
