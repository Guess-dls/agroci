import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Star, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SubscriptionUpgradeProps {
  userEmail: string;
  profileId: string;
  currentPlan: string;
}

export const SubscriptionUpgrade = ({ userEmail, profileId, currentPlan }: SubscriptionUpgradeProps) => {
  const [loading, setLoading] = useState<string | null>(null);
  const { toast } = useToast();

  const plans = [
    {
      id: 'gratuit',
      name: 'Gratuit',
      price: '0 CFA',
      description: 'Fonctionnalités de base',
      features: [
        'Publier 3 produits maximum',
        'Contact direct via WhatsApp',
        'Profil de base'
      ],
      icon: <Star className="h-6 w-6" />,
      disabled: true
    },
    {
      id: 'premium',
      name: 'Premium',
      price: '10,000 CFA/mois',
      description: 'Idéal pour les producteurs individuels',
      features: [
        'Publier jusqu\'à 20 produits',
        'Profil vérifié prioritaire',
        'Statistiques avancées',
        'Support prioritaire',
        'Badge "Producteur Premium"'
      ],
      icon: <Crown className="h-6 w-6" />,
      disabled: false,
      popular: true
    },
    {
      id: 'pro',
      name: 'Pro',
      price: '20,000 CFA/3 mois',
      description: 'Parfait pour les coopératives',
      features: [
        'Produits illimités',
        'Profil vérifié VIP',
        'Analytics détaillées',
        'Support 24/7',
        'Badge "Producteur Pro"',
        'Mise en avant des produits',
        'Gestion multi-utilisateurs'
      ],
      icon: <Zap className="h-6 w-6" />,
      disabled: false
    }
  ];

  const handleUpgrade = async (planId: string) => {
    if (planId === 'gratuit') return;
    
    setLoading(planId);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          plan: planId,
          email: userEmail,
          profileId: profileId
        }
      });

      if (error) throw error;

      if (data.authorization_url) {
        // Redirect to Paystack payment page
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
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-foreground">Choisissez votre plan</h2>
        <p className="text-muted-foreground">
          Débloquez plus de fonctionnalités avec nos plans premium
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-300 hover:shadow-medium ${
              plan.popular ? 'border-primary ring-2 ring-primary/20' : ''
            } ${currentPlan === plan.id ? 'bg-primary/5' : ''}`}
          >
            {plan.popular && (
              <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground">
                Plus populaire
              </Badge>
            )}
            
            <CardHeader className="text-center">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto ${
                plan.id === 'gratuit' ? 'bg-muted' : 
                plan.id === 'premium' ? 'bg-gradient-primary' : 'bg-gradient-accent'
              }`}>
                <div className={plan.id === 'gratuit' ? 'text-muted-foreground' : 'text-white'}>
                  {plan.icon}
                </div>
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-2xl font-bold text-primary">{plan.price}</div>
              <CardDescription>{plan.description}</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-2">
                {plan.features.map((feature, index) => (
                  <li key={index} className="flex items-center space-x-2">
                    <Check className="h-4 w-4 text-success flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </li>
                ))}
              </ul>

              {currentPlan === plan.id ? (
                <Badge variant="outline" className="w-full justify-center py-2">
                  Plan actuel
                </Badge>
              ) : (
                <Button
                  onClick={() => handleUpgrade(plan.id)}
                  disabled={plan.disabled || loading === plan.id}
                  className={`w-full ${
                    plan.id === 'premium' ? 'bg-gradient-primary hover:opacity-90' :
                    plan.id === 'pro' ? 'bg-gradient-accent hover:opacity-90' : ''
                  }`}
                  variant={plan.id === 'gratuit' ? 'outline' : 'default'}
                >
                  {loading === plan.id ? (
                    "Traitement..."
                  ) : plan.id === 'gratuit' ? (
                    "Plan actuel"
                  ) : (
                    `Passer à ${plan.name}`
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Paiement sécurisé via Paystack • Annulation possible à tout moment</p>
      </div>
    </div>
  );
};