import { Link } from "react-router-dom";
import { Star, MapPin, TrendingUp, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerCity } from "@/hooks/useCustomerCity";

const SmartRecommendations = () => {
  const { user } = useAuth();
  const { customerCity } = useCustomerCity();

  // Get user's past booking categories
  const { data: recommendations = [], isLoading } = useQuery({
    queryKey: ["smart-recommendations", user?.id, customerCity],
    queryFn: async () => {
      if (!user?.id) return [];

      // 1. Get user's past bookings with service & category info
      const { data: pastBookings } = await supabase
        .from("bookings")
        .select("service_id, provider_id, services(category_id, title)")
        .eq("user_id", user.id)
        .not("service_id", "is", null);

      const bookedProviderIds = new Set(pastBookings?.map((b) => b.provider_id) || []);
      const bookedCategoryIds = new Set(
        pastBookings
          ?.map((b: any) => b.services?.category_id)
          .filter(Boolean) || []
      );

      // 2. Get category names for display
      const categoryIds = [...bookedCategoryIds];
      let categoryMap = new Map<string, string>();
      if (categoryIds.length > 0) {
        const { data: categories } = await supabase
          .from("service_categories")
          .select("id, name")
          .in("id", categoryIds);
        categoryMap = new Map(categories?.map((c) => [c.id, c.name]) || []);
      }

      // 3. Find similar providers (same categories, not yet booked)
      let recommendedProviders: any[] = [];

      if (categoryIds.length > 0) {
        // Get providers in same categories
        const { data: providerCats } = await supabase
          .from("provider_categories")
          .select("provider_id, category_id")
          .in("category_id", categoryIds);

        const similarProviderIds = [
          ...new Set(
            providerCats
              ?.map((pc) => pc.provider_id)
              .filter((pid) => !bookedProviderIds.has(pid)) || []
          ),
        ].slice(0, 10);

        if (similarProviderIds.length > 0) {
          let provQuery = supabase
            .from("service_providers")
            .select("id, business_name, rating, total_reviews, total_jobs, location, avatar_url, verified")
            .in("id", similarProviderIds)
            .eq("is_active", true)
            .order("rating", { ascending: false })
            .limit(4);

          if (customerCity) {
            provQuery = provQuery.eq("location", customerCity);
          }

          const { data: providers } = await provQuery;
          recommendedProviders = providers || [];
        }
      }

      // 4. If not enough recommendations, fill with top-rated providers
      if (recommendedProviders.length < 4) {
        const excludeIds = [
          ...bookedProviderIds,
          ...recommendedProviders.map((p) => p.id),
        ];
        let topQuery = supabase
          .from("service_providers")
          .select("id, business_name, rating, total_reviews, total_jobs, location, avatar_url, verified")
          .eq("is_active", true)
          .not("id", "in", `(${excludeIds.join(",")})`)
          .order("rating", { ascending: false })
          .limit(4 - recommendedProviders.length);

        if (customerCity) {
          topQuery = topQuery.eq("location", customerCity);
        }

        const { data: topProviders } = await topQuery;
        recommendedProviders = [...recommendedProviders, ...(topProviders || [])];
      }

      // 5. Get recommended services from booked categories
      let recommendedServices: any[] = [];
      if (categoryIds.length > 0) {
        const bookedServiceIds = new Set(
          pastBookings?.map((b) => b.service_id).filter(Boolean) || []
        );

        const { data: services } = await supabase
          .from("services")
          .select("id, title, price, price_type, provider_id, category_id, service_providers:provider_id(business_name, rating)")
          .in("category_id", categoryIds)
          .eq("is_active", true)
          .not("id", "in", `(${[...bookedServiceIds].join(",") || "00000000-0000-0000-0000-000000000000"})`)
          .order("created_at", { ascending: false })
          .limit(4);

        recommendedServices = services || [];
      }

      return {
        providers: recommendedProviders,
        services: recommendedServices,
        categories: categoryMap,
        hasHistory: (pastBookings?.length || 0) > 0,
      };
    },
    enabled: !!user?.id,
  });

  if (isLoading) {
    return (
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <Skeleton className="h-6 w-48" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-36 rounded-xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  const data = recommendations as any;
  if (!data?.providers?.length && !data?.services?.length) return null;

  return (
    <section className="py-6 px-4">
      <div className="container mx-auto">
        {/* Recommended Providers */}
        {data.providers?.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-accent" />
              <h2 className="text-xl font-semibold text-foreground">
                {data.hasHistory ? "Recommended For You" : "Top Rated Providers"}
              </h2>
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              {data.hasHistory
                ? "Based on your booking history, you might like these providers"
                : "Discover our highest-rated service providers"}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.providers.map((provider: any) => (
                <Link
                  key={provider.id}
                  to={`/provider/${provider.id}`}
                  className="bg-card rounded-xl p-5 shadow-card hover:shadow-lg transition-all group relative overflow-hidden"
                >
                  {data.hasHistory && (
                    <div className="absolute top-3 right-3">
                      <span className="bg-accent/10 text-accent text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        For You
                      </span>
                    </div>
                  )}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                      {provider.avatar_url ? (
                        <img
                          src={provider.avatar_url}
                          alt={provider.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {provider.business_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {provider.business_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span>
                          {provider.rating
                            ? Number(provider.rating).toFixed(1)
                            : "New"}
                        </span>
                        <span className="text-xs">
                          ({provider.total_reviews || 0} reviews)
                        </span>
                      </div>
                    </div>
                  </div>
                  {provider.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{provider.location}</span>
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {provider.total_jobs || 0} jobs completed
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Services */}
        {data.services?.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Sparkles className="w-5 h-5 text-primary" />
              <h2 className="text-xl font-semibold text-foreground">
                Services You Might Like
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {data.services.map((service: any) => (
                <Link
                  key={service.id}
                  to={`/provider/${service.provider_id}`}
                  className="bg-card rounded-xl p-5 shadow-card hover:shadow-lg transition-all"
                >
                  <h3 className="font-semibold text-foreground mb-1">
                    {service.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mb-2">
                    by {service.service_providers?.business_name || "Provider"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-primary font-bold">
                      Rs. {Number(service.price).toLocaleString()}
                      {service.price_type === "hourly" && "/hr"}
                    </span>
                    {service.service_providers?.rating && (
                      <span className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        {Number(service.service_providers.rating).toFixed(1)}
                      </span>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default SmartRecommendations;
