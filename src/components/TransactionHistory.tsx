import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Plus, Minus } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Transaction {
  id: string;
  type_transaction: string;
  montant: number | null;
  credits_ajoutes: number;
  credits_utilises: number;
  description: string;
  statut: string;
  reference_paiement: string | null;
  created_at: string;
  abonnements?: {
    nom: string;
  };
}

const TransactionHistory = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      fetchTransactions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          *,
          abonnements:abonnement_id (
            nom
          )
        `)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (statut: string) => {
    const statusConfig = {
      'valide': { variant: 'default', label: 'Validé', className: 'bg-green-100 text-green-800' },
      'en_attente': { variant: 'secondary', label: 'En attente', className: 'bg-yellow-100 text-yellow-800' },
      'echoue': { variant: 'destructive', label: 'Échoué', className: 'bg-red-100 text-red-800' },
      'annule': { variant: 'outline', label: 'Annulé', className: 'bg-gray-100 text-gray-800' },
    };

    const config = statusConfig[statut as keyof typeof statusConfig] || statusConfig.en_attente;
    
    return (
      <Badge className={config.className}>
        {config.label}
      </Badge>
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'achat_abonnement':
        return <Plus className="h-4 w-4 text-green-600" />;
      case 'utilisation_credit':
        return <Minus className="h-4 w-4 text-red-600" />;
      case 'bonus':
        return <Plus className="h-4 w-4 text-blue-600" />;
      default:
        return <CreditCard className="h-4 w-4 text-gray-600" />;
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Historique des transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          Historique des transactions
        </CardTitle>
        <CardDescription>
          Consultez l'historique de vos achats et utilisations de crédits
        </CardDescription>
      </CardHeader>
      <CardContent>
        {transactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <CreditCard className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Aucune transaction trouvée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  {getTransactionIcon(transaction.type_transaction)}
                  <div>
                    <div className="font-medium text-gray-900">
                      {transaction.description}
                    </div>
                    <div className="text-sm text-gray-500">
                      {format(new Date(transaction.created_at), 'dd MMMM yyyy à HH:mm', { locale: fr })}
                    </div>
                    {transaction.abonnements && (
                      <div className="text-xs text-blue-600 mt-1">
                        Plan: {transaction.abonnements.nom}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-1">
                  <div className="flex items-center gap-2">
                    {transaction.credits_ajoutes > 0 && (
                      <span className="text-green-600 font-medium">
                        +{transaction.credits_ajoutes} crédits
                      </span>
                    )}
                    {transaction.credits_utilises > 0 && (
                      <span className="text-red-600 font-medium">
                        -{transaction.credits_utilises} crédits
                      </span>
                    )}
                    {transaction.montant && (
                      <span className="text-gray-900 font-medium">
                        {transaction.montant.toLocaleString()} FCFA
                      </span>
                    )}
                  </div>
                  <div>
                    {getStatusBadge(transaction.statut)}
                  </div>
                  {transaction.reference_paiement && (
                    <div className="text-xs text-gray-400">
                      Réf: {transaction.reference_paiement}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TransactionHistory;