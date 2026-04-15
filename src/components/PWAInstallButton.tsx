import { useState } from "react";
import { Button } from "@/components/ui/button";
import { usePWA } from "@/hooks/usePWA";
import { Download, Smartphone, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PWAInstallButtonProps {
  variant?: "default" | "hero" | "compact";
  className?: string;
}

export const PWAInstallButton = ({ variant = "default", className = "" }: PWAInstallButtonProps) => {
  const { canInstall, isInstalled, installApp } = usePWA();
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      const success = await installApp();
      if (success) {
        toast.success("🎉 Application installée avec succès!", {
          description: "Retrouvez Fehi sur votre écran d'accueil"
        });
      }
    } catch (error) {
      toast.error("Erreur lors de l'installation");
    } finally {
      setIsInstalling(false);
    }
  };

  if (isInstalled) {
    if (variant === "compact") return null;
    return (
      <div className={`flex items-center gap-2 text-sm text-primary ${className}`}>
        <Check className="h-4 w-4" />
        <span>Application installée</span>
      </div>
    );
  }

  if (!canInstall) return null;

  if (variant === "hero") {
    return (
      <Button onClick={handleInstall} disabled={isInstalling} size="lg"
        className={`bg-gradient-primary hover:opacity-90 text-primary-foreground font-semibold shadow-medium rounded-xl transition-all duration-300 hover:scale-105 ${className}`}
      >
        {isInstalling ? (<><Loader2 className="mr-2 h-5 w-5 animate-spin" />Installation...</>) : (<><Download className="mr-2 h-5 w-5" />Installer l'application</>)}
      </Button>
    );
  }

  if (variant === "compact") {
    return (
      <Button onClick={handleInstall} disabled={isInstalling} size="icon" variant="outline"
        className={`rounded-xl border-primary/20 text-primary hover:bg-primary/5 ${className}`} title="Installer l'application"
      >
        {isInstalling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
      </Button>
    );
  }

  return (
    <Button onClick={handleInstall} disabled={isInstalling} variant="outline"
      className={`rounded-xl border-primary/20 text-primary hover:bg-primary/5 transition-colors ${className}`}
    >
      {isInstalling ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Installation...</>) : (<><Smartphone className="mr-2 h-4 w-4" />Installer l'app</>)}
    </Button>
  );
};

export default PWAInstallButton;
