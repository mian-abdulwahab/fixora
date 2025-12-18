import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface ServiceProvider {
  id: string;
  user_id: string;
  business_name: string;
  description: string | null;
  location: string | null;
  latitude: number | null;
  longitude: number | null;
  rating: number;
  total_reviews: number;
  total_jobs: number;
  verified: boolean;
  avatar_url: string | null;
  banner_image_url: string | null;
  phone: string | null;
  email: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useServiceProviders = (categorySlug?: string) => {
  return useQuery({
    queryKey: ["service-providers", categorySlug],
    queryFn: async () => {
      let query = supabase
        .from("service_providers")
        .select(`
          *,
          provider_categories!inner(
            category_id,
            service_categories!inner(slug)
          )
        `)
        .eq("is_active", true)
        .order("rating", { ascending: false });

      if (categorySlug && categorySlug !== "all") {
        query = query.eq("provider_categories.service_categories.slug", categorySlug);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data as ServiceProvider[];
    },
  });
};

export const useServiceProvider = (id: string) => {
  return useQuery({
    queryKey: ["service-provider", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceProvider | null;
    },
    enabled: !!id,
  });
};

export const useMyProviderProfile = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-provider-profile", user?.id],
    queryFn: async () => {
      if (!user) return null;

      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return data as ServiceProvider | null;
    },
    enabled: !!user,
  });
};

export const useCreateProviderProfile = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      business_name: string;
      description?: string;
      location?: string;
      phone?: string;
      email?: string;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: provider, error } = await supabase
        .from("service_providers")
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return provider;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
    },
  });
};
