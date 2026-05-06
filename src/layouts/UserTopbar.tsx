import { useLocation } from "react-router-dom";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface RouteMeta {
  title: string;
}

const ROUTE_META: Record<string, RouteMeta> = {
  "/chat": { title: "Ask Onboardly" },
  "/admin": { title: "Admin Workspace" },
};

function getRouteMeta(pathname: string): RouteMeta {
  if (pathname.startsWith("/admin")) return ROUTE_META["/admin"];
  return ROUTE_META["/chat"];
}

interface AppTopbarProps {
  role?: "admin" | "employee";
}

export function AppTopbar({ role }: AppTopbarProps) {
  const { profile } = useAuth();
  const { pathname } = useLocation();
  const { title } = getRouteMeta(pathname);

  return (
    <header
      className="sticky top-0 z-20 flex h-15 w-full items-center border-b border-neutral-200 bg-(--navbar) px-7"
      data-user-role={role ?? profile?.role ?? "employee"}
    >
      <div className="flex items-center gap-3">
        <SidebarTrigger className="-ml-1 text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-800" />
        <div className="h-4 w-px bg-neutral-200" />
        <h1 className="text-[15px] font-semibold tracking-tight text-neutral-800">{title}</h1>
      </div>
    </header>
  );
}
