import { User2 } from "lucide-react";
import { useLocation } from "react-router-dom";

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

export function UserTopbar() {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const { title, subtitle } = getRouteMeta(pathname);

  return (
    <header className="sticky w-full top-0 z-20 border-b border-border/70 flex flex-col bg-background/95 px-4 py-2 h-18 backdrop-blur supports-backdrop-filter:bg-background/80 justify-center">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1" />
        <div className="h-5 w-px bg-border" />
        <div className="flex min-w-0 w-full flex-1 items-center justify-between gap-2">
          <div className="min-w-0">
            <h1 className="truncate text-base font-semibold">{title}</h1>
            {subtitle ? (
              <p className="truncate text-sm text-muted-foreground">
                {subtitle}
              </p>
            ) : null}
          </div>
          <div className="hidden items-center gap-2 rounded-md border border-border bg-muted/30 px-3 py-1.5 sm:flex">
            <User2 className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">
              {profile?.full_name ?? "Employee"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
