import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, CreditCard, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

interface Abonnement {
  id: string;
  nom: string;
  montant: number;
  credits: number;
  duree_jours: number;
  description: string;
  actif: boolean;
}

interface Profile {
  id: string;
  credits: number;
  nom: string;
  prenom: string;
}

const Abonnements = () => {
  const [abonnements, setAbonnements] = useState<Abonnement[]>([]);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPlan, setProcessingPlan] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
  }, [user]);

  const fetchData = async () => {
    if (!user) {
      setLoading(false);
      return;
    }

    try {
      const { data: abonnements, error: abonnementsError } = await supabase
        .from('abonnements')
        .select('*')
        .eq('actif', true)
        .order('montant', { ascending: true });

      if (abonnementsError) throw abonnementsError;

      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id, credits, nom, prenom')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;

      setAbonnements(abonnements || []);
      setProfile(profile);
    } catch (error) {
      console.error('Erreur lors du chargement des données:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = async (abonnementId: string, montant: number) => {
    if (!profile) return;

    setProcessingPlan(abonnementId);

    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          email: user?.email,
          amount: montant * 100,
          profileId: profile.id,
          abonnementId: abonnementId,
          metadata: {
            type: 'abonnement',
            abonnement_id: abonnementId,
            profile_id: profile.id
          }
        }
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error) {
      console.error('Erreur lors de l\'achat:', error);
      toast({
        title: "Erreur",
        description: "Impossible de procéder au paiement",
        variant: "destructive",
      });
    } finally {
      setProcessingPlan(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <SEOHead 
          title="Abonnements et tarifs"
          description="Découvrez nos plans d'abonnement pour accéder aux producteurs agricoles. Crédits pour contacter les producteurs, support prioritaire."
          canonicalUrl="https://agroci.lovable.app/abonnements"
        />
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]" role="status" aria-label="Chargement">
          <Loader2 className="h-8 w-8 animate-spin" aria-hidden="true" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <SEOHead 
          title="Abonnements et tarifs"
          description="Découvrez nos plans d'abonnement pour accéder aux producteurs agricoles. Crédits pour contacter les producteurs, support prioritaire."
          canonicalUrl="https://agroci.lovable.app/abonnements"
        />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Plans d'Abonnement AgroCI</h1>
            <p className="text-gray-600 mb-8">
              Connectez-vous pour voir nos plans d'abonnement et acheter des crédits
            </p>
            <Button asChild>
              <a href="/auth">Se connecter</a>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
      <SEOHead 
        title="Abonnements et tarifs"
        description="Découvrez nos plans d'abonnement pour accéder aux producteurs agricoles. Crédits pour contacter les producteurs, support prioritaire."
        keywords="abonnement AgroCI, crédits, tarifs, producteurs agricoles, Côte d'Ivoire"
        canonicalUrl="https://agroci.lovable.app/abonnements"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Plans d'Abonnement AgroCI
          </h1>
          <p className="text-gray-600 mb-4">
            Choisissez le plan qui correspond à vos besoins pour contacter les producteurs agricoles
          </p>
          {profile && (
            <div className="inline-flex items-center gap-2 bg-white px-4 py-2 rounded-full shadow-sm">
              <CreditCard className="h-4 w-4 text-green-600" aria-hidden="true" />
              <span className="font-medium">Crédits disponibles: {profile.credits}</span>
            </div>
          )}
        </header>

        <section aria-label="Liste des abonnements disponibles" className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {abonnements.map((plan) => (
            <article key={plan.id}>
              <Card className="relative hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm h-full">
                {plan.nom === 'Premium' && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white px-4 py-1">
                      Populaire
                    </Badge>
                  </div>
                )}
                
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl font-bold text-gray-800">
                    {plan.nom}
                  </CardTitle>
                  <div className="flex items-center justify-center gap-1">
                    <span className="text-3xl font-bold text-green-600">
                      {plan.montant.toLocaleString()}
                    </span>
                    <span className="text-gray-600">FCFA</span>
                  </div>
                  <CardDescription>
                    {plan.description}
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600 mb-1">
                      {plan.credits} crédits
                    </div>
                    <div className="text-sm text-gray-600">
                      Valable {plan.duree_jours} jours
                    </div>
                  </div>

                  <ul className="space-y-2 text-sm">
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                      <span>Accès à tous les produits agricoles</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                      <span>Contact direct avec producteurs via WhatsApp</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                      <span>Filtrage par catégories de produits</span>
                    </li>
                    {plan.nom === 'Pro' && (
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" aria-hidden="true" />
                        <span>Support client prioritaire</span>
                      </li>
                    )}
                  </ul>
                </CardContent>

                <CardFooter>
                  <Button 
                    className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                    onClick={() => handleSubscribe(plan.id, plan.montant)}
                    disabled={processingPlan === plan.id}
                    aria-label={`Souscrire au plan ${plan.nom} pour ${plan.montant} FCFA`}
                  >
                    {processingPlan === plan.id ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                        Traitement...
                      </>
                    ) : (
                      'Souscrire maintenant'
                    )}
                  </Button>
                </CardFooter>
              </Card>
            </article>
          ))}
        </section>

        <footer className="text-center mt-8">
          <p className="text-sm text-gray-600">
            Paiement sécurisé par Paystack • Facturation en FCFA • Mobile Money accepté
          </p>
        </footer>
      </main>
      <Footer />
    </div>
  );
};

export default Abonnements;
