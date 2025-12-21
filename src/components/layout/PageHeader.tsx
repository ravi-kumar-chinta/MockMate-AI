import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/ui/Logo";
import { useAuth } from "@/hooks/useAuth";
import { LogOut, User, History, Menu, X } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  showNav?: boolean;
}

export const PageHeader = ({ showNav = true }: PageHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <header className="sticky top-0 z-50 border-b border-border/50 glass">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="transition-opacity hover:opacity-80">
            <Logo size="md" />
          </Link>

          {showNav && user && (
            <>
              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-2">
                <Link to="/profile">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <User className="w-4 h-4 mr-2" />
                    Profile
                  </Button>
                </Link>
                <Link to="/history">
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    <History className="w-4 h-4 mr-2" />
                    History
                  </Button>
                </Link>
                <Button variant="ghost" size="sm" onClick={handleSignOut} className="text-muted-foreground hover:text-foreground">
                  <LogOut className="w-4 h-4 mr-2" />
                  Logout
                </Button>
              </nav>

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </>
          )}
        </div>

        {/* Mobile Navigation */}
        {showNav && user && mobileMenuOpen && (
          <nav className={cn(
            "md:hidden py-4 border-t border-border/50 animate-fade-in",
          )}>
            <div className="flex flex-col gap-2">
              <Link to="/profile" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <User className="w-4 h-4 mr-2" />
                  Profile
                </Button>
              </Link>
              <Link to="/history" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="ghost" className="w-full justify-start">
                  <History className="w-4 h-4 mr-2" />
                  History
                </Button>
              </Link>
              <Button variant="ghost" onClick={handleSignOut} className="w-full justify-start">
                <LogOut className="w-4 h-4 mr-2" />
                Logout
              </Button>
            </div>
          </nav>
        )}
      </div>
    </header>
  );
};
