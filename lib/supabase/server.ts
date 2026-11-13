import "server-only";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { SUPABASE_KEY, SUPABASE_URL, assertSupabaseEnv } from "@/lib/env";
import type { Database } from "./database.types";

/** Server client bound to the signed-in user's session (RLS applies as that user). */
export async function createClient() {
  // Read cookies first so the route is always dynamic, even in a website-only preview build.
  const store = await cookies();
  assertSupabaseEnv();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: {
      getAll: () => store.getAll(),
      setAll: (list) => {
        try {
          for (const { name, value, options } of list) store.set(name, value, options);
        } catch {
          // Called from a Server Component: the proxy refreshes the session instead.
        }
      },
    },
  });
}

/** Anonymous client with no session: what a public visitor can do. */
export function createAnonClient() {
  assertSupabaseEnv();
  return createServerClient<Database>(SUPABASE_URL, SUPABASE_KEY, {
    cookies: { getAll: () => [], setAll: () => {} },
  });
}
