import { useAuth } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HeroSection from "@/components/home/HeroSection";
import ServicesSection from "@/components/home/ServicesSection";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import FeaturedProvidersSection from "@/components/home/FeaturedProvidersSection";
import CTASection from "@/components/home/CTASection";
import CustomerHomePage from "@/components/home/CustomerHomePage";
import ProviderHomePage from "@/components/home/ProviderHomePage";

const Index = () => {
  const { user, userRole, loading } = useAuth();

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Render personalized home page based on role
  if (user && userRole === "user") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <CustomerHomePage />
        </main>
        <Footer />
      </div>
    );
  }

  if (user && userRole === "provider") {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <ProviderHomePage />
        </main>
        <Footer />
      </div>
    );
  }

  // Default: Guest home page
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main>
        <HeroSection />
        <ServicesSection />
        <HowItWorksSection />
        <FeaturedProvidersSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
