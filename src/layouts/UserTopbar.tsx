import { LogOut } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface RouteMeta {
  title: string;
  subtitle?: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  "/chat": {
    title: "Ask Onboardly",
    subtitle: "Get instant answers from your company's approved policy docs.",
  },
  "/admin": {
    title: "Admin Workspace",
    subtitle: "Manage documents and knowledge sources for employee assistance.",
  },
};

function getRouteMeta(pathname: string): RouteMeta {
  if (pathname.startsWith("/admin")) return ROUTE_META["/admin"];
  return ROUTE_META["/chat"];
}

interface AppTopbarProps {
  role?: "admin" | "employee";
}

export function AppTopbar({ role }: AppTopbarProps) {
  const { profile, signOut } = useAuth();
  const { pathname } = useLocation();
  const { title } = getRouteMeta(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex h-18 w-full flex-col justify-center border-b border-neutral-border bg-navbar px-6 py-2"
      data-user-role={role ?? profile?.role ?? "employee"}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="h-5 w-px bg-border" />
        <div className="flex min-w-0 w-full flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted px-3 py-1 sm:flex">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => void signOut()}
              className="gap-2"
            >
              <LogOut className="size-4" />
              Logout
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
