import { Users, Car, Building2, FolderTree, TrendingUp, Shield, ClipboardCheck, Image, FileCheck, Layers, FileText, Tags, Images, Globe } from "lucide-react";
import { NavLink } from "@/components/NavLink";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
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
  { title: "Company Documents", url: "/admin/company-documents", icon: FileCheck },
  { title: "Manage Drivers", url: "/admin/drivers", icon: Users },
  { title: "Vehicles", url: "/admin/vehicles", icon: Car },
  { title: "Fleet Owners", url: "/admin/fleet-owners", icon: Building2 },
  { title: "Vehicle Categories", url: "/admin/categories", icon: FolderTree },
  { title: "Vehicle Subcategories", url: "/admin/subcategories", icon: Layers },
  { title: "Hero Slider", url: "/admin/hero-slider", icon: Image },
  { title: "Gallery", url: "/admin/gallery", icon: Images },
  { title: "Blog Posts", url: "/admin/blog", icon: FileText },
  { title: "Blog Categories", url: "/admin/blog-categories", icon: Tags },
  { title: "Countries", url: "/admin/countries", icon: Globe },
  { title: "Analytics", url: "/admin/analytics", icon: TrendingUp },
  { title: "Compliance", url: "/admin/compliance", icon: Shield },
];

export function AdminSidebar() {
  // Fetch pending documents count
  const { data: pendingCount } = useQuery({
    queryKey: ["pending-company-documents-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("company_documents")
        .select("*", { count: "exact", head: true })
        .is("verified_by_admin", null);

      if (error) throw error;
      return count || 0;
    },
    refetchInterval: 30000, // Refetch every 30 seconds
  });

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
                      {item.title === "Company Documents" && pendingCount && pendingCount > 0 && (
                        <Badge variant="destructive" className="ml-auto">
                          {pendingCount}
                        </Badge>
                      )}
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
