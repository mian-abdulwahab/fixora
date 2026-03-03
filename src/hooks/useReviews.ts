import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Review {
  id: string;
  booking_id: string;
  user_id: string;
  provider_id: string;
  rating: number;
  comment: string | null;
  punctuality_rating: number | null;
  quality_rating: number | null;
  value_rating: number | null;
  communication_rating: number | null;
  created_at: string;
  profiles?: {
    name: string | null;
    avatar_url: string | null;
  };
}

export const useProviderReviews = (providerId: string) => {
  return useQuery({
    queryKey: ["provider-reviews", providerId],
    queryFn: async () => {
      const { data: reviews, error } = await supabase
        .from("reviews")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles for each review
      const userIds = reviews.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", userIds);

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);

      return reviews.map(review => ({
        ...review,
        profiles: profileMap.get(review.user_id) || undefined,
      })) as Review[];
    },
    enabled: !!providerId,
  });
};

export const useCreateReview = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      booking_id: string;
      provider_id: string;
      rating: number;
      comment?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: review, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return review;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["provider-reviews", variables.provider_id] });
      queryClient.invalidateQueries({ queryKey: ["service-provider", variables.provider_id] });
    },
  });
};
