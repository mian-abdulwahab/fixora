import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useCustomerCity = () => {
  const { user } = useAuth();

  const { data: customerCity, isLoading } = useQuery({
    queryKey: ["customer-city", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("address")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data?.address || null;
    },
    enabled: !!user?.id,
  });

  return { customerCity, isLoading };
};
