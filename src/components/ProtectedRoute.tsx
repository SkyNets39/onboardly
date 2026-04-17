import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";

import { useAuth } from "@/hooks/useAuth";

type Props = {
  children: ReactNode;
  adminOnly?: boolean;
  employeeOnly?: boolean;
};

export function ProtectedRoute({
  children,
  adminOnly = false,
  employeeOnly = false,
}: Props) {
  const { session, isAdmin, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!session) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/chat" />;
  if (employeeOnly && isAdmin) return <Navigate to="/admin/dashboard" />;

  return <>{children}</>;
}
