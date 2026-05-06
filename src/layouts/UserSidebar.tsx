import type { ComponentType } from "react";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Users,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

interface NavigationItem {
  label: string;
  to: string;
  icon: ComponentType<{ className?: string }>;
}

const EMPLOYEE_NAV_ITEMS: NavigationItem[] = [
  { label: "Chat", to: "/chat", icon: MessageCircle },
];

const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/admin/documents", icon: FileText },
  { label: "Users", to: "/admin/users", icon: Users },
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "?";
  if (parts.length === 1) return (parts[0]![0] ?? "").toUpperCase();
  return ((parts[0]![0] ?? "") + (parts[parts.length - 1]![0] ?? "")).toUpperCase();
}

export function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigationItems = isAdmin ? ADMIN_NAV_ITEMS : EMPLOYEE_NAV_ITEMS;
  const homeLink = isAdmin ? "/admin/dashboard" : "/chat";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="h-15 justify-center border-b border-neutral-200 px-3">
        <Link to={homeLink} className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 text-white shadow-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M6 4h8a6 6 0 0 1 6 6v0a6 6 0 0 1-6 6H6V4z" stroke="white" strokeWidth="2" strokeLinejoin="round" />
              <circle cx="10" cy="10" r="1.5" fill="white" />
            </svg>
          </div>
          <div className="grid min-w-0 leading-tight group-data-[collapsible=icon]:hidden">
            <span className="truncate text-[15px] font-bold tracking-tight text-neutral-900">
              OnBoardly
            </span>
            <span className="text-[11px] font-medium text-neutral-500">
              {isAdmin ? "Admin Console" : "Workspace"}
            </span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel className="px-2.5 text-[10.5px] font-bold tracking-[0.08em] uppercase text-neutral-500">
            {isAdmin ? "Manage" : "Workspace"}
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="group-data-[collapsible=icon]:items-center">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={location.pathname === item.to}
                    className="text-[13.5px] font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-800 data-[active=true]:bg-primary-50 data-[active=true]:font-semibold data-[active=true]:text-primary-700"
                  >
                    <NavLink
                      to={item.to}
                      className="flex h-full w-full items-center rounded-md transition-colors"
                    >
                      <item.icon className="size-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-neutral-200 p-3">
        <div className="flex items-center gap-2.5 rounded-lg p-2 transition-colors hover:bg-neutral-100">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary-400 to-primary-600 text-xs font-semibold text-white">
            {getInitials(profile?.full_name ?? "")}
          </div>
          <div className="min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <p className="truncate text-[13px] font-semibold leading-tight text-neutral-800">
              {profile?.full_name ?? "Employee"}
            </p>
            <p className="text-[11px] font-medium leading-tight text-neutral-500">
              {profile?.role === "admin" ? "HR Admin" : "Employee"}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void signOut()}
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-200 hover:text-neutral-700 group-data-[collapsible=icon]:hidden"
            title="Sign out"
          >
            <LogOut className="size-3.5" />
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
