import { useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { Crown, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface ProducerBadgeProps {
  producerId: string;
}

export const ProducerBadge = ({ producerId }: ProducerBadgeProps) => {
  const [plan, setPlan] = useState<string>('gratuit');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducerPlan();
  }, [producerId]);

  const fetchProducerPlan = async () => {
    try {
      const { data: subscription } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', producerId)
        .eq('status', 'actif')
        .maybeSingle();

      setPlan(subscription?.plan || 'gratuit');
    } catch (error) {
      console.error('Error fetching producer plan:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || plan === 'gratuit') {
    return null;
  }

  const getBadgeConfig = (plan: string) => {
    switch (plan) {
      case 'premium':
        return {
          label: 'Premium',
          icon: <Crown className="h-3 w-3 mr-1" />,
          className: 'bg-gradient-primary text-white border-0'
        };
      case 'pro':
        return {
          label: 'Pro',
          icon: <Zap className="h-3 w-3 mr-1" />,
          className: 'bg-gradient-accent text-white border-0'
        };
      default:
        return null;
    }
  };

  const badgeConfig = getBadgeConfig(plan);

  if (!badgeConfig) return null;

  return (
    <Badge className={badgeConfig.className}>
      {badgeConfig.icon}
      {badgeConfig.label}
    </Badge>
  );
};