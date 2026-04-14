// src/pages/AdminPage.tsx
import { useAuth } from "@/hooks/useAuth";

export default function AdminPage() {
  const { profile } = useAuth();
  return (
    <div style={{ padding: 40 }}>
      <h1>Admin Dashboard</h1>
      <p>Welcome, {profile?.full_name}</p>
    </div>
  );
}
