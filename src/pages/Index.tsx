import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PopularProducts } from "@/components/PopularProducts";
import { UserSections } from "@/components/UserSections";
import { Footer } from "@/components/Footer";
import SEOHead from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead 
        title="Vente de produits vivriers en gros"
        description="AgroCI est la plateforme de référence pour la vente de produits vivriers en gros en Côte d'Ivoire. Connectez producteurs et acheteurs directement via WhatsApp. Maïs, riz, manioc, igname."
        keywords="produits vivriers, agriculture Côte d'Ivoire, vente en gros, maïs, riz, manioc, igname, producteurs agricoles, acheteurs, WhatsApp, Abidjan"
        canonicalUrl="https://agroci.lovable.app/"
      />
      <Header />
      <main>
        <HeroSection />
        <PopularProducts />
        <UserSections />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
