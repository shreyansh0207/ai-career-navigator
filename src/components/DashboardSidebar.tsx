// Sidebar navigation for moving between the candidate dashboard features.
import { BarChart3, BriefcaseIcon, Map, MessageSquare, Settings, Users } from "lucide-react";
import { NavLink } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { Sparkles } from "lucide-react";
import { isDemoMode, openAiSettings } from "@/lib/demoMode";

const menuItems = [
  { title: "Career Mapping", url: "/dashboard/career-mapping", icon: Map },
  { title: "Skill Roadmap", url: "/dashboard/skill-roadmap", icon: BarChart3 },
  { title: "AI Interview", url: "/dashboard/ai-interview", icon: MessageSquare },
  { title: "Job Matching", url: "/dashboard/job-matching", icon: BriefcaseIcon },
  { title: "Mentor Connect", url: "/dashboard/mentor-connect", icon: Users },
];

export function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <Sidebar className={collapsed ? "w-14" : "w-64"} collapsible="icon">
      <SidebarContent className="bg-sidebar text-sidebar-foreground">
        <div className="p-4 border-b border-sidebar-border">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            {!collapsed && (
              <span className="font-bold text-sm text-sidebar-foreground">
                AI Career Navigator
              </span>
            )}
          </div>
        </div>

        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/60">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      className={({ isActive }) =>
                        isActive
                          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                          : "text-sidebar-foreground hover:bg-sidebar-accent/50"
                      }
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isDemoMode && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-sidebar-foreground/60">AI</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <button
                      type="button"
                      onClick={() => openAiSettings()}
                      className="text-sidebar-foreground hover:bg-sidebar-accent/50"
                    >
                      <Settings className="h-4 w-4" />
                      {!collapsed && <span>AI Settings</span>}
                    </button>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}
