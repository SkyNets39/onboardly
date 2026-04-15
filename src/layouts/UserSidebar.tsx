import { LogOut, MessageCircle, Shield } from "lucide-react";
import { Link, NavLink } from "react-router-dom";

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
import { cn } from "@/lib/utils";

interface NavigationItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
}

const BASE_NAV_ITEMS: NavigationItem[] = [
  { label: "Chat", to: "/chat", icon: MessageCircle },
];

const ADMIN_NAV_ITEM: NavigationItem = {
  label: "Admin",
  to: "/admin",
  icon: Shield,
};

export function UserSidebar() {
  const { profile, isAdmin, signOut } = useAuth();
  const navigationItems = isAdmin
    ? [...BASE_NAV_ITEMS, ADMIN_NAV_ITEM]
    : BASE_NAV_ITEMS;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3 h-18 flex flex-row items-center">
        <Link to="/chat" className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg bg-primary/12 text-primary">
            <MessageCircle className="size-4" />
          </div>
          <div className="grid flex-1 text-left text-lg leading-tight">
            <span className="truncate font-semibold">Onboardly</span>
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
                  <SidebarMenuButton asChild tooltip={item.label}>
                    <NavLink
                      to={item.to}
                      className={({ isActive }) =>
                        cn(
                          "w-full",
                          isActive &&
                            "bg-sidebar-accent text-sidebar-accent-foreground",
                        )
                      }
                    >
                      <item.icon />
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
            variant="ghost"
            className="mt-2 w-full justify-start"
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
