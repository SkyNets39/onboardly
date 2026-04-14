// src/pages/ChatPage.tsx
import { useAuth } from "@/hooks/useAuth";

export default function ChatPage() {
  const { profile, isAdmin, signOut } = useAuth();
  return (
    <div style={{ padding: 40 }}>
      <h1>Chat Page</h1>
      <p>
        Logged in as: <strong>{profile?.full_name}</strong>
      </p>
      <p>
        Role: <strong>{profile?.role}</strong>
      </p>
      <p>
        isAdmin: <strong>{String(isAdmin)}</strong>
      </p>
      <button onClick={signOut}>Logout</button>
    </div>
  );
}
