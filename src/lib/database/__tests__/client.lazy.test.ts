const mockCreate = jest.fn(() => ({
  auth: { onAuthStateChange: jest.fn(), getUser: jest.fn(), signOut: jest.fn() },
  from: jest.fn(),
}));

jest.mock('@supabase/ssr', () => ({
  createBrowserClient: (...args: unknown[]) => mockCreate(...args),
}));

describe('browser supabase lazy init', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalKey;
    jest.resetModules();
    mockCreate.mockClear();
  });

  it('does not construct a client at import time without env', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    await import('../client');
    expect(mockCreate).not.toHaveBeenCalled();
  });

  it('constructs on first property access when env is set', async () => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    const { supabase } = await import('../client');
    expect(mockCreate).not.toHaveBeenCalled();
    void supabase.from;
    expect(mockCreate).toHaveBeenCalledTimes(1);
  });
});
