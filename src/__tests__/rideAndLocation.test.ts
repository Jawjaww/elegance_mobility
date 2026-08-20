const mockRpc = jest.fn()
const mockGetUser = jest.fn()

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: () => ({
    auth: { getUser: (...args: unknown[]) => mockGetUser(...args) },
    rpc: (...args: unknown[]) => mockRpc(...args),
  }),
}))

import { acceptRide } from '@/services/rideService'
import { pushDriverLocation } from '@/lib/services/locationService'

describe('acceptRide', () => {
  beforeEach(() => {
    mockRpc.mockReset()
    mockGetUser.mockReset()
  })

  it('throws when unauthenticated', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null })
    await expect(acceptRide('ride-1')).rejects.toThrow(/non authentifié/i)
  })

  it('calls accept_ride with auth user id hint', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'auth-user-1' } },
      error: null,
    })
    mockRpc.mockResolvedValue({
      data: { success: true, status: 'scheduled', ride_id: 'ride-1' },
      error: null,
    })

    const result = await acceptRide('ride-1')

    expect(mockRpc).toHaveBeenCalledWith('accept_ride', {
      p_ride_id: 'ride-1',
      p_driver_id: 'auth-user-1',
    })
    expect(result).toMatchObject({ success: true, status: 'scheduled' })
  })
})

describe('pushDriverLocation', () => {
  it('uses update_driver_location RPC instead of writing auth.uid as driver_id', async () => {
    const rpc = jest.fn().mockResolvedValue({ data: null, error: null })
    const supabase = { rpc } as never

    await pushDriverLocation(supabase, {
      lat: 48.85,
      lng: 2.35,
      heading: 1,
      speed: 2,
      accuracy: 3,
    })

    expect(rpc).toHaveBeenCalledWith('update_driver_location', {
      p_lat: 48.85,
      p_lng: 2.35,
      p_heading: 1,
      p_speed: 2,
      p_accuracy: 3,
    })
    expect(rpc).not.toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ driver_id: expect.anything() })
    )
  })
})
