import {
  ALL_ROLES,
  formatRoleName,
  isAdmin,
  isDriver,
  isOperator,
  canAccessAdminPortal,
  canAccessOperatorPortal,
  canAcceptRides,
  canAccessClientPortal,
  canCreateRides,
  getEffectiveRole,
  ROLES,
} from '@/lib/utils/roles'

describe('roles helpers', () => {
  it('detects admin and super admin', () => {
    expect(isAdmin(ROLES.ADMIN)).toBe(true)
    expect(isAdmin(ROLES.SUPER_ADMIN)).toBe(true)
    expect(isAdmin(ROLES.DRIVER)).toBe(false)
    expect(canAccessAdminPortal(ROLES.ADMIN)).toBe(true)
  })

  it('detects driver ride accept permission', () => {
    expect(isDriver(ROLES.DRIVER)).toBe(true)
    expect(canAcceptRides(ROLES.DRIVER)).toBe(true)
    expect(canAcceptRides(ROLES.CUSTOMER)).toBe(false)
  })

  it('defaults missing role to customer', () => {
    expect(getEffectiveRole(null)).toBe(ROLES.CUSTOMER)
    expect(canAccessClientPortal(null)).toBe(true)
  })

  it('grants drivers full client portal and booking rights', () => {
    expect(canAccessClientPortal(ROLES.DRIVER)).toBe(true)
    expect(canCreateRides(ROLES.DRIVER)).toBe(true)
    expect(canAccessClientPortal(ROLES.CUSTOMER)).toBe(true)
    expect(canCreateRides(ROLES.CUSTOMER)).toBe(true)
    expect(canAccessClientPortal(ROLES.ADMIN)).toBe(true)
  })

  it('detects the fleet operator role', () => {
    expect(isOperator(ROLES.OPERATOR)).toBe(true)
    expect(canAccessOperatorPortal(ROLES.OPERATOR)).toBe(true)
    expect(isOperator(ROLES.ADMIN)).toBe(false)
    expect(isOperator(ROLES.DRIVER)).toBe(false)
    expect(isOperator(ROLES.CUSTOMER)).toBe(false)
    expect(isOperator(null)).toBe(false)
    expect(isOperator(undefined)).toBe(false)
    expect(ALL_ROLES).toContain(ROLES.OPERATOR)
    expect(formatRoleName(ROLES.OPERATOR)).toBe('Opérateur')
  })

  it('keeps operator and admin scopes apart', () => {
    // Distinct scopes: the operator role opens /operator-portal only, and an
    // admin does not inherit the operator portal (nor the reverse).
    expect(isAdmin(ROLES.OPERATOR)).toBe(false)
    expect(canAccessAdminPortal(ROLES.OPERATOR)).toBe(false)
    expect(canAccessOperatorPortal(ROLES.ADMIN)).toBe(false)
    expect(canAccessOperatorPortal(ROLES.SUPER_ADMIN)).toBe(false)
    expect(canAccessOperatorPortal(null)).toBe(false)
  })
})
