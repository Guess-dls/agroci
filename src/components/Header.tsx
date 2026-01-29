import { Menu, Phone, LogOut, User, Shield, Download } from "lucide-react";
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
  const [userCredits, setUserCredits] = useState<number | null>(null);

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
        .select('user_type, credits')
        .eq('user_id', user!.id)
        .single();

      if (!error && data?.user_type === 'admin') {
        setIsAdmin(true);
      }
      
      if (!error && data?.credits !== undefined) {
        setUserCredits(data.credits);
      }
    } catch (error) {
      console.error('Error checking admin status:', error);
    }
  };

  const handleSignOut = async () => {
    setMobileMenuOpen(false);
    await signOut();
    // Attendre un court instant pour que l'état soit mis à jour
    setTimeout(() => {
      navigate('/');
    }, 100);
  };

  const handleHomeClick = () => {
    console.log('Clic sur le bouton d\'accueil');
    setMobileMenuOpen(false);
    navigate('/');
  };

  const handleNavigate = (path: string, label: string) => {
    console.log(`Navigation vers ${label}`);
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <header className="bg-background border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button onClick={handleHomeClick} className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent hover:opacity-80 transition-opacity">
              AgroCI
            </button>
          </div>
          
          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <button 
              onClick={() => {
                console.log('Clic sur le bouton d\'accueil dans nav');
                navigate('/');
              }} 
              className="text-foreground hover:text-primary transition-colors font-medium"
            >
              Accueil
            </button>
            <button 
              onClick={() => {
                console.log('Clic sur Produits');
                navigate('/products');
              }} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Produits
            </button>
            <button 
              onClick={() => {
                console.log('Clic sur Producteurs');
                navigate('/producers');
              }} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Producteurs
            </button>
            <button 
              onClick={() => {
                console.log('Clic sur Acheteurs');
                navigate('/buyers');
              }} 
              className="text-foreground hover:text-primary transition-colors"
            >
              Acheteurs
            </button>
          </nav>

          {/* Desktop Auth Buttons */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-4">
            {/* Bouton d'installation PWA */}
            <PWAInstallButton variant="compact" />
            
            <div className="flex items-center space-x-2 lg:space-x-4 text-xs lg:text-sm text-muted-foreground">
              <div className="flex items-center space-x-1 lg:space-x-2">
                <Phone className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                <span className="hidden lg:inline">+225 0789363442</span>
                <span className="lg:hidden text-xs">+225...</span>
              </div>
              {user && userCredits !== null && (
                <div className="flex items-center space-x-1 bg-primary/10 px-2 py-1 rounded-full whitespace-nowrap">
                  <span className="font-medium text-primary text-xs">💰 {userCredits}</span>
                </div>
              )}
            </div>
            
            {loading ? (
              <div className="flex space-x-2">
                <div className="w-16 h-8 bg-muted rounded animate-pulse" />
                <div className="w-20 h-8 bg-muted rounded animate-pulse" />
              </div>
            ) : user ? (
              <DropdownMenu modal={false} onOpenChange={(open) => console.log('Dropdown open state:', open)}>
                <DropdownMenuTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex items-center space-x-2"
                  >
                    <User className="h-4 w-4" />
                    <span>Mon compte</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  className="w-48 z-[100] bg-popover border shadow-lg"
                  sideOffset={8}
                >
                  <DropdownMenuItem 
                    onClick={(e) => {
                      console.log('Dashboard clicked');
                      e.preventDefault();
                      navigate('/dashboard');
                    }}
                    className="cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Tableau de bord</span>
                  </DropdownMenuItem>
                  {isAdmin && (
                    <DropdownMenuItem 
                      onClick={(e) => {
                        console.log('Admin clicked');
                        e.preventDefault();
                        navigate('/admin');
                      }}
                      className="cursor-pointer"
                    >
                      <Shield className="mr-2 h-4 w-4" />
                      <span>Administration</span>
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    onClick={(e) => {
                      console.log('Logout clicked');
                      e.preventDefault();
                      handleSignOut();
                    }}
                    className="cursor-pointer"
                  >
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Déconnexion</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => {
                    console.log('Bouton Connexion cliqué');
                    navigate('/auth');
                  }}
                >
                  Connexion
                </Button>
                <Button 
                  variant="accent" 
                  size="sm" 
                  onClick={() => {
                    console.log('Bouton Inscription cliqué');
                    navigate('/auth');
                  }}
                >
                  Inscription
                </Button>
              </>
            )}
          </div>

          {/* Mobile Menu */}
          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="md:hidden"
                onClick={() => console.log('Menu mobile ouvert')}
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80">
              <SheetHeader>
                <SheetTitle>Menu</SheetTitle>
                <SheetDescription>
                  Navigation et compte utilisateur
                </SheetDescription>
              </SheetHeader>
              
              <div className="mt-6 space-y-4">
                {/* Navigation Links */}
                <div className="space-y-3">
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigate('/', 'Accueil')}
                  >
                    Accueil
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigate('/products', 'Produits')}
                  >
                    Produits
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigate('/producers', 'Producteurs')}
                  >
                    Producteurs
                  </Button>
                  <Button
                    variant="ghost"
                    className="w-full justify-start"
                    onClick={() => handleNavigate('/buyers', 'Acheteurs')}
                  >
                    Acheteurs
                  </Button>
                </div>

                <div className="border-t pt-4">
                  <div className="flex flex-col space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <Phone className="h-4 w-4" />
                      <span>+225 0789363442</span>
                    </div>
                    {user && userCredits !== null && (
                      <div className="flex items-center space-x-2 bg-primary/10 px-3 py-1 rounded-full">
                        <span className="font-medium text-primary">💰 {userCredits} crédits</span>
                      </div>
                    )}
                  </div>

                  {loading ? (
                    <div className="space-y-2">
                      <div className="w-full h-10 bg-muted rounded animate-pulse" />
                      <div className="w-full h-10 bg-muted rounded animate-pulse" />
                    </div>
                  ) : user ? (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                        onClick={() => handleNavigate('/dashboard', 'Tableau de bord')}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Tableau de bord
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="outline"
                          className="w-full justify-start"
                          onClick={() => handleNavigate('/admin', 'Administration')}
                        >
                          <Shield className="mr-2 h-4 w-4" />
                          Administration
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        className="w-full justify-start"
                        onClick={handleSignOut}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        Déconnexion
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => handleNavigate('/auth', 'Connexion')}
                      >
                        Connexion
                      </Button>
                      <Button
                        variant="accent"
                        className="w-full"
                        onClick={() => handleNavigate('/auth', 'Inscription')}
                      >
                        Inscription
                      </Button>
                    </div>
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