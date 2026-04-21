import { ArrowRight, Users, ShieldCheck, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-agriculture.jpg";
import { PWAInstallButton } from "@/components/PWAInstallButton";

export const HeroSection = () => {
  const navigate = useNavigate();
  return (
    <section id="accueil" className="relative overflow-hidden py-10 md:py-20 flex items-center">
      {/* Ambient orbs */}
      <div className="absolute top-10 -left-20 w-80 h-80 bg-primary/25 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute -bottom-20 -right-20 w-96 h-96 bg-accent/25 rounded-full blur-[120px]" />
      <div className="absolute top-1/3 left-1/2 w-72 h-72 bg-primary-light/20 rounded-full blur-[100px]" />

      <div className="container mx-auto px-4 py-8 md:py-16 relative z-10">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <div className="space-y-6 md:space-y-8 order-1">
            <div className="space-y-5 md:space-y-6">
              <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full glass text-primary text-xs md:text-sm font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                </span>
                La marketplace agricole #1 en Côte d'Ivoire
              </div>
              <h1 className="display-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl text-foreground leading-[1.02]">
                Le marché<br />
                <span className="display-italic font-light text-primary">vivrier</span> qui<br />
                connecte tout.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-lg leading-relaxed font-light">
                Producteurs vérifiés, acheteurs sérieux. Une mise en relation directe, sécurisée et sans intermédiaire.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button
                size="lg"
                className="bg-foreground hover:bg-foreground/90 text-background rounded-full text-sm md:text-base px-6 group"
                onClick={() => navigate('/auth?type=producteur')}
              >
                Je suis producteur
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="ghost"
                className="glass hover:bg-white/80 text-foreground rounded-full text-sm md:text-base px-6 group"
                onClick={() => navigate('/auth?type=acheteur')}
              >
                Je suis acheteur
                <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>

            <div className="pt-2">
              <PWAInstallButton variant="hero" />
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-3 pt-2">
              {[
                { icon: Users, label: 'Contact direct', sub: 'WhatsApp' },
                { icon: ShieldCheck, label: 'Vérifiés', sub: 'Qualité' },
                { icon: Zap, label: 'Rapide', sub: 'Mise en relation' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="glass rounded-2xl p-3 md:p-4 text-center hover:scale-[1.03] transition-transform">
                  <div className="inline-flex items-center justify-center w-9 h-9 md:w-10 md:h-10 rounded-xl bg-primary/15 mb-2">
                    <Icon className="h-4 w-4 md:h-5 md:w-5 text-primary" />
                  </div>
                  <div className="text-xs md:text-sm font-semibold text-foreground leading-tight">{label}</div>
                  <div className="text-[10px] md:text-xs text-muted-foreground mt-0.5">{sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative order-2">
            <div className="relative rounded-[2rem] overflow-hidden ring-1 ring-white/30 shadow-elevated">
              <img
                src={heroImage}
                alt="Produits agricoles frais - maïs, riz, légumes"
                className="w-full h-64 sm:h-80 md:h-[450px] lg:h-[560px] object-cover"
                loading="eager"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-foreground/30 via-transparent to-transparent" />
            </div>
            {/* Floating glass card */}
            <div className="absolute -bottom-5 left-4 md:-bottom-6 md:-left-6 glass-strong rounded-2xl p-3.5 md:p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 md:w-11 md:h-11 rounded-xl bg-gradient-primary flex items-center justify-center shrink-0 shadow-glow">
                  <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground">+500 producteurs</div>
                  <div className="text-[11px] text-muted-foreground">vérifiés et actifs</div>
                </div>
              </div>
            </div>
            {/* Top right floating tag */}
            <div className="absolute top-4 right-4 glass-strong rounded-full px-3 py-1.5 hidden md:flex items-center gap-2">
              <Zap className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-semibold text-foreground">Live marché</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
