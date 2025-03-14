# Security & Row Level Security (RLS)

## Overview

Vector Elegans implements comprehensive Row Level Security (RLS) using Supabase Auth 2025 best practices, ensuring data access control at the database level.

## RLS Policies

### Users Table

```sql
-- superAdmin access
CREATE POLICY "superadmin_all_users" ON users
  FOR ALL USING (get_user_role() = 'superAdmin')
  WITH CHECK (get_user_role() = 'superAdmin');

-- admin read access
CREATE POLICY "admin_read_users" ON users
  FOR SELECT USING (get_user_role() = 'admin');

-- users read own profile
CREATE POLICY "users_read_own" ON users
  FOR SELECT USING (auth.uid() = id);
```

### Rides Table

```sql
-- client policies
CREATE POLICY "client_read_own_rides" ON rides
  FOR SELECT USING (
    get_user_role() = 'client' 
    AND user_id = auth.uid()
  );

CREATE POLICY "client_create_rides" ON rides
  FOR INSERT WITH CHECK (
    get_user_role() = 'client' 
    AND user_id = auth.uid()
  );

-- driver policies
CREATE POLICY "driver_read_assigned_rides" ON rides
  FOR SELECT USING (
    get_user_role() = 'driver'
    AND driver_id IN (SELECT id FROM drivers WHERE user_id = auth.uid())
  );
```

## Role Access Matrix

| Resource    | superAdmin | admin | driver | client |
|------------|------------|--------|---------|---------|
| users      | CRUD       | R      | Own     | Own     |
| vehicles   | CRUD       | CRUD   | Own     | R       |
| drivers    | CRUD       | CRUD   | Own     | R       |
| rides      | CRUD       | CRUD   | Assigned| Own     |
| rates      | CRUD       | CRUD   | R       | R       |
| promotions | CRUD       | CRUD   | -       | Use     |

## Implementation Details

1. **Helper Functions**:
```sql
-- Get user role securely
CREATE OR REPLACE FUNCTION get_user_role()
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT role FROM users 
    WHERE id = auth.uid()
  );
END;
$$ language plpgsql security definer;
```

2. **Default Deny**:
```sql
-- Add default deny policy to all tables
CREATE POLICY "default_deny" ON table_name
  FOR ALL USING (false)
  WITH CHECK (false);
```

3. **View Access**:
```sql
-- Secure view for user profiles
CREATE VIEW user_profiles AS
SELECT 
  u.id,
  au.email,
  u.role,
  u.created_at,
  u.updated_at
FROM users u
JOIN auth.users au ON au.id = u.id;
```

## Security Best Practices

1. **Data Sanitization**:
   - Input validation at application level
   - SQL injection prevention through parameterized queries
   - XSS prevention through content sanitization

2. **Access Control**:
   - JWT validation
   - Role-based access control
   - Resource-level permissions

3. **Error Handling**:
   - Secure error messages
   - Logging of security events
   - Rate limiting

## Testing Security

1. **Policy Tests**:
```sql
-- Test as client
SET ROLE authenticated;
SET LOCAL request.jwt.claim.sub = 'client-user-id';
SELECT * FROM rides; -- Should only show own rides
```

2. **Application Tests**:
```typescript
describe('Security', () => {
  it('prevents access to other users data', async () => {
    const { error } = await supabase
      .from('rides')
      .select('*')
      .neq('user_id', currentUserId);
    
    expect(error).toBeDefined();
  });
});
```

## Maintaining Security

1. **Regular Audits**:
   - Review RLS policies
   - Check access patterns
   - Monitor security logs

2. **Updates**:
   - Keep Supabase updated
   - Review security patches
   - Update security policies

3. **Monitoring**:
   - Track failed access attempts
   - Monitor unusual patterns
   - Log security events

## Security Checklist

- [ ] RLS enabled on all tables
- [ ] Default deny policies in place
- [ ] Role-specific policies implemented
- [ ] Helper functions are SECURITY DEFINER
- [ ] Views properly secured
- [ ] Audit logging enabled
- [ ] Error handling sanitized
- [ ] Access monitoring configured
- [ ] Regular security tests passing
