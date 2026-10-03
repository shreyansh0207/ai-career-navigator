import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/DashboardSidebar";
import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-subtle">
        <DashboardSidebar />
        <main className="flex-1">
          <header className="h-16 flex items-center border-b border-border bg-card/50 backdrop-blur-sm px-6">
            <SidebarTrigger className="mr-4" />
            <h1 className="text-xl font-semibold bg-gradient-hero bg-clip-text text-transparent">
              Dashboard
            </h1>
            <div className="ml-auto flex items-center gap-3">
              <span className="hidden text-sm text-muted-foreground sm:block">{user?.displayName}</span>
              <Button variant="outline" size="sm" onClick={() => { logout(); navigate("/"); }}>
                Sign out
              </Button>
            </div>
          </header>
          <div className="p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
