import { Search, Calendar, CreditCard, ThumbsUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const HowItWorksSection = () => {
  const { t } = useLanguage();

  const steps = [
    { icon: Search, title: t("howItWorks.step1"), description: t("howItWorks.step1Desc"), step: "01" },
    { icon: Calendar, title: t("howItWorks.step2"), description: t("howItWorks.step2Desc"), step: "02" },
    { icon: CreditCard, title: t("howItWorks.step3"), description: t("howItWorks.step3Desc"), step: "03" },
    { icon: ThumbsUp, title: t("howItWorks.step4"), description: t("howItWorks.step4Desc"), step: "04" },
  ];

  return (
    <section className="py-16 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{t("howItWorks.title")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">{t("howItWorks.subtitle")}</h2>
          <p className="text-muted-foreground text-base sm:text-lg">{t("howItWorks.description")}</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-border" />
          {steps.map((step) => (
            <div key={step.step} className="relative text-center group">
              <div className="relative inline-flex">
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-card shadow-card group-hover:shadow-card-hover transition-all duration-300 flex items-center justify-center mb-4 sm:mb-6 relative z-10">
                  <step.icon className="w-8 h-8 sm:w-12 sm:h-12 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-8 h-8 sm:w-10 sm:h-10 rounded-full gradient-hero text-primary-foreground text-xs sm:text-sm font-bold flex items-center justify-center shadow-lg z-20">{step.step}</span>
              </div>
              <h3 className="text-base sm:text-xl font-semibold text-foreground mb-2 sm:mb-3">{step.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm max-w-xs mx-auto">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
