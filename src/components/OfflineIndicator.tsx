import { usePWA } from "@/hooks/usePWA";
import { WifiOff, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export const OfflineIndicator = () => {
  const { isOnline, needsUpdate, updateApp } = usePWA();

  // Indicateur de mise à jour disponible
  if (needsUpdate) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50">
        <div className="bg-blue-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <RefreshCw className="h-5 w-5 animate-pulse" />
          <span className="text-sm font-medium">Nouvelle version disponible</span>
          <Button
            onClick={updateApp}
            size="sm"
            variant="secondary"
            className="bg-white text-blue-600 hover:bg-blue-50"
          >
            Mettre à jour
          </Button>
        </div>
      </div>
    );
  }

  // Indicateur hors-ligne
  if (!isOnline) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-auto z-50">
        <div className="bg-amber-500 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <WifiOff className="h-5 w-5" />
          <div className="flex flex-col">
            <span className="text-sm font-medium">Mode hors-ligne</span>
            <span className="text-xs opacity-90">Certaines fonctionnalités peuvent être limitées</span>
          </div>
        </div>
      </div>
    );
  }

  return null;
};

export default OfflineIndicator;
