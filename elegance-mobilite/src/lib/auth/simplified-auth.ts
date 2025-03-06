import { createBrowserClient } from "@supabase/ssr";

export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function isAuthenticated() {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
}

export async function redirectIfUnauthenticated(path: string) {
  if (!(await isAuthenticated())) {
    window.location.href = `/login?redirectTo=${encodeURIComponent(path)}`;
    return true;
  }
  return false;
}
