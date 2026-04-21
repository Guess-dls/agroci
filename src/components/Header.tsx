import { Menu, Phone, LogOut, User, Shield } from "lucide-react";
import logoFehi from "@/assets/logo-fehi.png";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export const Header = () => {
  const { user, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (user) {
      checkAdminStatus();
    } else {
      setIsAdmin(false);
    }
  }, [user]);

  const checkAdminStatus = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type')
        .eq('user_id', user!.id)
        .single();
      if (!error && data?.user_type === 'admin') {
        setIsAdmin(true);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    setTimeout(() => { navigate('/'); }, 100);
  };

  const handleNavigate = (path: string) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="sticky top-0 z-50 px-2 sm:px-4 pt-2 sm:pt-3">
      <div className="container mx-auto glass rounded-2xl px-3 sm:px-5 py-2.5">
        <div className="flex items-center justify-between">
          <button onClick={() => handleNavigate('/')} className="flex items-center gap-2.5 group">
            <img src={logoFehi} alt="Fehi" className="w-9 h-9 rounded-xl ring-1 ring-white/40 shadow-soft group-hover:scale-105 transition-transform" />
            <span className="display-serif text-2xl font-semibold tracking-tight text-foreground">
              Fehi<span className="text-primary">.</span>
            </span>
          </button>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1 glass rounded-full px-1.5 py-1">
            {[
              { label: 'Accueil', path: '/' },
              { label: 'Produits', path: '/products' },
              { label: 'Producteurs', path: '/producers' },
              { label: 'Acheteurs', path: '/buyers' },
            ].map(({ label, path }) => (
              <button
                key={path}
                onClick={() => navigate(path)}
                className="px-4 py-1.5 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-white/60 transition-all"
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            <PWAInstallButton variant="compact" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Phone className="h-3.5 w-3.5" />
              <span className="hidden lg:inline">+225 0789363442</span>
            </div>

            {loading ? (
              <div className="flex gap-2">
                <div className="w-16 h-8 bg-muted rounded-lg animate-pulse" />
                <div className="w-20 h-8 bg-muted rounded-lg animate-pulse" />
              </div>
            ) : user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2 rounded-xl">
                    <User className="h-4 w-4" />
                    <span>Mon compte</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 z-[100] bg-popover border shadow-elevated rounded-xl" sideOffset={8}>
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }} className="cursor-pointer rounded-lg">
                    <User className="mr-2 h-4 w-4" />
                    Tableau de bord
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem onClick={(e) => { e.preventDefault(); navigate('/admin'); }} className="cursor-pointer rounded-lg">
                      <Shield className="mr-2 h-4 w-4" />
                      Administration
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={(e) => { e.preventDefault(); handleSignOut(); }} className="cursor-pointer rounded-lg text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/auth')} className="rounded-xl">
                  Connexion
                </Button>
                <Button size="sm" onClick={() => navigate('/auth')} className="rounded-xl bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-soft">
                  Inscription
                </Button>
              </div>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden rounded-xl">
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle className="text-gradient-primary text-left">Fehi</SheetTitle>
                <SheetDescription>Navigation</SheetDescription>
              </SheetHeader>
              <div className="mt-6 space-y-2">
                {['/', '/products', '/producers', '/buyers'].map((path, i) => (
                  <Button key={path} variant="ghost" className="w-full justify-start rounded-xl" onClick={() => handleNavigate(path)}>
                    {['Accueil', 'Produits', 'Producteurs', 'Acheteurs'][i]}
                  </Button>
                ))}
                <div className="border-t pt-4 mt-4 space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground px-4">
                    <Phone className="h-4 w-4" />
                    <span>+225 0789363442</span>
                  </div>
                  {loading ? (
                    <div className="space-y-2 px-4">
                      <div className="w-full h-10 bg-muted rounded-xl animate-pulse" />
                    </div>
                  ) : user ? (
                    <>
                      <Button variant="outline" className="w-full justify-start rounded-xl" onClick={() => handleNavigate('/dashboard')}>
                        <User className="mr-2 h-4 w-4" /> Tableau de bord
                      </Button>
                      {isAdmin && (
                        <Button variant="outline" className="w-full justify-start rounded-xl" onClick={() => handleNavigate('/admin')}>
                          <Shield className="mr-2 h-4 w-4" /> Administration
                        </Button>
                      )}
                      <Button variant="destructive" className="w-full justify-start rounded-xl" onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" /> Déconnexion
                      </Button>
                    </>
                  ) : (
                    <>
                      <Button variant="outline" className="w-full rounded-xl" onClick={() => handleNavigate('/auth')}>Connexion</Button>
                      <Button className="w-full rounded-xl bg-gradient-primary text-primary-foreground" onClick={() => handleNavigate('/auth')}>Inscription</Button>
                    </>
                  )}
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
};
