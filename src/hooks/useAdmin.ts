import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useIsAdmin = () => {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ["isAdmin", user?.id],
    queryFn: async () => {
      if (!user?.id) return false;
      
      const { data, error } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin"
      });
      
      if (error) {
        console.error("Error checking admin role:", error);
        return false;
      }
      
      return data === true;
    },
    enabled: !!user?.id,
  });
};

export const useAllUsers = () => {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: async () => {
      // Fetch profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;

      // Fetch admin roles
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id, role");

      // Fetch provider user_ids
      const { data: providers } = await supabase
        .from("service_providers")
        .select("user_id");

      const adminUserIds = new Set(adminRoles?.filter(r => r.role === "admin").map(r => r.user_id) || []);
      const providerUserIds = new Set(providers?.map(p => p.user_id) || []);

      return (profiles || []).map(profile => ({
        ...profile,
        role: adminUserIds.has(profile.id) 
          ? "admin" 
          : providerUserIds.has(profile.id) 
          ? "provider" 
          : "customer",
      }));
    },
  });
};

export const useAllProviders = () => {
  return useQuery({
    queryKey: ["admin", "providers"],
    queryFn: async () => {
      const { data: providers, error } = await supabase
        .from("service_providers")
        .select("*")
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const userIds = [...new Set(providers?.map(p => p.user_id) || [])];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return providers?.map(provider => ({
        ...provider,
        profile: profileMap.get(provider.user_id) || null,
      })) || [];
    },
  });
};

export const useAllBookings = () => {
  return useQuery({
    queryKey: ["admin", "bookings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          service_providers:provider_id (business_name),
          services:service_id (title)
        `)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(booking => ({
        ...booking,
        profile: profileMap.get(booking.user_id) || null,
      }));
    },
  });
};

export const useAllCategories = () => {
  return useQuery({
    queryKey: ["admin", "categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_categories")
        .select("*")
        .order("name", { ascending: true });
      
      if (error) throw error;
      return data;
    },
  });
};

export const useUpdateProvider = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from("service_providers")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "providers"] });
    },
  });
};

export const useCreateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (category: { name: string; slug: string; description?: string; icon?: string }) => {
      const { data, error } = await supabase
        .from("service_categories")
        .insert(category)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
};

export const useUpdateCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: Record<string, unknown> }) => {
      const { data, error } = await supabase
        .from("service_categories")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
};

export const useDeleteCategory = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("service_categories")
        .delete()
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "categories"] });
    },
  });
};

export const useAdminStats = () => {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [usersRes, providersRes, bookingsRes, categoriesRes, pendingRes] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("service_providers").select("id", { count: "exact", head: true }).eq("application_status", "approved"),
        supabase.from("bookings").select("id, total_amount, payment_status"),
        supabase.from("service_categories").select("id", { count: "exact", head: true }),
        supabase.from("service_providers").select("id", { count: "exact", head: true }).eq("application_status", "pending"),
      ]);

      const bookings = bookingsRes.data || [];
      const totalRevenue = bookings
        .filter(b => b.payment_status === "paid")
        .reduce((sum, b) => sum + Number(b.total_amount), 0);

      return {
        totalUsers: usersRes.count || 0,
        totalProviders: providersRes.count || 0,
        totalBookings: bookings.length,
        totalCategories: categoriesRes.count || 0,
        totalRevenue,
        pendingApplications: pendingRes.count || 0,
      };
    },
  });
};
