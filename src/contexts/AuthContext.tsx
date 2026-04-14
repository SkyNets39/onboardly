import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";

import {
  AuthContext,
  type UserProfile,
} from "@/contexts/auth-context";
import { supabase } from "@/lib/supabase";

function isUserProfile(value: unknown): value is UserProfile {
  if (value === null || typeof value !== "object") return false;
  if (
    !("id" in value) ||
    !("company_id" in value) ||
    !("full_name" in value) ||
    !("role" in value)
  ) {
    return false;
  }
  const { id, company_id, full_name, role } = value;
  return (
    typeof id === "string" &&
    typeof company_id === "string" &&
    typeof full_name === "string" &&
    (role === "admin" || role === "employee")
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function fetchProfile(userId: string) {
    const { data } = await supabase
      .from("users")
      .select("*")
      .eq("id", userId)
      .single();

    setProfile(isUserProfile(data) ? data : null);
    setIsLoading(false);
  }

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: nextSession } }) => {
      setSession(nextSession);
      if (nextSession) void fetchProfile(nextSession.user.id);
      else setIsLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (nextSession) void fetchProfile(nextSession.user.id);
      else {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        profile,
        isAdmin: profile?.role === "admin",
        isLoading,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
