import type { ReactNode } from "react";
import { Outlet } from "react-router-dom";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";
import { AppSidebar } from "@/layouts/UserSidebar";
import { AppTopbar } from "@/layouts/UserTopbar";

interface AppLayoutProps {
  role?: "admin" | "employee";
  children?: ReactNode;
}

export function AppLayout({ role, children }: AppLayoutProps) {
  const { profile } = useAuth();
  const resolvedRole = role ?? profile?.role ?? "employee";

  return (
    <SidebarProvider>
      <AppSidebar />

      <SidebarInset className="bg-background">
        <AppTopbar role={resolvedRole} />
        <main className="p-4 md:p-6 h-full bg-neutral-background">
          {children ?? <Outlet />}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
