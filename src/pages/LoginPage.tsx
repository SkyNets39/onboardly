import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface UserRoleRow {
  role: "admin" | "employee";
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  async function handleLogin() {
    setError("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError(error.message);
      return;
    }

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
  }

  return (
    <div style={{ padding: 40 }}>
      <h1>Login</h1>
      <input
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
      />
      <br />
      <br />
      <input
        placeholder="Password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <br />
      <br />
      <button onClick={handleLogin}>Login</button>
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
