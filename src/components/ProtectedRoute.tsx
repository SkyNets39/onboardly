import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
};

export function ProtectedRoute({ children, adminOnly = false }: Props) {
  const { session, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/chat" />;

  return <>{children}</>;
}
