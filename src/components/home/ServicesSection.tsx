import { Link } from "react-router-dom";
import { Droplets, Zap, Wind, Hammer, Paintbrush, Home, Wrench, Leaf, ArrowRight } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const ServicesSection = () => {
  const { t } = useLanguage();

  const services = [
    { id: "plumbing", name: t("category.plumbing"), description: t("category.plumbingDesc"), icon: Droplets, color: "from-blue-500 to-blue-600" },
    { id: "electrical", name: t("category.electrical"), description: t("category.electricalDesc"), icon: Zap, color: "from-yellow-500 to-orange-500" },
    { id: "hvac", name: t("category.hvac"), description: t("category.hvacDesc"), icon: Wind, color: "from-cyan-500 to-teal-500" },
    { id: "carpentry", name: t("category.carpentry"), description: t("category.carpentryDesc"), icon: Hammer, color: "from-amber-500 to-amber-600" },
    { id: "painting", name: t("category.painting"), description: t("category.paintingDesc"), icon: Paintbrush, color: "from-purple-500 to-pink-500" },
    { id: "appliance", name: t("category.appliances"), description: t("category.appliancesDesc"), icon: Home, color: "from-slate-500 to-slate-600" },
    { id: "handyman", name: t("category.handyman"), description: t("category.handymanDesc"), icon: Wrench, color: "from-emerald-500 to-green-600" },
    { id: "landscaping", name: t("category.landscaping"), description: t("category.landscapingDesc"), icon: Leaf, color: "from-green-500 to-emerald-500" },
  ];

  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{t("services.ourServices")}</span>
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-4">{t("services.professionalServices")}</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {services.map((service, index) => (
            <Link key={service.id} to={`/services?category=${service.id}`}
              className="group relative bg-card rounded-2xl p-4 sm:p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              <div className={`w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-3 sm:mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
              </div>
              <h3 className="text-sm sm:text-lg font-semibold text-foreground mb-1 sm:mb-2 group-hover:text-primary transition-colors">{service.name}</h3>
              <p className="text-xs sm:text-sm text-muted-foreground mb-3 sm:mb-4 line-clamp-2">{service.description}</p>
              <div className="hidden sm:flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                {t("category.browseServices")}
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center mt-8 sm:mt-12">
          <Link to="/services" className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all">
            {t("services.viewAllServices")}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
