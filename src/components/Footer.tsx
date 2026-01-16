import { Mail, MessageCircle } from "lucide-react";

const WHATSAPP_NUMBER = "+225 0789363442";
const WHATSAPP_LINK = "https://wa.me/2250789363442?text=Bonjour%2C%20j%27ai%20besoin%20d%27aide%20concernant%20AgroCI";
const EMAIL = "josephguessanbi@gmail.com";

export const Footer = () => {
  return (
    <footer className="bg-muted/30 border-t">
      <div className="container mx-auto px-4 py-12">
        <div className="grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <h3 className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              AgroCI
            </h3>
            <p className="text-sm text-muted-foreground">
              La plateforme de référence pour la mise en relation entre producteurs 
              et acheteurs de produits vivriers en gros.
            </p>
            <div className="space-y-2">
              <a 
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
              >
                <MessageCircle className="h-4 w-4 text-[#25D366]" />
                <span>{WHATSAPP_NUMBER}</span>
              </a>
              <a 
                href={`mailto:${EMAIL}`}
                className="flex items-center space-x-2 text-sm hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4 text-primary" />
                <span>{EMAIL}</span>
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Navigation</h4>
            <div className="space-y-2 text-sm">
              <a href="/" className="block text-muted-foreground hover:text-primary transition-colors">
                Accueil
              </a>
              <a href="/products" className="block text-muted-foreground hover:text-primary transition-colors">
                Produits
              </a>
              <a href="/producers" className="block text-muted-foreground hover:text-primary transition-colors">
                Producteurs
              </a>
              <a href="/buyers" className="block text-muted-foreground hover:text-primary transition-colors">
                Acheteurs
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Support</h4>
            <div className="space-y-2 text-sm">
              <a 
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Centre d'aide
              </a>
              <a 
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="block text-muted-foreground hover:text-primary transition-colors"
              >
                Contact
              </a>
              <a href="/faq" className="block text-muted-foreground hover:text-primary transition-colors">
                FAQ
              </a>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-semibold text-foreground">Légal</h4>
            <div className="space-y-2 text-sm">
              <a href="/mentions-legales" className="block text-muted-foreground hover:text-primary transition-colors">
                Mentions légales
              </a>
              <a href="/politique-confidentialite" className="block text-muted-foreground hover:text-primary transition-colors">
                Politique de confidentialité
              </a>
              <a href="/conditions" className="block text-muted-foreground hover:text-primary transition-colors">
                Conditions d'utilisation
              </a>
            </div>
          </div>
        </div>

        <div className="border-t mt-8 pt-8 text-center">
          <p className="text-sm text-muted-foreground">
            © 2024 AgroCI. Tous droits réservés. Plateforme de mise en relation agricole.
          </p>
        </div>
      </div>
    </footer>
  );
};
