import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface FeaturedProvider {
  id: string;
  business_name: string;
  description: string | null;
  location: string | null;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  verified: boolean;
  avatar_url: string | null;
  banner_image_url: string | null;
  skills: string[] | null;
}

export const useFeaturedProviders = (limit: number = 6) => {
  return useQuery({
    queryKey: ["featured-providers", limit],
    queryFn: async (): Promise<FeaturedProvider[]> => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, business_name, description, location, rating, total_reviews, total_jobs, verified, avatar_url, banner_image_url, skills")
        .eq("verified", true)
        .eq("is_active", true)
        .order("total_jobs", { ascending: false })
        .order("rating", { ascending: false })
        .limit(limit);

      if (error) throw error;
      return (data || []) as FeaturedProvider[];
    },
    staleTime: 60000, // Cache for 1 minute
  });
};
