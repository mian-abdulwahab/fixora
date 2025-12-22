import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface PlatformStats {
  verifiedProviders: number;
  averageRating: number;
  totalReviews: number;
  totalJobsCompleted: number;
}

export const usePlatformStats = () => {
  return useQuery({
    queryKey: ["platform-stats"],
    queryFn: async (): Promise<PlatformStats> => {
      // Get verified providers count
      const { count: verifiedProviders } = await supabase
        .from("service_providers")
        .select("*", { count: "exact", head: true })
        .eq("verified", true)
        .eq("is_active", true);

      // Get only safe aggregate fields - no sensitive data
      const { data: providerStats } = await supabase
        .from("service_providers")
        .select("rating, total_reviews, total_jobs")
        .eq("verified", true)
        .eq("is_active", true);

      let totalRating = 0;
      let totalReviews = 0;
      let totalJobsCompleted = 0;
      let ratingCount = 0;

      providerStats?.forEach((p) => {
        if (p.rating && Number(p.rating) > 0) {
          totalRating += Number(p.rating);
          ratingCount++;
        }
        totalReviews += p.total_reviews || 0;
        totalJobsCompleted += p.total_jobs || 0;
      });

      const averageRating = ratingCount > 0 ? totalRating / ratingCount : 0;

      return {
        verifiedProviders: verifiedProviders || 0,
        averageRating: Math.round(averageRating * 10) / 10,
        totalReviews,
        totalJobsCompleted,
      };
    },
    staleTime: 60000, // Cache for 1 minute
  });
};
