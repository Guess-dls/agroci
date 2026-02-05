import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, X, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const POPUP_DISMISSED_KEY = "pwa-popup-dismissed";
const POPUP_DELAY_MS = 2000;

export const PWAInstallPopup = () => {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    // Ne pas afficher si déjà installé ou non installable
    if (!canInstall || isInstalled) return;

    // Vérifier si l'utilisateur a déjà fermé le popup récemment (24h)
    const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissedAt) {
      const dismissedTime = parseInt(dismissedAt, 10);
      const now = Date.now();
      const twentyFourHours = 24 * 60 * 60 * 1000;
      if (now - dismissedTime < twentyFourHours) {
        return;
      }
    }

    // Afficher le popup après 2 secondes
    const timer = setTimeout(() => {
      setIsOpen(true);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => {
    setIsOpen(false);
    localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString());
  };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast.success("🎉 Application installée avec succès!", {
          description: "Retrouvez AgroCI sur votre écran d'accueil"
        });
        setIsOpen(false);
      }
    } catch (error) {
      toast.error("Erreur lors de l'installation");
    } finally {
      setIsInstalling(false);
    }
  };

  // Ne rien rendre si pas installable ou déjà installé
  if (!canInstall || isInstalled) {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">
            Installez AgroCI
          </DialogTitle>
          <DialogDescription className="text-base">
            Accédez rapidement à la plateforme depuis votre écran d'accueil. 
            Profitez d'une expérience optimisée, même hors connexion !
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 space-y-3">
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              ✓
            </div>
            <span>Accès rapide depuis l'écran d'accueil</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              ✓
            </div>
            <span>Fonctionne même hors connexion</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-muted-foreground">
            <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">
              ✓
            </div>
            <span>Notifications en temps réel</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button
            onClick={handleInstall}
            disabled={isInstalling}
            className="flex-1 bg-primary hover:bg-primary/90"
          >
            {isInstalling ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Installation...
              </>
            ) : (
              <>
                <Download className="mr-2 h-4 w-4" />
                Installer maintenant
              </>
            )}
          </Button>
          <Button
            variant="outline"
            onClick={handleDismiss}
            className="flex-1"
          >
            Plus tard
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPopup;
