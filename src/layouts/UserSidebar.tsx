import type { ComponentType } from "react";
import {
  FileText,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Users,
} from "lucide-react";
import { Link, NavLink, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
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
  { label: "Announcement", to: "/announcement", icon: MessageCircle },
  { label: "Directory", to: "/directory", icon: MessageCircle },
];

const ADMIN_NAV_ITEMS: NavigationItem[] = [
  { label: "Dashboard", to: "/admin/dashboard", icon: LayoutDashboard },
  { label: "Documents", to: "/admin/documents", icon: FileText },
  { label: "Users", to: "/admin/users", icon: Users },
];

export function AppSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const navigationItems = isAdmin ? ADMIN_NAV_ITEMS : EMPLOYEE_NAV_ITEMS;
  const homeLink = isAdmin ? "/admin/dashboard" : "/chat";

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="  px-4 py-3 h-18 flex flex-row items-center">
        <Link to={homeLink} className="flex items-center">
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate font-semibold">OnBoardly</span>
          </div>
        </Link>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.label}>
                  <SidebarMenuButton
                    asChild
                    tooltip={item.label}
                    isActive={location.pathname === item.to}
                    className="data-[active=true]:bg-brand-sky data-[active=true]:text-brand-deep"
                  >
                    <NavLink
                      to={item.to}
                      className="w-full rounded-md transition-colors"
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

      <SidebarFooter className="border-t border-sidebar-border px-3 py-3">
        <div className="rounded-md border border-sidebar-border p-3">
          <p className="truncate text-sm font-medium">
            {profile?.full_name ?? "Employee"}
          </p>
          <p className="text-xs text-sidebar-foreground/70">
            {profile?.role === "admin" ? "HR Admin" : "Employee"}
          </p>
          <Button
            type="button"
            variant="destructive"
            className="mt-2 w-full justify-start hover:bg-destructive/80 hover:cursor-pointer"
            onClick={() => void signOut()}
          >
            <LogOut className="size-4" />
            Sign out
          </Button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
