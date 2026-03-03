import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  DollarSign,
  Star,
  ChevronRight,
  Briefcase,
  Users,
  TrendingUp,
  CheckCircle,
  Bell,
  Plus
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import ApplicationStatusBanner from "@/components/provider/ApplicationStatusBanner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

const ProviderHomePage = () => {
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

  // Fetch provider bookings
  const { data: bookings = [] } = useQuery({
    queryKey: ["provider-bookings", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`*, services:service_id (title)`)
        .eq("provider_id", provider.id)
        .order("scheduled_date", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  // Fetch provider services
  const { data: services = [] } = useQuery({
    queryKey: ["provider-services", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", provider.id);
      if (error) throw error;
      return data;
    },
    enabled: !!provider?.id,
  });

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const upcomingBookings = bookings.filter(b => ["confirmed", "in_progress"].includes(b.status || ""));
  const totalEarnings = bookings
    .filter(b => b.payment_status === "paid")
    .reduce((sum, b) => sum + Number(b.total_amount), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed": return "bg-primary/10 text-primary";
      case "pending": return "bg-accent/10 text-accent";
      case "completed": return "bg-emerald-100 text-emerald-700";
      case "cancelled": return "bg-destructive/10 text-destructive";
      case "in_progress": return "bg-blue-100 text-blue-700";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Application Status Banner */}
      {provider && (
        <div className="container mx-auto px-4 pt-6">
          <ApplicationStatusBanner 
            status={(provider.application_status || "pending") as "pending" | "approved" | "rejected"} 
            rejectionReason={provider.rejection_reason}
            providerId={provider.id}
          />
        </div>
      )}

      {/* Welcome Section */}
      <section className="pt-6 pb-6 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-accent/10 to-primary/10 rounded-2xl p-8">
            <div className="flex items-center gap-4 mb-2">
              <Avatar className="w-14 h-14 border-2 border-accent/20">
                <AvatarImage src={provider?.avatar_url || ""} alt={provider?.business_name || "Provider"} />
                <AvatarFallback className="bg-accent/10 text-accent text-xl font-bold">
                  {(provider?.business_name || user?.user_metadata?.name || "P").charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-foreground">
                  Welcome back, {provider?.business_name || user?.user_metadata?.name || "Provider"}! 🛠️
                </h1>
                <p className="text-muted-foreground text-lg">
                  {provider?.verified 
                    ? "Here's your business overview for today."
                    : "Complete your setup and wait for verification."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Pending</span>
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">{pendingBookings.length}</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Upcoming</span>
                <Calendar className="w-5 h-5 text-primary" />
              </div>
              <p className="text-2xl font-bold text-foreground">{upcomingBookings.length}</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Earnings</span>
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">${totalEarnings.toFixed(0)}</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Rating</span>
                <Star className="w-5 h-5 text-accent fill-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">
                {provider?.rating ? Number(provider.rating).toFixed(1) : "N/A"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Link to="/provider-dashboard" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Briefcase className="w-8 h-8 text-primary mx-auto mb-2" />
              <span className="font-medium text-foreground">Dashboard</span>
            </Link>
            <Link to="/provider-dashboard/services" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Plus className="w-8 h-8 text-accent mx-auto mb-2" />
              <span className="font-medium text-foreground">Add Service</span>
            </Link>
            <Link to="/provider-dashboard/bookings" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Calendar className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span className="font-medium text-foreground">Bookings</span>
            </Link>
            <Link to="/provider-dashboard/profile" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Users className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="font-medium text-foreground">Profile</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Pending Bookings */}
      {pendingBookings.length > 0 && (
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Bell className="w-5 h-5 text-accent" />
                Action Required
              </h2>
              <Link to="/provider-dashboard/bookings" className="text-primary text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="grid gap-4">
              {pendingBookings.slice(0, 3).map((booking) => (
                <div key={booking.id} className="bg-card rounded-xl p-5 shadow-card border-l-4 border-accent">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {(booking as any).services?.title || "Service Request"}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status || "pending")}`}>
                          {(booking.status || "pending").replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.scheduled_time}
                        </span>
                        <span className="flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          ${Number(booking.total_amount).toFixed(0)}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" asChild>
                      <Link to="/provider-dashboard/bookings">Respond</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Your Services */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Your Services</h2>
            <Link to="/provider-dashboard/services" className="text-primary text-sm hover:underline">
              Manage
            </Link>
          </div>
          {services.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {services.slice(0, 3).map((service) => (
                <div key={service.id} className="bg-card rounded-xl p-5 shadow-card">
                  <h3 className="font-semibold text-foreground mb-2">{service.title}</h3>
                  <p className="text-muted-foreground text-sm mb-3 line-clamp-2">
                    {service.description || "No description"}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-primary">${service.price}</span>
                    <span className={`px-2 py-1 rounded-full text-xs ${service.is_active ? "bg-emerald-100 text-emerald-700" : "bg-muted text-muted-foreground"}`}>
                      {service.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No services yet. Add your first service to start receiving bookings.</p>
              <Button asChild>
                <Link to="/provider-dashboard/services">
                  <Plus className="w-4 h-4 mr-2" />
                  Add Service
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* Growth Tips */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-accent to-primary rounded-2xl p-8 text-white">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="w-8 h-8" />
              <h2 className="text-2xl font-bold">Grow Your Business</h2>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Complete Your Profile</h3>
                  <p className="text-white/80 text-sm">Add photos and detailed descriptions to attract more customers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Add More Services</h3>
                  <p className="text-white/80 text-sm">Expand your offerings to reach more customers.</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-6 h-6 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-semibold mb-1">Respond Quickly</h3>
                  <p className="text-white/80 text-sm">Fast response times lead to better ratings.</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ProviderHomePage;
