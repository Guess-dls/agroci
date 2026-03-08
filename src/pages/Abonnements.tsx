import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, Crown, Check, Rocket } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import SEOHead from '@/components/SEOHead';

interface Profile {
  id: string;
  nom: string;
  prenom: string;
  user_type: string;
  subscription_active: boolean;
  subscription_end_date: string | null;
}

const Abonnements = () => {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
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
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('id, nom, prenom, user_type, subscription_active, subscription_end_date')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw profileError;
      setProfile(profileData);
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

  const handleSubscribe = async () => {
    if (!profile) return;
    setProcessingPayment(true);

    try {
      const { data, error } = await supabase.functions.invoke('create-paystack-payment', {
        body: {
          type: 'subscription',
          email: user?.email,
          profileId: profile.id
        }
      });

      if (error) throw error;

      if (data?.authorization_url) {
        window.location.href = data.authorization_url;
      } else {
        throw new Error('URL de paiement non reçue');
      }
    } catch (error: any) {
      const userMessage = formatTransactionError(error, 'handleSubscribe:Abonnements');
      toast({
        title: "Erreur de paiement",
        description: userMessage,
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <SEOHead title="Abonnements et tarifs" description="Abonnement producteur AgroCI" canonicalUrl="https://agroci.lovable.app/abonnements" />
        <Header />
        <div className="flex items-center justify-center min-h-[50vh]">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50">
        <SEOHead title="Abonnements et tarifs" description="Abonnement producteur AgroCI" canonicalUrl="https://agroci.lovable.app/abonnements" />
        <Header />
        <main className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-4">Abonnements AgroCI</h1>
            <p className="text-muted-foreground mb-8">Connectez-vous pour voir nos offres</p>
            <Button asChild><a href="/auth">Se connecter</a></Button>
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
        description="Abonnement mensuel producteur AgroCI : 3 000 FCFA/mois pour publier vos produits. Boost produit : 1 200 FCFA/semaine."
        keywords="abonnement AgroCI, producteur, boost produit, Côte d'Ivoire"
        canonicalUrl="https://agroci.lovable.app/abonnements"
      />
      <Header />
      <main className="container mx-auto px-4 py-8">
        <header className="text-center mb-8">
          <h1 className="text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            Tarifs AgroCI
          </h1>
          <p className="text-muted-foreground mb-4">
            Des offres simples et accessibles pour les producteurs agricoles
          </p>
        </header>

        <section className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Monthly Subscription */}
          <Card className="relative hover:shadow-lg transition-all duration-300 border-2 border-primary">
            <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-to-r from-green-600 to-blue-600 text-white px-4 py-1">
                Essentiel
              </Badge>
            </div>
            
            <CardHeader className="text-center pt-8">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 mx-auto bg-gradient-to-r from-green-600 to-blue-600">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl">Abonnement Mensuel</CardTitle>
              <div className="flex items-center justify-center gap-1">
                <span className="text-4xl font-bold text-primary">3 000</span>
                <span className="text-muted-foreground">FCFA/mois</span>
              </div>
              <CardDescription>Tout pour vendre vos produits</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                {[
                  'Publication illimitée de produits',
                  'Produits visibles par tous les acheteurs',
                  'Contact direct avec les acheteurs',
                  'Statistiques de performance',
                  'Support prioritaire',
                  'Badge producteur vérifié'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <Button 
                className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white text-lg py-6"
                onClick={handleSubscribe}
                disabled={processingPayment || profile?.user_type !== 'producteur'}
              >
                {processingPayment ? (
                  <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Traitement...</>
                ) : profile?.subscription_active ? (
                  'Renouveler (+30 jours)'
                ) : (
                  'S\'abonner maintenant'
                )}
              </Button>
            </CardFooter>
          </Card>

          {/* Boost */}
          <Card className="relative hover:shadow-lg transition-all duration-300 border-dashed border-2">
            <CardHeader className="text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-3 mx-auto bg-amber-500">
                <Rocket className="h-7 w-7 text-white" />
              </div>
              <CardTitle className="text-2xl">Boost de Produit</CardTitle>
              <div className="flex items-center justify-center gap-1">
                <span className="text-4xl font-bold text-amber-600">1 200</span>
                <span className="text-muted-foreground">FCFA/semaine</span>
              </div>
              <CardDescription>Augmentez la visibilité d'un produit</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <ul className="space-y-3 text-sm">
                {[
                  'Apparition en priorité dans les résultats',
                  'Mise en avant sur la page d\'accueil',
                  'Badge "Boosté" visible',
                  'Renouvelable et prolongeable',
                  'Suivi individuel par produit',
                  'Historique des boosts'
                ].map((feature, i) => (
                  <li key={i} className="flex items-center gap-2">
                    <Rocket className="h-4 w-4 text-amber-500 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>

            <CardFooter>
              <div className="w-full text-center">
                <p className="text-sm text-muted-foreground">
                  Boostez vos produits depuis votre tableau de bord producteur
                </p>
                <Button variant="outline" className="mt-3 w-full border-amber-300 text-amber-700" asChild>
                  <a href="/dashboard">Accéder au tableau de bord</a>
                </Button>
              </div>
            </CardFooter>
          </Card>
        </section>

        <footer className="text-center mt-8">
          <p className="text-sm text-muted-foreground">
            Paiement sécurisé par Paystack • Facturation en FCFA • Mobile Money accepté
          </p>
        </footer>
      </main>
      <Footer />
    </div>
  );
};

export default Abonnements;
