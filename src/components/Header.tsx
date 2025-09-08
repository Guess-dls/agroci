import { Menu, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";

export const Header = () => {
  return (
    <header className="bg-background border-b shadow-soft sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AgroConnect
            </h1>
          </div>
          
          <nav className="hidden md:flex items-center space-x-6">
            <a href="#accueil" className="text-foreground hover:text-primary transition-colors">
              Accueil
            </a>
            <a href="#produits" className="text-foreground hover:text-primary transition-colors">
              Produits
            </a>
            <a href="#producteurs" className="text-foreground hover:text-primary transition-colors">
              Producteurs
            </a>
            <a href="#acheteurs" className="text-foreground hover:text-primary transition-colors">
              Acheteurs
            </a>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground">
              <Phone className="h-4 w-4" />
              <span>+225 0789363442</span>
            </div>
            <Button variant="outline" size="sm">
              Connexion
            </Button>
            <Button variant="accent" size="sm">
              Inscription
            </Button>
          </div>

          <Button variant="ghost" size="sm" className="md:hidden">
            <Menu className="h-5 w-5" />
          </Button>
        </div>
      </div>
    </header>
  );
};