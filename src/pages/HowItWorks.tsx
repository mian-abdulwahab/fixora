import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { Shield, Clock, Wallet, Star, CheckCircle2, Users } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorks = () => {
  const { t } = useLanguage();

  const features = [
    { icon: Shield, title: t("howItWorksPage.verified"), description: t("howItWorksPage.verifiedDesc") },
    { icon: Clock, title: t("howItWorksPage.fastResponse"), description: t("howItWorksPage.fastResponseDesc") },
    { icon: Wallet, title: t("howItWorksPage.securePayments"), description: t("howItWorksPage.securePaymentsDesc") },
    { icon: Star, title: t("howItWorksPage.qualityGuaranteed"), description: t("howItWorksPage.qualityGuaranteedDesc") },
    { icon: CheckCircle2, title: t("howItWorksPage.transparentPricing"), description: t("howItWorksPage.transparentPricingDesc") },
    { icon: Users, title: t("howItWorksPage.support247"), description: t("howItWorksPage.support247Desc") },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-20 md:pt-24">
        <section className="py-12 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{t("howItWorks.title")}</span>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">{t("howItWorksPage.heroTitle")}</h1>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">{t("howItWorksPage.heroSubtitle")}</p>
          </div>
        </section>

        <HowItWorksSection />

        <section className="py-16 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{t("howItWorksPage.whyChoose")}</span>
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">{t("howItWorksPage.advantage")}</h2>
              <p className="text-muted-foreground text-base sm:text-lg">{t("howItWorksPage.advantageDesc")}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {features.map((feature) => (
                <div key={feature.title} className="bg-card rounded-2xl shadow-card p-5 sm:p-6 hover:shadow-card-hover transition-all duration-300">
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-base sm:text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <CTASection />
      </main>
      <Footer />
    </div>
  );
};

export default HowItWorks;
