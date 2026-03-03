import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Shield, Clock, Star, Briefcase } from "lucide-react";
import { useState } from "react";
import { usePlatformStats } from "@/hooks/usePlatformStats";
import { useLanguage } from "@/contexts/LanguageContext";
import CitySelect from "@/components/ui/CitySelect";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");
  const navigate = useNavigate();
  const { data: stats, isLoading: statsLoading } = usePlatformStats();
  const { t } = useLanguage();

  const handleSearch = () => {
    const params = new URLSearchParams();
    if (searchQuery) params.set("q", searchQuery);
    if (location) params.set("location", location);
    navigate(`/services?${params.toString()}`);
  };

  const displayStats = [
    { icon: Shield, value: statsLoading ? "..." : (stats?.verifiedProviders || 0).toString(), label: t("cta.verifiedPros") },
    { icon: Star, value: statsLoading ? "..." : (stats?.averageRating ? stats.averageRating.toFixed(1) : "N/A"), label: t("providerDash.rating") },
    { icon: Briefcase, value: statsLoading ? "..." : (stats?.totalJobsCompleted || 0).toString(), label: t("provider.jobsCompleted") },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            {t("hero.trusted")} {statsLoading ? "..." : ((stats?.totalJobsCompleted || 0) > 0 ? `${stats?.totalJobsCompleted}+` : "")}
          </div>

          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in-up delay-100">
            {t("hero.title")}
          </h1>

          <p className="text-base sm:text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
            {t("hero.subtitle")}
          </p>

          <div className="bg-primary-foreground rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto animate-fade-in-up delay-300">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder={t("hero.searchPlaceholder")}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                  className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1">
                <CitySelect value={location} onChange={setLocation} placeholder={t("hero.yourCity")} className="h-12 md:h-14 bg-secondary/50 border-0" />
              </div>
              <Button variant="accent" size="xl" className="md:w-auto" onClick={handleSearch}>
                {t("hero.cta")}
              </Button>
            </div>
          </div>

          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up delay-400">
            <span className="text-primary-foreground/60 text-sm">{t("hero.popular")}</span>
            {["Plumbing", "Electrical", "AC Repair", "Painting"].map((service) => (
              <Link
                key={service}
                to={`/services?q=${service.toLowerCase()}`}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm font-medium transition-colors"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 max-w-3xl mx-auto">
          {displayStats.map((stat, index) => (
            <div key={stat.label} className="flex items-center justify-center gap-3 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm animate-fade-in-up" style={{ animationDelay: `${500 + index * 100}ms` }}>
              <stat.icon className="w-7 h-7 sm:w-8 sm:h-8 text-accent" />
              <div className="text-left">
                <div className="text-xl sm:text-2xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-xs sm:text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
