const mockRpc = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}))

import { validateDriverDossier } from '@/services/adminRideService'

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
});
