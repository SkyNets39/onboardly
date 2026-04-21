import { useState } from "react";
import { useNavigate } from "react-router-dom";

import { supabase } from "@/lib/supabase";

interface UserRoleRow {
  role: "admin" | "employee";
}

export function useLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  async function handleLogin() {
    if (isSubmitting) {
      return;
    }

    setError("");
    setIsSubmitting(true);

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        setError(signInError.message);
        return;
      }

      console.log("[auth] signInWithPassword result", {
        userId: data.user?.id ?? null,
        email: data.user?.email ?? null,
        accessToken: data.session?.access_token ?? null,
        refreshToken: data.session?.refresh_token ?? null,
        tokenType: data.session?.token_type ?? null,
        expiresAt: data.session?.expires_at ?? null,
      });

      const userId = data.user?.id;
      if (!userId) {
        setError("User session not found after login.");
        return;
      }

      const { data: roleRow, error: roleError } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single<UserRoleRow>();

      if (roleError) {
        setError("Unable to resolve user role.");
        return;
      }

      if (roleRow.role === "admin") {
        navigate("/admin/dashboard");
        return;
      }

      navigate("/chat");
    } catch {
      setError("Something went wrong while signing in. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return {
    email,
    setEmail,
    password,
    setPassword,
    error,
    isSubmitting,
    handleLogin,
  };
}
