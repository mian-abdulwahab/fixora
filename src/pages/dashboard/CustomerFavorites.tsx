import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, Star, MapPin, CheckCircle2 } from "lucide-react";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";

const CustomerFavorites = () => {
  const { favoriteProviders, isLoading, toggleFavorite } = useFavorites();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="pt-20 md:pt-24 container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground flex items-center gap-2">
                <Heart className="w-6 h-6 text-red-500 fill-red-500" /> {t("customer.favorites")}
              </h1>
              <p className="text-muted-foreground">{favoriteProviders.length} saved providers</p>
            </div>
          </div>

          {isLoading ? (
            <div className="grid gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-card rounded-xl p-6 animate-pulse">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl bg-muted" />
                    <div className="flex-1 space-y-2">
                      <div className="h-5 bg-muted rounded w-1/3" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : favoriteProviders.length === 0 ? (
            <div className="text-center py-16 bg-card rounded-2xl shadow-card">
              <Heart className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-foreground mb-2">{t("customer.noFavorites")}</h2>
              <p className="text-muted-foreground mb-6">Browse services and save providers you like!</p>
              <Button asChild>
                <Link to="/services">{t("customer.browseServices")}</Link>
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {favoriteProviders.map((provider: any) => (
                <Link
                  key={provider.id}
                  to={`/provider/${provider.id}`}
                  className="bg-card rounded-xl p-6 shadow-card hover:shadow-card-hover transition-all flex items-center gap-4 group"
                >
                  {provider.avatar_url ? (
                    <img src={provider.avatar_url} alt={provider.business_name} className="w-16 h-16 rounded-xl object-cover" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                      <span className="text-2xl font-bold text-primary">{provider.business_name?.charAt(0)}</span>
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">{provider.business_name}</h3>
                      {provider.verified && <CheckCircle2 className="w-4 h-4 text-primary" />}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                      <span className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-accent fill-accent" />
                        {Number(provider.rating || 0).toFixed(1)} ({provider.total_reviews || 0})
                      </span>
                      {provider.location && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> {provider.location}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button size="sm">{t("services.bookNow")}</Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-500"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); toggleFavorite(provider.id); }}
                    >
                      <Heart className="w-5 h-5 fill-red-500" />
                    </Button>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default CustomerFavorites;
