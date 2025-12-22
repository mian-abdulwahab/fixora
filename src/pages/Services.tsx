import { useState, useMemo, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Star, CheckCircle2, MapPin } from "lucide-react";
import SearchFilters, { SearchFiltersState } from "@/components/services/SearchFilters";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { matchProvider, fuzzyMatch } from "@/lib/searchUtils";
import { useCustomerCity } from "@/hooks/useCustomerCity";

const categories = [
  { id: "all", name: "All Services" },
  { id: "plumbing", name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "hvac", name: "HVAC" },
  { id: "carpentry", name: "Carpentry" },
  { id: "painting", name: "Painting" },
  { id: "appliance", name: "Appliances" },
  { id: "handyman", name: "Handyman" },
  { id: "landscaping", name: "Landscaping" },
];

const Services = () => {
  const [searchParams] = useSearchParams();
  const { customerCity } = useCustomerCity();
  const [filters, setFilters] = useState<SearchFiltersState>({
    searchQuery: searchParams.get("q") || "",
    category: searchParams.get("category") || "all",
    location: searchParams.get("location") || "",
    minRating: 0,
    priceRange: [0, 500],
    sortBy: "rating",
    verifiedOnly: false,
  });

  // Auto-set location from customer's city when available
  useEffect(() => {
    if (customerCity && !filters.location && !searchParams.get("location")) {
      setFilters(prev => ({ ...prev, location: customerCity }));
    }
  }, [customerCity, searchParams]);

  // Fetch providers from database - only show verified/approved providers
  const { data: providers = [], isLoading } = useQuery({
    queryKey: ["service-providers", filters.category],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select(`
          *,
          services:services(*, service_categories(slug, name)),
          provider_categories(
            category_id,
            service_categories(slug, name)
          )
        `)
        .eq("is_active", true)
        .eq("verified", true)
        .order("rating", { ascending: false });
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
  });

  // Fetch categories from database
  const { data: dbCategories = [] } = useQuery({
    queryKey: ["service-categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .eq("is_active", true);
      
      if (error) throw error;
      return [{ id: "all", name: "All Services" }, ...data.map(c => ({ id: c.slug, name: c.name }))];
    },
  });

  const filteredProviders = useMemo(() => {
    return providers.filter((provider: any) => {
      // Fuzzy text search - matches business name, description, and skills
      const matchesSearch = matchProvider(provider, filters.searchQuery);
      
      // Location filter with fuzzy matching
      const matchesLocation = !filters.location || 
        fuzzyMatch(provider.location || '', filters.location);
      
      // Rating filter
      const matchesRating = Number(provider.rating || 0) >= filters.minRating;
      
      // Verified filter
      const matchesVerified = !filters.verifiedOnly || provider.verified;
      
      // Price filter (check if any service falls within range)
      const services = provider.services || [];
      const matchesPrice = services.length === 0 || services.some((s: any) => {
        const price = Number(s.price || 0);
        return price >= filters.priceRange[0] && price <= filters.priceRange[1];
      });

      // Category filter (supports either provider_categories OR service.category)
      const providerCategories = provider.provider_categories || [];
      const providerServices = provider.services || [];
      const matchesCategory =
        filters.category === "all" ||
        providerCategories.some((pc: any) => {
          const catSlug = pc.service_categories?.slug || "";
          const catName = pc.service_categories?.name || "";
          return (
            catSlug === filters.category ||
            fuzzyMatch(catSlug, filters.category) ||
            fuzzyMatch(catName, filters.category)
          );
        }) ||
        providerServices.some((s: any) => {
          const catSlug = s.service_categories?.slug || "";
          const catName = s.service_categories?.name || "";
          return (
            catSlug === filters.category ||
            fuzzyMatch(catSlug, filters.category) ||
            fuzzyMatch(catName, filters.category) ||
            fuzzyMatch(s.title || "", filters.category)
          );
        });

      return matchesSearch && matchesLocation && matchesRating && matchesVerified && matchesPrice && matchesCategory;
    });
  }, [providers, filters]);

  const sortedProviders = useMemo(() => {
    return [...filteredProviders].sort((a, b) => {
      switch (filters.sortBy) {
        case "rating":
          return Number(b.rating || 0) - Number(a.rating || 0);
        case "reviews":
          return Number(b.total_reviews || 0) - Number(a.total_reviews || 0);
        case "jobs":
          return Number(b.total_jobs || 0) - Number(a.total_jobs || 0);
        case "price_low":
          const aMinPrice = Math.min(...((a as any).services || []).map((s: any) => Number(s.price || 0)), 999999);
          const bMinPrice = Math.min(...((b as any).services || []).map((s: any) => Number(s.price || 0)), 999999);
          return aMinPrice - bMinPrice;
        case "price_high":
          const aMaxPrice = Math.max(...((a as any).services || []).map((s: any) => Number(s.price || 0)), 0);
          const bMaxPrice = Math.max(...((b as any).services || []).map((s: any) => Number(s.price || 0)), 0);
          return bMaxPrice - aMaxPrice;
        default:
          return 0;
      }
    });
  }, [filteredProviders, filters.sortBy]);

  const getMinPrice = (provider: any) => {
    const services = provider.services || [];
    if (services.length === 0) return null;
    const minPrice = Math.min(...services.map((s: any) => Number(s.price || 0)));
    return `From $${minPrice}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Search Header */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">Find Service Providers</h1>
            
            <SearchFilters
              filters={filters}
              onFiltersChange={setFilters}
              categories={dbCategories.length > 0 ? dbCategories : categories}
            />
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedProviders.length}</span> providers found
            </p>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-card rounded-2xl shadow-card overflow-hidden animate-pulse">
                  <div className="h-48 bg-muted" />
                  <div className="p-5 space-y-3">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                    <div className="h-4 bg-muted rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Provider Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {sortedProviders.map((provider) => (
                  <Link
                    key={provider.id}
                    to={`/provider/${provider.id}`}
                    className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
                  >
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-secondary">
                      {provider.banner_image_url ? (
                        <img
                          src={provider.banner_image_url}
                          alt={provider.business_name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <span className="text-4xl font-bold text-muted-foreground">
                            {provider.business_name?.charAt(0) || "P"}
                          </span>
                        </div>
                      )}
                      {getMinPrice(provider) && (
                        <div className="absolute top-4 right-4">
                          <span className="px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-sm font-medium text-foreground">
                            {getMinPrice(provider)}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                          {provider.business_name}
                        </h3>
                        {provider.verified && (
                          <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {provider.description || "Professional service provider"}
                      </p>

                      <div className="flex items-center gap-4 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-accent fill-accent" />
                          <span className="font-medium text-foreground">
                            {Number(provider.rating || 0).toFixed(1)}
                          </span>
                          <span className="text-muted-foreground text-sm">
                            ({provider.total_reviews || 0})
                          </span>
                        </div>
                        {provider.location && (
                          <div className="flex items-center gap-1 text-muted-foreground text-sm">
                            <MapPin className="w-4 h-4" />
                            {provider.location}
                          </div>
                        )}
                      </div>

                      {/* Skills */}
                      {provider.skills && provider.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-3">
                          {provider.skills.slice(0, 3).map((skill: string, index: number) => (
                            <span
                              key={index}
                              className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary"
                            >
                              {skill}
                            </span>
                          ))}
                          {provider.skills.length > 3 && (
                            <span className="px-2 py-0.5 text-xs rounded-full bg-muted text-muted-foreground">
                              +{provider.skills.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      <div className="flex items-center justify-between pt-4 border-t border-border">
                        <span className="text-sm text-muted-foreground">
                          <span className="font-semibold text-foreground">
                            {provider.total_jobs || 0}
                          </span>{" "}
                          jobs
                        </span>
                        <Button size="sm">Book Now</Button>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {sortedProviders.length === 0 && (
                <div className="text-center py-16">
                  <p className="text-muted-foreground text-lg mb-4">
                    No providers found matching your criteria.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() =>
                      setFilters({
                        searchQuery: "",
                        category: "all",
                        location: "",
                        minRating: 0,
                        priceRange: [0, 500],
                        sortBy: "rating",
                        verifiedOnly: false,
                      })
                    }
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;