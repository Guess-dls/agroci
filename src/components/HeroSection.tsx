import { ArrowRight, Users, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-agriculture.jpg";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="accueil" className="relative overflow-hidden bg-gradient-hero py-12 md:py-20 flex items-center">
      {/* Decorative blobs */}
      <div className="absolute -top-32 -left-32 w-72 md:w-96 h-72 md:h-96 bg-primary/10 rounded-full blur-3xl" />
      <div className="absolute -bottom-32 -right-32 w-72 md:w-96 h-72 md:h-96 bg-accent/10 rounded-full blur-3xl" />

      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 order-1">
            <div className="space-y-4 md:space-y-5">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs md:text-sm font-medium">
                <Zap className="h-4 w-4" />
                La marketplace agricole #1
              </div>
              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.1] tracking-tight">
                Connectez 
                <span className="text-gradient-primary"> producteurs</span> et 
                <span className="text-gradient-accent"> acheteurs</span>
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed">
                La première plateforme de mise en relation pour les produits vivriers en gros. 
                Contact direct, transactions sécurisées, producteurs vérifiés.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                size="lg" 
                className="bg-gradient-primary hover:opacity-90 text-primary-foreground shadow-medium rounded-xl text-sm md:text-base"
                onClick={() => navigate('/auth?type=producteur')}
              >
                Je suis producteur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                className="border-accent text-accent hover:bg-accent hover:text-accent-foreground shadow-soft rounded-xl text-sm md:text-base"
                onClick={() => navigate('/auth?type=acheteur')}
              >
                Je suis acheteur
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>

            <div className="pt-2">
              <PWAInstallButton variant="hero" />
            </div>

            <div className="grid grid-cols-3 gap-3 md:gap-6 pt-4">
              {[
                { icon: Users, label: 'Contact direct', sub: 'Via WhatsApp', color: 'primary' },
                { icon: ShieldCheck, label: 'Vérifiés', sub: 'Qualité garantie', color: 'accent' },
                { icon: Zap, label: 'Simple & Rapide', sub: 'Mise en relation', color: 'primary' },
              ].map(({ icon: Icon, label, sub, color }) => (
                <div key={label} className="text-center">
                  <div className={`inline-flex items-center justify-center w-10 h-10 md:w-12 md:h-12 rounded-2xl bg-${color}/10 mb-2 md:mb-3`}>
                    <Icon className={`h-5 w-5 md:h-6 md:w-6 text-${color}`} />
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-foreground leading-tight">{label}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-2">
            <div className="relative rounded-2xl md:rounded-3xl overflow-hidden shadow-elevated">
              <img 
                src={heroImage} 
                alt="Produits agricoles frais - maïs, riz, légumes" 
                className="w-full h-56 sm:h-72 md:h-96 lg:h-[520px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-foreground/10 to-transparent" />
            </div>
            {/* Floating card */}
            <div className="absolute -bottom-4 -left-4 md:-bottom-6 md:-left-6 glass rounded-2xl p-3 md:p-4 shadow-elevated">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0">
                  <ShieldCheck className="h-4 w-4 md:h-5 md:w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs md:text-sm font-bold text-foreground">+500 producteurs</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground">vérifiés et actifs</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
