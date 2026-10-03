// Public site navigation with sign-in, dashboard, and sign-out actions.
import { Button } from "@/components/ui/button";
import { NavigationMenu, NavigationMenuItem, NavigationMenuLink, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

const Navbar = () => {
  const { user, logout } = useAuth();

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-hero rounded-lg flex items-center justify-center shadow-glow">
              <Sparkles className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl bg-gradient-hero bg-clip-text text-transparent">
              AI Career Navigator
            </span>
          </Link>

          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList className="space-x-1">
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Home
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
              <NavigationMenuItem>
                <NavigationMenuLink asChild>
                  <Link to="/dashboard" className="px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Dashboard
                  </Link>
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>

          <div className="flex items-center space-x-3">
            {user ? (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/dashboard">My Dashboard</Link>
                </Button>
                <Button variant="outline" onClick={logout}>Sign Out</Button>
              </>
            ) : (
              <>
                <Button variant="ghost" asChild>
                  <Link to="/auth">Sign In</Link>
                </Button>
                <Button className="bg-gradient-hero hover:opacity-90 transition-opacity shadow-glow" asChild>
                  <Link to="/auth">Get Started</Link>
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
