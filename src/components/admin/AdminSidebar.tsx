import { Users, Car, Building2, FolderTree, TrendingUp, Shield, ClipboardCheck } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const adminMenuItems = [
  { title: "Pending Approvals", url: "/admin/approvals", icon: ClipboardCheck },
  { title: "Manage Drivers", url: "/admin/drivers", icon: Users },
  { title: "Vehicles", url: "/admin/vehicles", icon: Car },
  { title: "Fleet Owners", url: "/admin/fleet-owners", icon: Building2 },
  { title: "Vehicle Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Compliance", url: "/admin/compliance", icon: Shield },
];

export function AdminSidebar() {
  return (
    <Sidebar collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Admin Management</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className="hover:bg-muted/50"
                      activeClassName="bg-muted text-primary font-medium"
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
