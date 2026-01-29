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
          description: "Retrouvez AgroCI sur votre écran d'accueil"
        });
      }
    } catch (error) {
      toast.error("Erreur lors de l'installation");
    } finally {
      setIsInstalling(false);
    }
  };

  // Si déjà installé, afficher un badge
  if (isInstalled) {
    if (variant === "compact") return null;
    return (
      <div className={`flex items-center gap-2 text-sm text-green-600 ${className}`}>
        <Check className="h-4 w-4" />
        <span>Application installée</span>
      </div>
    );
  }

  // Si pas installable (déjà en PWA ou navigateur non compatible)
  if (!canInstall) {
    return null;
  }

  // Variante Hero - grande et proéminente
  if (variant === "hero") {
    return (
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        size="lg"
        className={`
          bg-gradient-to-r from-green-600 to-green-500 
          hover:from-green-700 hover:to-green-600 
          text-white font-semibold
          shadow-lg shadow-green-500/25
          transition-all duration-300
          hover:scale-105 hover:shadow-xl hover:shadow-green-500/30
          ${className}
        `}
      >
        {isInstalling ? (
          <>
            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            Installation...
          </>
        ) : (
          <>
            <Download className="mr-2 h-5 w-5" />
            Installer l'application
          </>
        )}
      </Button>
    );
  }

  // Variante compacte - icône seulement
  if (variant === "compact") {
    return (
      <Button
        onClick={handleInstall}
        disabled={isInstalling}
        size="icon"
        variant="outline"
        className={`border-green-300 text-green-600 hover:bg-green-50 hover:border-green-400 ${className}`}
        title="Installer l'application"
      >
        {isInstalling ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Download className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Variante par défaut
  return (
    <Button
      onClick={handleInstall}
      disabled={isInstalling}
      variant="outline"
      className={`
        border-green-300 text-green-700 
        hover:bg-green-50 hover:border-green-400
        transition-colors
        ${className}
      `}
    >
      {isInstalling ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Installation...
        </>
      ) : (
        <>
          <Smartphone className="mr-2 h-4 w-4" />
          Installer l'app
        </>
      )}
    </Button>
  );
};

export default PWAInstallButton;
