import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Rocket, Calendar, ChevronDown, ChevronUp } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BoostRecord {
  id: string;
  product_id: string;
  producer_id: string;
  start_date: string;
  end_date: string;
  status: string;
  amount_paid: number;
  reference_paiement: string | null;
  created_at: string;
  updated_at: string;
  product_name?: string;
  producer_name?: string;
}

interface BoostHistoryProps {
  /** If provided, only show boosts for this producer */
  producerId?: string;
  /** If provided, only show boosts for this product */
  productId?: string;
  /** Show producer name column (for admin view) */
  showProducer?: boolean;
  /** Max items to show initially */
  initialLimit?: number;
}

export const BoostHistory = ({ producerId, productId, showProducer = false, initialLimit = 5 }: BoostHistoryProps) => {
  const [boosts, setBoosts] = useState<BoostRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchBoosts();
  }, [producerId, productId]);

  const fetchBoosts = async () => {
    try {
      let query = supabase
        .from('product_boosts')
        .select('*')
        .order('created_at', { ascending: false });

      if (producerId) {
        query = query.eq('producer_id', producerId);
      }
      if (productId) {
        query = query.eq('product_id', productId);
      }

      const { data, error } = await query;
      if (error) throw error;

      if (!data || data.length === 0) {
        setBoosts([]);
        setLoading(false);
        return;
      }

      // Fetch product names
      const productIds = [...new Set(data.map(b => b.product_id))];
      const { data: products } = await supabase
        .from('products')
        .select('id, nom')
        .in('id', productIds);

      // Fetch producer names if admin view
      let producerMap: Record<string, string> = {};
      if (showProducer) {
        const producerIds = [...new Set(data.map(b => b.producer_id))];
        const { data: producers } = await supabase
          .from('profiles')
          .select('id, nom, prenom')
          .in('id', producerIds);
        producers?.forEach(p => {
          producerMap[p.id] = `${p.prenom} ${p.nom}`;
        });
      }

      const productMap: Record<string, string> = {};
      products?.forEach(p => { productMap[p.id] = p.nom; });

      const enriched = data.map(b => ({
        ...b,
        product_name: productMap[b.product_id] || 'Produit inconnu',
        producer_name: producerMap[b.producer_id] || '',
      }));

      setBoosts(enriched);
    } catch (error) {
      console.error('[BoostHistory] Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string, endDate: string) => {
    const isExpired = new Date(endDate) < new Date();
    if (status === 'active' && !isExpired) {
      return <Badge className="bg-emerald-500 text-white text-[10px]">Actif</Badge>;
    }
    if (status === 'active' && isExpired) {
      return <Badge variant="secondary" className="text-[10px]">Expiré</Badge>;
    }
    return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  };

  const wasExtended = (boost: BoostRecord) => {
    const created = new Date(boost.created_at).getTime();
    const updated = new Date(boost.updated_at).getTime();
    // If updated_at is more than 1 minute after created_at, it was extended
    return (updated - created) > 60000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-6">
        <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (boosts.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Rocket className="h-8 w-8 mx-auto mb-2 opacity-40" />
        <p className="text-sm">Aucun historique de boost</p>
      </div>
    );
  }

  const displayedBoosts = expanded ? boosts : boosts.slice(0, initialLimit);
  const hasMore = boosts.length > initialLimit;

  return (
    <div className="space-y-3">
      {displayedBoosts.map((boost) => (
        <div
          key={boost.id}
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 p-3 border rounded-lg bg-card hover:bg-muted/30 transition-colors"
        >
          {/* Product + Status */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Rocket className="h-3.5 w-3.5 text-amber-500 flex-shrink-0" />
              <span className="font-medium text-sm truncate">{boost.product_name}</span>
              {getStatusBadge(boost.status, boost.end_date)}
              {wasExtended(boost) && (
                <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-600">
                  Prolongé
                </Badge>
              )}
            </div>
            {showProducer && boost.producer_name && (
              <p className="text-xs text-muted-foreground mt-0.5 ml-5">
                par {boost.producer_name}
              </p>
            )}
          </div>

          {/* Dates */}
          <div className="flex items-center gap-3 text-xs text-muted-foreground ml-5 sm:ml-0">
            <div className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              <span>{format(new Date(boost.start_date), 'dd/MM/yy', { locale: fr })}</span>
            </div>
            <span>→</span>
            <span className={new Date(boost.end_date) > new Date() ? 'text-emerald-600 font-medium' : ''}>
              {format(new Date(boost.end_date), 'dd/MM/yy', { locale: fr })}
            </span>
          </div>

          {/* Amount */}
          <div className="text-xs text-muted-foreground ml-5 sm:ml-0">
            {boost.reference_paiement?.includes('gratuit') ? (
              <Badge variant="outline" className="text-[10px] border-green-300 text-green-600">Gratuit</Badge>
            ) : (
              <span>{boost.amount_paid?.toLocaleString()} FCFA</span>
            )}
          </div>
        </div>
      ))}

      {hasMore && (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="w-full text-xs text-muted-foreground"
        >
          {expanded ? (
            <>
              <ChevronUp className="h-3 w-3 mr-1" />
              Voir moins
            </>
          ) : (
            <>
              <ChevronDown className="h-3 w-3 mr-1" />
              Voir tout ({boosts.length} boosts)
            </>
          )}
        </Button>
      )}
    </div>
  );
};
