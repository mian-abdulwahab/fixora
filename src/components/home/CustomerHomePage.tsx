import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  Star,
  Search,
  ChevronRight,
  Shield,
  Zap
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/useBookings";
import { useServiceProviders } from "@/hooks/useServiceProviders";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";

const CustomerHomePage = () => {
  const { user } = useAuth();
  const { data: bookings = [] } = useMyBookings();
  
  // Fetch customer profile to get their location
  const { data: profile } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Fetch nearby providers based on customer's location
  const { data: allProviders = [] } = useServiceProviders();
  
  // Filter providers by location (simple text match on location)
  const nearbyProviders = allProviders.filter(provider => {
    if (!profile?.address && !provider.location) return true;
    if (!provider.location) return false;
    const customerLocation = (profile?.address || "").toLowerCase();
    const providerLocation = provider.location.toLowerCase();
    // Match if provider's location contains any word from customer's address
    const words = customerLocation.split(/[\s,]+/).filter(w => w.length > 2);
    return words.some(word => providerLocation.includes(word)) || !customerLocation;
  }).slice(0, 4);

  const upcomingBookings = bookings.filter(b => 
    b.status !== "completed" && b.status !== "cancelled"
  ).slice(0, 3);

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
      {/* Welcome Section */}
      <section className="pt-8 pb-6 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 rounded-2xl p-8">
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Welcome back, {user?.user_metadata?.name?.split(" ")[0] || "there"}! 👋
            </h1>
            <p className="text-muted-foreground text-lg mb-6">
              What service do you need today?
            </p>
            <div className="relative max-w-xl">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search for services (e.g., plumbing, cleaning...)"
                className="w-full pl-12 pr-4 py-4 rounded-xl border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary"
                onClick={() => window.location.href = "/services"}
                readOnly
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Link to="/services" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Search className="w-8 h-8 text-primary mx-auto mb-2" />
              <span className="font-medium text-foreground">Browse Services</span>
            </Link>
            <Link to="/ai-analyzer" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Zap className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <span className="font-medium text-foreground">AI Analyzer</span>
            </Link>
            <Link to="/dashboard/bookings" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Calendar className="w-8 h-8 text-accent mx-auto mb-2" />
              <span className="font-medium text-foreground">My Bookings</span>
            </Link>
            <Link to="/dashboard/profile" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Shield className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
              <span className="font-medium text-foreground">My Profile</span>
            </Link>
            <Link to="/how-it-works" className="bg-card rounded-xl p-6 shadow-card hover:shadow-lg transition-shadow text-center">
              <Search className="w-8 h-8 text-accent mx-auto mb-2" />
              <span className="font-medium text-foreground">How It Works</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Upcoming Bookings */}
      {upcomingBookings.length > 0 && (
        <section className="py-6 px-4">
          <div className="container mx-auto">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">Upcoming Bookings</h2>
              <Link to="/dashboard/bookings" className="text-primary text-sm hover:underline">
                View all
              </Link>
            </div>
            <div className="grid gap-4">
              {upcomingBookings.map((booking) => (
                <div key={booking.id} className="bg-card rounded-xl p-5 shadow-card">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-foreground">
                          {(booking as any).services?.title || "Service"}
                        </h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status || "pending")}`}>
                          {(booking.status || "pending").replace("_", " ")}
                        </span>
                      </div>
                      <p className="text-muted-foreground text-sm mb-2">
                        {(booking as any).service_providers?.business_name}
                      </p>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {booking.scheduled_time}
                        </span>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/dashboard/bookings">Details</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Nearby Providers */}
      <section className="py-6 px-4">
        <div className="container mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">
              {profile?.address ? "Providers Near You" : "Featured Providers"}
            </h2>
            <Link to="/services" className="text-primary text-sm hover:underline">
              View all
            </Link>
          </div>
          {nearbyProviders.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {nearbyProviders.map((provider) => (
                <Link
                  key={provider.id}
                  to={`/provider/${provider.id}`}
                  className="bg-card rounded-xl p-5 shadow-card hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                      {provider.avatar_url ? (
                        <img src={provider.avatar_url} alt={provider.business_name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-lg font-bold text-primary">
                          {provider.business_name.charAt(0)}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground truncate group-hover:text-primary transition-colors">
                        {provider.business_name}
                      </h3>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Star className="w-3 h-3 text-accent fill-accent" />
                        <span>{provider.rating ? Number(provider.rating).toFixed(1) : "New"}</span>
                      </div>
                    </div>
                  </div>
                  {provider.location && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span className="truncate">{provider.location}</span>
                    </div>
                  )}
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-card rounded-xl p-8 text-center">
              <p className="text-muted-foreground mb-4">No providers found in your area yet.</p>
              <Button asChild>
                <Link to="/services">Browse All Services</Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 px-4">
        <div className="container mx-auto">
          <div className="bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-center text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Need a Specific Service?
            </h2>
            <p className="text-white/80 mb-6 max-w-md mx-auto">
              Browse our full catalog of verified service providers and book with confidence.
            </p>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/services">
                Explore Services
                <ChevronRight className="w-5 h-5 ml-1" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default CustomerHomePage;
