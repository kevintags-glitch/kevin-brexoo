import "server-only";
import { cache } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/lib/supabase/database.types";

export type Org = Database["public"]["Tables"]["organizations"]["Row"];
export type Role = Database["public"]["Enums"]["member_role"];

/** The signed-in user (verified with the auth server), or a redirect to /login. */
export const requireUser = cache(async () => {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) redirect("/login");
  return { supabase, user: data.user };
});

export const getMemberships = cache(async () => {
  const { supabase, user } = await requireUser();
  const { data } = await supabase
    .from("memberships")
    .select("role, organization:organizations(*)")
    .eq("user_id", user.id)
    .order("created_at");
  return (data ?? []).filter((m) => m.organization) as { role: Role; organization: Org }[];
});

/**
 * Resolves the active organisation from the user's own memberships. An organisation id from the
 * browser is never trusted: we only pick among organisations the user belongs to, and RLS checks
 * membership again on every query.
 */
export const requireOrg = cache(async () => {
  const { supabase, user } = await requireUser();
  const memberships = await getMemberships();
  if (memberships.length === 0) redirect("/app/setup");

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();
  const active = memberships.find((m) => m.organization.id === profile?.active_organization_id) ?? memberships[0]!;
  return {
    supabase,
    user,
    profile,
    org: active.organization,
    role: active.role,
    isOwner: active.role === "owner",
    memberships,
  };
});

export type OrgContext = Awaited<ReturnType<typeof requireOrg>>;
