import {
  isAdmin,
  isDriver,
  canAccessAdminPortal,
  canAcceptRides,
  canAccessClientPortal,
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
})
