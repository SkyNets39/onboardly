import { LogOut, User2 } from "lucide-react";
import { useLocation } from "react-router-dom";

import { Badge } from "@/components/ui/badge";
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
  const { title, subtitle } = getRouteMeta(pathname);
  const resolvedRole = role ?? profile?.role ?? "employee";
  const roleLabel = resolvedRole === "admin" ? "Admin" : "Employee";

  return (
    <header className="sticky w-full top-0 z-20 border-b border-neutral-muted border-border/70 flex flex-col bg-background/95 px-6 py-2 h-18 backdrop-blur supports-backdrop-filter:bg-background/80 justify-center">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="h-5 w-px bg-border" />
        <div className="flex min-w-0 w-full flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1 sm:flex">
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
