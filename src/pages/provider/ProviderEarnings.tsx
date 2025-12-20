import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const ProviderEarnings = () => {
  const { user } = useAuth();

  // Fetch provider profile
  const { data: provider } = useQuery({
    queryKey: ["my-provider-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch completed bookings for earnings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["provider-earnings", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services:service_id (title)
        `)
        .eq("provider_id", provider.id)
        .eq("status", "completed")
        .order("scheduled_date", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  const totalEarnings = bookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  
  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const thisMonthEarnings = bookings
    .filter(b => {
      const date = new Date(b.scheduled_date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    })
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const last7DaysEarnings = bookings
    .filter(b => new Date(b.scheduled_date) >= subDays(new Date(), 7))
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="pt-20 md:pt-24 pb-12">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/provider-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Earnings</h1>
              <p className="text-muted-foreground">Track your income and completed jobs</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Earnings</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-foreground">${totalEarnings.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{bookings.length} completed jobs</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">This Month</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">${thisMonthEarnings.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "MMMM yyyy")}</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Last 7 Days</span>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-3xl font-bold text-foreground">${last7DaysEarnings.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground mt-1">Recent earnings</p>
            </div>
          </div>

          {/* Transactions */}
          <div className="bg-card rounded-2xl shadow-card">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Completed Jobs</h2>
            </div>
            <div className="divide-y divide-border">
              {bookings.length > 0 ? (
                bookings.map((booking) => (
                  <div key={booking.id} className="p-6 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <h3 className="font-medium text-foreground">
                          {booking.services?.title || "Service"}
                        </h3>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "MMMM d, yyyy")}
                      </p>
                    </div>
                    <span className="text-lg font-semibold text-emerald-600">
                      +${Number(booking.total_amount).toFixed(0)}
                    </span>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <DollarSign className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed jobs yet.</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Complete jobs to see your earnings here.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProviderEarnings;
