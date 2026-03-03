import { Link } from "react-router-dom";
import { Star, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFeaturedProviders } from "@/hooks/useFeaturedProviders";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";

const FeaturedProvidersSection = () => {
  const { data: providers = [], isLoading } = useFeaturedProviders(3);
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="py-16 md:py-28 bg-background">
        <div className="container mx-auto px-4">
          <div className="mb-12">
            <Skeleton className="h-6 w-24 mb-4" />
            <Skeleton className="h-10 w-72 mb-2" />
            <Skeleton className="h-5 w-96" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (providers.length === 0) return null;

  return (
    <section className="py-16 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">{t("featured.topRated")}</span>
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-foreground mb-2">{t("featured.title")}</h2>
            <p className="text-muted-foreground text-base sm:text-lg max-w-xl">{t("featured.subtitle")}</p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services">{t("featured.viewAll")}<ArrowRight className="w-4 h-4 ml-2" /></Link>
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {providers.map((provider) => (
            <Link key={provider.id} to={`/provider/${provider.id}`} className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
              <div className="relative h-40 sm:h-48 overflow-hidden bg-secondary">
                {provider.banner_image_url ? (
                  <img src={provider.banner_image_url} alt={provider.business_name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <span className="text-4xl sm:text-5xl font-bold text-muted-foreground">{provider.business_name?.charAt(0) || "P"}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-base sm:text-lg font-semibold text-primary-foreground">{provider.business_name}</h3>
                    {provider.verified && <CheckCircle2 className="w-5 h-5 text-accent" />}
                  </div>
                  {provider.skills && provider.skills.length > 0 && (
                    <span className="text-primary-foreground/80 text-xs sm:text-sm">{provider.skills[0]}</span>
                  )}
                </div>
              </div>

              <div className="p-4 sm:p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 sm:w-5 sm:h-5 text-accent fill-accent" />
                    <span className="font-semibold text-foreground text-sm sm:text-base">{Number(provider.rating || 0).toFixed(1)}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm">({provider.total_reviews || 0})</span>
                  </div>
                  {provider.location && (
                    <div className="flex items-center gap-1 text-muted-foreground text-xs sm:text-sm">
                      <MapPin className="w-3.5 h-3.5" />{provider.location}
                    </div>
                  )}
                </div>

                {provider.skills && provider.skills.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4">
                    {provider.skills.slice(0, 3).map((skill) => (
                      <span key={skill} className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-secondary text-secondary-foreground text-[10px] sm:text-xs font-medium">{skill}</span>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-xs sm:text-sm text-muted-foreground"><span className="font-semibold text-foreground">{provider.total_jobs || 0}</span> {t("featured.jobsCompleted")}</span>
                  <span className="text-primary text-xs sm:text-sm font-medium group-hover:underline">{t("services.viewProfile")}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProvidersSection;
