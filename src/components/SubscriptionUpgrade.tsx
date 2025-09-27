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
      id: 'starter',
      name: 'Pack Starter',
      price: '5,000 CFA',
      credits: 50,
      description: 'Parfait pour débuter',
      features: [
        '50 crédits inclus',
        '1 crédit par contact WhatsApp',
        'Support standard'
      ],
      icon: <Star className="h-6 w-6" />,
      disabled: false
    },
    {
      id: 'premium',
      name: 'Pack Premium',
      price: '10,000 CFA',
      credits: 100,
      description: 'Le plus populaire',
      features: [
        '100 crédits inclus',
        '1 crédit par contact WhatsApp',
        'Support prioritaire',
        'Meilleur rapport qualité-prix'
      ],
      icon: <Crown className="h-6 w-6" />,
      disabled: false,
      popular: true
    },
    {
      id: 'pro',
      name: 'Pack Pro',
      price: '20,000 CFA',
      credits: 200,
      description: 'Pour les gros volumes',
      features: [
        '200 crédits inclus',
        '1 crédit par contact WhatsApp',
        'Support 24/7',
        'Économies importantes'
      ],
      icon: <Zap className="h-6 w-6" />,
      disabled: false
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
        <h2 className="text-2xl font-bold text-foreground">Achetez des crédits</h2>
        <p className="text-muted-foreground">
          1 crédit = 1 contact WhatsApp avec un producteur
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
              <div className="text-lg font-semibold text-success">{plan.credits} crédits</div>
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
                className={`w-full ${
                  plan.id === 'starter' ? 'bg-gradient-primary hover:opacity-90' :
                  plan.id === 'premium' ? 'bg-gradient-primary hover:opacity-90' :
                  plan.id === 'pro' ? 'bg-gradient-accent hover:opacity-90' : ''
                }`}
              >
                {loading === plan.id ? (
                  "Traitement..."
                ) : (
                  `Acheter ${plan.credits} crédits`
                )}
              </Button>
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