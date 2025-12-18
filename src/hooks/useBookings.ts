import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface Booking {
  id: string;
  user_id: string;
  provider_id: string;
  service_id: string | null;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled";
  scheduled_date: string;
  scheduled_time: string;
  address: string;
  notes: string | null;
  total_amount: number;
  payment_status: "pending" | "paid" | "refunded";
  payment_intent_id: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  service_providers?: {
    business_name: string;
    avatar_url: string | null;
  };
  services?: {
    title: string;
  } | null;
}

export const useMyBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["my-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service_providers(business_name, avatar_url),
          services(title)
        `)
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Booking[];
    },
    enabled: !!user,
  });
};

export const useProviderBookings = () => {
  const { user } = useAuth();

  return useQuery({
    queryKey: ["provider-bookings", user?.id],
    queryFn: async () => {
      if (!user) return [];

      // First get the provider profile
      const { data: provider } = await supabase
        .from("service_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!provider) return [];

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:user_id(name, email),
          services(title)
        `)
        .eq("provider_id", provider.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (data: {
      provider_id: string;
      service_id?: string;
      scheduled_date: string;
      scheduled_time: string;
      address: string;
      notes?: string;
      total_amount: number;
    }) => {
      if (!user) throw new Error("Not authenticated");

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          ...data,
        })
        .select()
        .single();

      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: Booking["status"] }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
    },
  });
};
