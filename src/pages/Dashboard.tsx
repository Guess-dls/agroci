import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";
import { ProducerDashboard } from "@/components/ProducerDashboard";
import { BuyerDashboard } from "@/components/BuyerDashboard";
import { Loader2 } from "lucide-react";

interface Profile {
  user_type: 'producteur' | 'acheteur' | 'admin';
  nom: string;
  prenom: string;
}

const Dashboard = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_type, nom, prenom')
        .eq('user_id', user!.id)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
        navigate('/auth');
        return;
      }

      setProfile(data);
    } catch (error) {
      console.error('Error:', error);
      navigate('/auth');
    } finally {
      setLoadingProfile(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Chargement de votre espace...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">Erreur lors du chargement du profil</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Tableau de bord
          </h1>
          <p className="text-muted-foreground">
            Bienvenue {profile.prenom} {profile.nom}
          </p>
        </div>

        {profile.user_type === 'producteur' ? (
          <ProducerDashboard />
        ) : (
          <BuyerDashboard />
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;