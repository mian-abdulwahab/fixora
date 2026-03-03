import { Link } from "react-router-dom";
import { Star, MapPin, CheckCircle2, Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const FavoriteProviders = () => {
  const { favoriteProviders, isLoading, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  if (isLoading || favoriteProviders.length === 0) return null;

  return (
    <section className="py-6 px-4">
      <div className="container mx-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" />
            {t("customer.favorites")}
          </h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {favoriteProviders.map((provider: any) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
              className="bg-card rounded-xl p-4 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group"
            >
              {provider.avatar_url ? (
                <img
                  src={provider.avatar_url}
                  alt={provider.business_name}
                  className="w-14 h-14 rounded-xl object-cover"
                />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">
                    {provider.business_name?.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1">
                  <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                    {provider.business_name}
                  </h3>
                  {provider.verified && <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />}
                </div>
                <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                  <span className="flex items-center gap-1">
                    <Star className="w-3.5 h-3.5 text-accent fill-accent" />
                    {Number(provider.rating || 0).toFixed(1)}
                  </span>
                  {provider.location && (
                    <span className="flex items-center gap-1 truncate">
                      <MapPin className="w-3.5 h-3.5" />
                      {provider.location}
                    </span>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="text-red-500 shrink-0"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  toggleFavorite(provider.id);
                }}
              >
                <Heart className="w-5 h-5 fill-red-500" />
              </Button>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FavoriteProviders;
