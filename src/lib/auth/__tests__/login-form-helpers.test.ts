import { resolveLoginRedirectPath } from '@/lib/auth/login-form-helpers'
import { ROLES } from '@/lib/utils/roles'

describe('resolveLoginRedirectPath', () => {
  it('honors redirectTo for drivers (client portal deep link)', () => {
    const result = resolveLoginRedirectPath({
      redirectTo: '/my-account/reservations',
      from: null,
      userRole: ROLES.DRIVER,
    })

    expect(result).toEqual({ path: '/my-account/reservations' })
  })

  it('sends drivers to dashboard when from=driver and no redirectTo', () => {
    const result = resolveLoginRedirectPath({
      redirectTo: null,
      from: 'driver',
      userRole: ROLES.DRIVER,
    })

    expect(result).toEqual({ path: '/driver-portal/dashboard' })
  })

  it('defaults to my-account when no redirectTo or from', () => {
    const result = resolveLoginRedirectPath({
      redirectTo: null,
      from: null,
      userRole: ROLES.CUSTOMER,
    })

    expect(result).toEqual({ path: '/my-account' })
  })
})
