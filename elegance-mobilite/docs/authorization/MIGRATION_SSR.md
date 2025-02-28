# Migration Guide: @supabase/auth-helpers-nextjs to @supabase/ssr

This guide outlines the steps to migrate from the deprecated @supabase/auth-helpers-nextjs package to the new @supabase/ssr package.

## Key Changes

1. Package Installation:
```bash
npm uninstall @supabase/auth-helpers-nextjs
npm install @supabase/ssr
```

2. Client-side Changes:
```typescript
// Old
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"

// New
import { createBrowserClient } from "@supabase/ssr"

const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

3. Server-side Changes:
```typescript
// Old
import { createServerComponentClient } from "@supabase/auth-helpers-nextjs"

// New
import { createServerClient } from "@supabase/ssr"

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

4. Middleware Changes:
```typescript
// Old
import { createMiddlewareClient } from "@supabase/auth-helpers-nextjs"

// New
import { createServerClient } from "@supabase/ssr"

const supabase = createServerClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return request.cookies.get(name)?.value
      },
      set(name: string, value: string, options: CookieOptions) {
        // Update both request and response
      },
      remove(name: string, options: CookieOptions) {
        // Update both request and response
      },
    },
  }
)
```

## Files to Update

1. \`src/lib/supabaseClient.ts\`: Update client creation
2. \`middleware.ts\`: Update middleware authentication
3. \`src/app/layout.tsx\`: Update server-side session handling
4. \`src/providers/ClientProviders.tsx\`: Update client-side auth context
5. Any components using Supabase client directly

## Key Considerations

1. **Cookie Handling**:
   - The new package requires explicit cookie handling
   - Both request and response cookies need to be updated in middleware

2. **Type Safety**:
   - Continue using Database types for type safety
   - Auth types remain mostly the same

3. **Session Management**:
   - Session handling is similar but with slightly different API
   - Cookie-based session management is more explicit

4. **Error Handling**:
   - Error types and handling remain similar
   - Consider updating error messages for consistency

## Best Practices

1. Use \`createBrowserClient\` for client-side operations
2. Use \`createServerClient\` for server-side operations
3. Maintain proper type safety with Database types
4. Handle cookies properly in middleware
5. Update error handling to match new patterns
6. Test authentication flows thoroughly after migration

## Testing the Migration

1. Test login/logout flows
2. Verify protected routes
3. Check role-based access control
4. Validate session persistence
5. Test error handling
6. Verify cookie management

## Common Issues

1. **Cookie Handling**:
   - Ensure middleware properly handles both request and response cookies
   - Check cookie options are correctly set

2. **Type Errors**:
   - Update type imports if needed
   - Verify Database types are properly used

3. **Session Management**:
   - Verify session refresh works correctly
   - Check session persistence across pages

## Additional Resources

- [Official Supabase SSR Documentation](https://supabase.com/docs)
- [Next.js 14 Server Components](https://nextjs.org/docs/getting-started/react-essentials#server-components)
- [Cookie Management in Next.js](https://nextjs.org/docs/app/api-reference/functions/cookies)
