import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shield, Clock, Wallet } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const CTASection = () => {
  const { t } = useLanguage();

  const benefits = [
    { icon: Shield, text: t("cta.verifiedPros") },
    { icon: Clock, text: t("cta.quickResponse") },
    { icon: Wallet, text: t("cta.securePayments") },
  ];

  return (
    <section className="py-16 md:py-28 gradient-hero relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-64 h-64 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-primary-foreground mb-6">{t("cta.title")}</h2>
          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-8 max-w-2xl mx-auto">{t("cta.subtitle")}</p>

          <div className="flex flex-wrap justify-center gap-4 sm:gap-6 mb-10">
            {benefits.map((benefit) => (
              <div key={benefit.text} className="flex items-center gap-2 text-primary-foreground/90">
                <benefit.icon className="w-5 h-5 text-accent" />
                <span className="text-xs sm:text-sm font-medium">{benefit.text}</span>
              </div>
            ))}
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button variant="accent" size="xl" asChild>
              <Link to="/services">{t("cta.findProvider")}<ArrowRight className="w-5 h-5 ml-2" /></Link>
            </Button>
            <Button variant="hero-outline" size="xl" asChild>
              <Link to="/become-provider">{t("cta.becomeProvider")}</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
