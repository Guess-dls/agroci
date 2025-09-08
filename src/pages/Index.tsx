import { Header } from "@/components/Header";
import { HeroSection } from "@/components/HeroSection";
import { PopularProducts } from "@/components/PopularProducts";
import { UserSections } from "@/components/UserSections";
import { Footer } from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <HeroSection />
      <PopularProducts />
      <UserSections />
      <Footer />
    </div>
  );
};

export default Index;
