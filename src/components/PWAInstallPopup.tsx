import { useState, useEffect } from "react";
import { usePWA } from "@/hooks/usePWA";
import { Download, Smartphone, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const POPUP_DISMISSED_KEY = "pwa-popup-dismissed";

export const PWAInstallPopup = () => {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isOpen, setIsOpen] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);

  useEffect(() => {
    if (!canInstall || isInstalled) return;
    const dismissedAt = localStorage.getItem(POPUP_DISMISSED_KEY);
    if (dismissedAt && Date.now() - parseInt(dismissedAt, 10) < 86400000) return;
    const timer = setTimeout(() => setIsOpen(true), 2000);
    return () => clearTimeout(timer);
  }, [canInstall, isInstalled]);

  const handleDismiss = () => { setIsOpen(false); localStorage.setItem(POPUP_DISMISSED_KEY, Date.now().toString()); };

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) { toast.success("🎉 Application installée!", { description: "Retrouvez Fehi sur votre écran d'accueil" }); setIsOpen(false); }
    } catch { toast.error("Erreur lors de l'installation"); }
    finally { setIsInstalling(false); }
  };

  if (!canInstall || isInstalled) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleDismiss()}>
      <DialogContent className="sm:max-w-md rounded-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Smartphone className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-xl font-bold">Installez Fehi</DialogTitle>
          <DialogDescription className="text-base">
            Accédez rapidement à la plateforme depuis votre écran d'accueil.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4 space-y-3">
          {["Accès rapide depuis l'écran d'accueil", "Fonctionne même hors connexion", "Notifications en temps réel"].map(t => (
            <div key={t} className="flex items-center gap-3 text-sm text-muted-foreground">
              <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary text-xs font-bold">✓</div>
              <span>{t}</span>
            </div>
          ))}
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleInstall} disabled={isInstalling} className="flex-1 rounded-xl bg-gradient-primary text-primary-foreground hover:opacity-90">
            {isInstalling ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Installation...</>) : (<><Download className="mr-2 h-4 w-4" />Installer maintenant</>)}
          </Button>
          <Button variant="outline" onClick={handleDismiss} className="flex-1 rounded-xl">Plus tard</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PWAInstallPopup;
