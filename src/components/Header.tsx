import { NavLink } from "./NavLink";
import { Button } from "./ui/button";
import { Menu, LogOut, Car, User, Building } from "lucide-react";
import { useState, useEffect } from "react";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import type { User as SupabaseUser } from "@supabase/supabase-js";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed Out",
      description: "You have been successfully signed out",
    });
    navigate("/");
  };

  const navLinks = [
    { to: "/", label: "Home" },
    { to: "/vehicles", label: "Vehicles" },
    { to: "/empty-legs", label: "Empty Legs" },
    { to: "/about", label: "About" },
    { to: "/why-us", label: "Why Us" },
    { to: "/gallery", label: "Gallery" },
    { to: "/blog", label: "Blog" },
    { to: "/contact", label: "Contact Us" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <NavLink to="/" className="text-2xl font-bold text-primary">
          SafariHire
        </NavLink>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              className="text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
              activeClassName="text-primary"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          {user ? (
            <Button variant="outline" onClick={handleSignOut} className="hidden md:flex">
              <LogOut className="w-4 h-4 mr-2" />
              Sign Out
            </Button>
          ) : (
            <div className="hidden md:flex items-center gap-2">
              <NavLink to="/auth?role=driver">
                <Button variant="outline" size="sm">
                  <Car className="w-4 h-4 mr-2" />
                  Driver
                </Button>
              </NavLink>
              <NavLink to="/auth?role=client_individual">
                <Button variant="outline" size="sm">
                  <User className="w-4 h-4 mr-2" />
                  Client
                </Button>
              </NavLink>
              <NavLink to="/auth?role=owner">
                <Button variant="outline" size="sm">
                  <Building className="w-4 h-4 mr-2" />
                  Vehicle Owner
                </Button>
              </NavLink>
            </div>
          )}

          {/* Mobile Navigation */}
          <Sheet open={isOpen} onOpenChange={setIsOpen}>
            <SheetTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <nav className="flex flex-col gap-4 mt-8">
                {navLinks.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    onClick={() => setIsOpen(false)}
                    className="text-lg font-medium text-muted-foreground transition-colors hover:text-primary"
                    activeClassName="text-primary"
                  >
                    {link.label}
                  </NavLink>
                ))}
                {user ? (
                  <Button
                    variant="outline"
                    className="w-full mt-4"
                    onClick={() => {
                      handleSignOut();
                      setIsOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </Button>
                ) : (
                  <div className="space-y-2 mt-4">
                    <NavLink to="/auth?role=driver" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <Car className="w-4 h-4 mr-2" />
                        Driver Login
                      </Button>
                    </NavLink>
                    <NavLink to="/auth?role=client_individual" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <User className="w-4 h-4 mr-2" />
                        Client Login
                      </Button>
                    </NavLink>
                    <NavLink to="/auth?role=owner" onClick={() => setIsOpen(false)}>
                      <Button variant="outline" className="w-full">
                        <Building className="w-4 h-4 mr-2" />
                        Vehicle Owner Login
                      </Button>
                    </NavLink>
                  </div>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};

export default Header;
