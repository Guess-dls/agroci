import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Rocket, Calendar, AlertTriangle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface SubscriptionUpgradeProps {
  userEmail: string;
  profileId: string;
  subscriptionActive: boolean;
  subscriptionEndDate: string | null;
}

export const SubscriptionUpgrade = ({ userEmail, profileId, subscriptionActive, subscriptionEndDate }: SubscriptionUpgradeProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const isExpiringSoon = subscriptionEndDate && subscriptionActive && 
    new Date(subscriptionEndDate).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          type: 'subscription',
          email: userEmail,
          profileId: profileId
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        window.open(data.authorization_url, '_blank');
        toast({
          title: "Redirection vers le paiement",
          description: "Vous allez être redirigé vers la page de paiement Paystack.",
        });
      }
    } catch (error) {
      console.error('Error creating payment:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la création du paiement.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Abonnement Producteur</h2>
        <p className="text-muted-foreground">
          Publiez vos produits et rendez-les visibles aux acheteurs
        </p>
      </div>

      {/* Current status */}
      {subscriptionActive && subscriptionEndDate && (
        <Card className={`border-2 ${isExpiringSoon ? 'border-amber-400 bg-amber-50' : 'border-green-400 bg-green-50'}`}>
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              {isExpiringSoon ? (
                <AlertTriangle className="h-6 w-6 text-amber-600" />
              ) : (
                <Crown className="h-6 w-6 text-green-600" />
              )}
              <div>
                <p className={`font-semibold ${isExpiringSoon ? 'text-amber-800' : 'text-green-800'}`}>
                  {isExpiringSoon ? 'Votre abonnement expire bientôt' : 'Abonnement actif'}
                </p>
                <p className={`text-sm ${isExpiringSoon ? 'text-amber-700' : 'text-green-700'}`}>
                  Expire le {format(new Date(subscriptionEndDate), 'dd MMMM yyyy', { locale: fr })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription plan */}
      <Card className="relative transition-all duration-300 hover:shadow-medium border-primary ring-2 ring-primary/20">
        <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground px-4">
          {subscriptionActive ? 'Renouveler' : 'Recommandé'}
        </Badge>
        
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 mx-auto bg-gradient-primary">
            <Crown className="h-7 w-7 text-white" />
          </div>
          <CardTitle className="text-xl">Abonnement Mensuel</CardTitle>
          <div className="text-4xl font-bold text-primary">3 000 FCFA</div>
          <div className="text-sm text-muted-foreground">/mois</div>
          <CardDescription>Tout ce dont vous avez besoin pour vendre</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          <ul className="space-y-3">
            {[
              'Publication illimitée de produits',
              'Tous vos produits visibles par les acheteurs',
              'Contact direct avec les acheteurs',
              'Badge producteur vérifié',
              'Statistiques de vues et clics',
              'Support prioritaire',
              'Renouvellement automatique de 30 jours'
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>

          <Button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full bg-gradient-primary hover:opacity-90 text-lg py-6"
          >
            {loading ? "Traitement..." : subscriptionActive ? "Renouveler (+ 30 jours)" : "S'abonner maintenant"}
          </Button>
        </CardContent>
      </Card>

      {/* Boost section */}
      <Card className="border-dashed border-2">
        <CardHeader className="text-center pb-2">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto bg-gradient-accent">
            <Rocket className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-lg">Boost de produit</CardTitle>
          <div className="text-2xl font-bold text-accent-foreground">1 200 FCFA</div>
          <div className="text-sm text-muted-foreground">/semaine par produit</div>
          <CardDescription>
            Boostez un produit pour qu'il apparaisse en priorité dans les résultats
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 mb-4">
            {[
              'Priorité dans les résultats de recherche',
              'Mise en avant sur la page d\'accueil',
              'Badge "Boosté" sur le produit',
              'Renouvelable et prolongeable'
            ].map((feature, index) => (
              <li key={index} className="flex items-center space-x-2">
                <Rocket className="h-3 w-3 text-accent flex-shrink-0" />
                <span className="text-sm">{feature}</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground text-center">
            <Calendar className="inline h-3 w-3 mr-1" />
            Boostez vos produits depuis l'onglet "Produits"
          </p>
        </CardContent>
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Paiement sécurisé via Paystack • Mobile Money accepté</p>
      </div>
    </div>
  );
};
