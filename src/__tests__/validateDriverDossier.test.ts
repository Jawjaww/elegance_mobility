const mockRpc = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}))

import {
  validateDriverDossier,
  adminSetDriverStatus,
  reopenDriverDossier,
} from '@/services/adminRideService'

describe('validateDriverDossier helper', () => {
  beforeEach(() => {
    mockRpc.mockReset()
    mockGetUser.mockReset()
  })

  it('calls validate_driver_dossier RPC', async () => {
    mockRpc.mockResolvedValue({
      data: [{ success: true, new_status: 'active', message: 'ok' }],
      error: null,
    })

    const result = await validateDriverDossier(
      'driver-1',
      'admin-1',
      true,
      null,
    )

    expect(mockRpc).toHaveBeenCalledWith("validate_driver_dossier", {
      p_driver_id: "driver-1",
      p_admin_user_id: "admin-1",
      p_approved: true,
    });
    expect(result).toMatchObject({ success: true, new_status: "active" });
  });

  it('calls admin_set_driver_status for operational statuses', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, new_status: 'suspended' },
      error: null,
    })

    const result = await adminSetDriverStatus(
      'driver-1',
      'suspended',
      'fraude',
    )

    expect(mockRpc).toHaveBeenCalledWith('admin_set_driver_status', {
      p_driver_id: 'driver-1',
      p_status: 'suspended',
      p_reason: 'fraude',
    })
    expect(result).toMatchObject({ success: true, new_status: 'suspended' })
  })

  it('calls reopen_driver_dossier', async () => {
    mockRpc.mockResolvedValue({
      data: { success: true, new_status: 'pending_review' },
      error: null,
    })

    const result = await reopenDriverDossier('driver-1', 'erreur admin')

    expect(mockRpc).toHaveBeenCalledWith('reopen_driver_dossier', {
      p_driver_id: 'driver-1',
      p_reason: 'erreur admin',
    })
    expect(result).toMatchObject({
      success: true,
      new_status: 'pending_review',
    })
  })
});
