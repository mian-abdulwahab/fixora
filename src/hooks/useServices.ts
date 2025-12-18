import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  provider_id: string;
  category_id: string | null;
  title: string;
  description: string | null;
  price: number;
  price_type: "fixed" | "hourly" | "starting_from";
  duration_minutes: number | null;
  image_url: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useProviderServices = (providerId: string) => {
  return useQuery({
    queryKey: ["provider-services", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", providerId)
        .eq("is_active", true)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!providerId,
  });
};
