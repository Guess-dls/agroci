import { ArrowRight, Users, Shield, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroImage from "@/assets/hero-agriculture.jpg";

export const HeroSection = () => {
  return (
    <section id="accueil" className="relative overflow-hidden bg-gradient-hero min-h-[600px] flex items-center">
      <div className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-tight">
                Connectez directement 
                <span className="bg-gradient-primary bg-clip-text text-transparent"> producteurs</span> et 
                <span className="bg-gradient-accent bg-clip-text text-transparent"> acheteurs</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
                La première plateforme de mise en relation pour les produits vivriers en gros. 
                Contact direct via WhatsApp, transactions sécurisées, producteurs vérifiés.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-primary hover:bg-primary-dark text-primary-foreground shadow-medium">
                Je suis producteur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button variant="accent" size="lg" className="shadow-medium">
                Je suis acheteur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-8">
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3 mx-auto">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Contact direct</div>
                <div className="text-xs text-muted-foreground">Via WhatsApp</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-accent/10 rounded-full mb-3 mx-auto">
                  <Shield className="h-6 w-6 text-accent" />
                </div>
                <div className="text-sm font-medium text-foreground">Producteurs vérifiés</div>
                <div className="text-xs text-muted-foreground">Qualité garantie</div>
              </div>
              <div className="text-center">
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-full mb-3 mx-auto">
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <div className="text-sm font-medium text-foreground">Simple & Rapide</div>
                <div className="text-xs text-muted-foreground">Mise en relation</div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="relative rounded-2xl overflow-hidden shadow-medium">
              <img 
                src={heroImage} 
                alt="Produits agricoles frais - maïs, riz, légumes" 
                className="w-full h-[500px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};