import { Outlet } from "react-router-dom";

import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { UserSidebar } from "@/layouts/UserSidebar";
import { UserTopbar } from "@/layouts/UserTopbar";

export function UserLayout() {

  return (
    <SidebarProvider>
      <UserSidebar />

      <SidebarInset className="bg-background">
        <UserTopbar />
        <main className="p-4 md:p-6">
          <Outlet />
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
