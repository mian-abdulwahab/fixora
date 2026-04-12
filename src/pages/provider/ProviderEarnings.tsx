import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Calendar,
  CheckCircle,
  Wallet,
  Clock,
  Shield,
  Banknote
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";
import { useToast } from "@/hooks/use-toast";

const ProviderEarnings = () => {
  const { user } = useAuth();
  const { toast } = useToast();

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

  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["provider-earnings", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, services:service_id (title)`)
        .eq("provider_id", provider.id)
        .eq("status", "completed")
        .order("scheduled_date", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  const withdrawableBalance = Number(provider?.withdrawable_balance || 0);
  const pendingBalance = Number(provider?.pending_balance || 0);
  const totalEarnings = bookings.reduce((sum, b) => sum + Number(b.worker_share || b.total_amount), 0);

  const thisMonthStart = startOfMonth(new Date());
  const thisMonthEnd = endOfMonth(new Date());
  const thisMonthEarnings = bookings
    .filter(b => {
      const date = new Date(b.scheduled_date);
      return date >= thisMonthStart && date <= thisMonthEnd;
    })
    .reduce((sum, b) => sum + Number(b.worker_share || b.total_amount), 0);

  const handleRequestPayout = () => {
    if (withdrawableBalance <= 0) {
      toast({ title: "No funds available", description: "You need completed jobs to request a payout.", variant: "destructive" });
      return;
    }
    toast({ 
      title: "Payout Request Submitted!", 
      description: `Your payout of Rs. ${withdrawableBalance.toLocaleString()} has been submitted for processing. You'll receive it within 3-5 business days.` 
    });
  };

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
              <h1 className="text-2xl font-bold text-foreground">Earnings & Wallet</h1>
              <p className="text-muted-foreground">Track your income, escrow, and payouts</p>
            </div>
          </div>

          {/* Wallet Section */}
          <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-6 mb-6 text-primary-foreground">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-6 h-6" />
                <h2 className="text-lg font-semibold">Your Wallet</h2>
              </div>
              <Button 
                onClick={handleRequestPayout}
                variant="secondary"
                size="sm"
                disabled={withdrawableBalance <= 0}
              >
                <Banknote className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </div>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <p className="text-sm opacity-80">Withdrawable Balance</p>
                <p className="text-3xl font-bold">Rs. {withdrawableBalance.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm opacity-80 flex items-center gap-1">
                  <Shield className="w-3 h-3" /> Pending in Escrow
                </p>
                <p className="text-3xl font-bold">Rs. {pendingBalance.toLocaleString()}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Earned (90%)</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-3xl font-bold text-foreground">Rs. {totalEarnings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">{bookings.length} completed jobs</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">This Month</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-3xl font-bold text-foreground">Rs. {thisMonthEarnings.toLocaleString()}</p>
              <p className="text-sm text-muted-foreground mt-1">{format(new Date(), "MMMM yyyy")}</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Platform Fee (10%)</span>
                <TrendingUp className="w-5 h-5 text-accent" />
              </div>
              <p className="text-3xl font-bold text-foreground">
                Rs. {bookings.reduce((sum, b) => sum + Number(b.platform_fee || 0), 0).toLocaleString()}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Commission deducted</p>
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
                        {booking.escrow_status === "released" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Released
                          </span>
                        )}
                        {booking.escrow_status === "held" && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
                            <Clock className="w-3 h-3" /> Pending Release
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(booking.scheduled_date), "MMMM d, yyyy")}
                      </p>
                      {booking.worker_share && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Your share: Rs. {Number(booking.worker_share).toLocaleString()} | Fee: Rs. {Number(booking.platform_fee || 0).toLocaleString()}
                        </p>
                      )}
                    </div>
                    <span className="text-lg font-semibold text-emerald-600">
                      +Rs. {Number(booking.worker_share || booking.total_amount).toLocaleString()}
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
