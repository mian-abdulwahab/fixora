import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

export const useFavorites = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading } = useQuery({
    queryKey: ["favorites", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("favorites" as any)
        .select(`
          id,
          provider_id,
          created_at
        `)
        .eq("user_id", user.id);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const { data: favoriteProviders = [] } = useQuery({
    queryKey: ["favorite-providers", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data: favs, error: favError } = await supabase
        .from("favorites" as any)
        .select("provider_id")
        .eq("user_id", user.id);

      if (favError || !favs?.length) return [];

      const providerIds = favs.map((f: any) => f.provider_id);
      const { data, error } = await supabase
        .from("service_providers")
        .select("id, business_name, avatar_url, rating, total_reviews, location, verified")
        .in("id", providerIds);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const addFavorite = useMutation({
    mutationFn: async (providerId: string) => {
      if (!user?.id) throw new Error("Login required");
      const { error } = await supabase
        .from("favorites" as any)
        .insert({ user_id: user.id, provider_id: providerId });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-providers"] });
      toast({ title: "Added to favorites ❤️" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to add favorite", description: err.message, variant: "destructive" });
    },
  });

  const removeFavorite = useMutation({
    mutationFn: async (providerId: string) => {
      if (!user?.id) throw new Error("Login required");
      const { error } = await supabase
        .from("favorites" as any)
        .delete()
        .eq("user_id", user.id)
        .eq("provider_id", providerId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["favorites"] });
      queryClient.invalidateQueries({ queryKey: ["favorite-providers"] });
      toast({ title: "Removed from favorites" });
    },
    onError: (err: Error) => {
      toast({ title: "Failed to remove", description: err.message, variant: "destructive" });
    },
  });

  const isFavorite = (providerId: string) =>
    favorites.some((f: any) => f.provider_id === providerId);

  const toggleFavorite = (providerId: string) => {
    if (isFavorite(providerId)) {
      removeFavorite.mutate(providerId);
    } else {
      addFavorite.mutate(providerId);
    }
  };

  return {
    favorites,
    favoriteProviders,
    isLoading,
    isFavorite,
    toggleFavorite,
    addFavorite,
    removeFavorite,
  };
};
