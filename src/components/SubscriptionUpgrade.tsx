import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Zap, Star, Crown } from "lucide-react";
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
      id: 'essentiel',
      name: 'Pack Essentiel',
      price: '5 000 FCFA',
      credits: 25,
      pricePerContact: '200 FCFA/contact',
      description: 'Idéal pour démarrer',
      features: [
        '25 crédits inclus',
        '5 crédits par mise en relation',
        'Jusqu\'à 5 mises en relation',
        'Support standard'
      ],
      icon: <Zap className="h-6 w-6" />,
      popular: false,
      colorClass: 'bg-gradient-accent'
    },
    {
      id: 'pro',
      name: 'Pack Pro',
      price: '10 000 FCFA',
      credits: 50,
      pricePerContact: '200 FCFA/contact',
      description: 'Pour un usage régulier',
      features: [
        '50 crédits inclus',
        '5 crédits par mise en relation',
        'Jusqu\'à 10 mises en relation',
        'Support prioritaire'
      ],
      icon: <Star className="h-6 w-6" />,
      popular: true,
      colorClass: 'bg-gradient-primary'
    },
    {
      id: 'premium',
      name: 'Pack Premium',
      price: '15 000 FCFA',
      credits: 80,
      pricePerContact: '187 FCFA/contact',
      description: 'Le meilleur rapport qualité/prix',
      features: [
        '80 crédits inclus',
        '5 crédits par mise en relation',
        'Jusqu\'à 16 mises en relation',
        'Support VIP'
      ],
      icon: <Crown className="h-6 w-6" />,
      popular: false,
      colorClass: 'bg-gradient-primary'
    }
  ];

  const handleUpgrade = async (planId: string) => {
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
        <h2 className="text-2xl font-bold text-foreground">Achetez des crédits</h2>
        <p className="text-muted-foreground">
          5 crédits sont déduits de chaque côté lors d'une mise en relation acceptée
        </p>
      </div>

      <div className="grid md:grid-cols-3 gap-6">
        {plans.map((plan) => (
          <Card 
            key={plan.id} 
            className={`relative transition-all duration-300 hover:shadow-medium ${
              plan.popular ? 'border-primary ring-2 ring-primary/20 scale-105' : ''
            }`}
          >
            {plan.popular && (
              <Badge className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-primary-foreground px-4">
                Plus populaire
              </Badge>
            )}
            
            <CardHeader className="text-center pb-2">
              <div className={`inline-flex items-center justify-center w-12 h-12 rounded-full mb-3 mx-auto ${plan.colorClass}`}>
                <div className="text-white">
                  {plan.icon}
                </div>
              </div>
              <CardTitle className="text-xl">{plan.name}</CardTitle>
              <div className="text-3xl font-bold text-primary">{plan.price}</div>
              <div className="text-lg font-semibold text-success">{plan.credits} crédits</div>
              <div className="text-xs text-muted-foreground">{plan.pricePerContact}</div>
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

              <Button
                onClick={() => handleUpgrade(plan.id)}
                disabled={loading === plan.id}
                className="w-full bg-gradient-primary hover:opacity-90"
              >
                {loading === plan.id ? "Traitement..." : `Acheter ${plan.credits} crédits`}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-muted-foreground">
        <p>Paiement sécurisé via Paystack • Les crédits n'expirent pas</p>
      </div>
    </div>
  );
};
