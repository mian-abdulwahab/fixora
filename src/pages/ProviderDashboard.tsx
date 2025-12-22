import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { 
  Calendar,
  Clock,
  MapPin,
  Star,
  ChevronRight,
  User,
  Settings,
  CreditCard,
  Bell,
  LogOut,
  Home,
  MessageSquare,
  Briefcase,
  Plus,
  DollarSign,
  Users,
  TrendingUp,
  CheckCircle,
  XCircle,
  Edit
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import ApplicationStatusBanner from "@/components/provider/ApplicationStatusBanner";
import VerifiedBadge from "@/components/ui/VerifiedBadge";
import CitySelect from "@/components/ui/CitySelect";
import MobileSidebar from "@/components/layout/MobileSidebar";
import { useUnreadMessages } from "@/hooks/useUnreadMessages";
import { useMessageNotifications } from "@/hooks/useMessageNotifications";

const sidebarLinks = [
  { icon: Home, label: "Dashboard", href: "/provider-dashboard", active: true },
  { icon: Briefcase, label: "My Services", href: "/provider-dashboard/services" },
  { icon: Calendar, label: "Bookings", href: "/provider-dashboard/bookings" },
  { icon: MessageSquare, label: "Messages", href: "/provider-dashboard/messages" },
  { icon: CreditCard, label: "Earnings", href: "/provider-dashboard/earnings" },
  { icon: Bell, label: "Notifications", href: "/provider-dashboard/notifications" },
  { icon: User, label: "Profile", href: "/provider-dashboard/profile" },
  { icon: Settings, label: "Settings", href: "/provider-dashboard/settings" },
];

const ProviderDashboard = () => {
  const [activeTab, setActiveTab] = useState<"pending" | "upcoming" | "completed">("pending");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [businessData, setBusinessData] = useState({
    business_name: "",
    description: "",
    location: "",
    phone: "",
    email: "",
  });
  const { user, signOut, userRole, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { unreadCount } = useUnreadMessages();
  useMessageNotifications();

  // Redirect non-providers
  useEffect(() => {
    if (!authLoading && (!user || (userRole && userRole !== "provider" && userRole !== "admin"))) {
      navigate("/login");
    }
  }, [user, userRole, authLoading, navigate]);

  // Fetch provider profile
  const { data: provider, isLoading: providerLoading } = useQuery({
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
        .select(`
          *,
          services:service_id (title)
        `)
        .eq("provider_id", provider.id)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      
      // Fetch customer profiles separately
      const userIds = [...new Set(data.map(b => b.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, email, phone")
        .in("id", userIds);
      
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      
      return data.map(booking => ({
        ...booking,
        customer: profileMap.get(booking.user_id) || null,
      }));
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

  // Create provider profile mutation
  const createProviderMutation = useMutation({
    mutationFn: async (data: typeof businessData) => {
      const { error } = await supabase
        .from("service_providers")
        .insert({
          user_id: user!.id,
          ...data,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
      setIsSetupOpen(false);
      toast({
        title: "Business profile created!",
        description: "You can now add your services.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update booking status mutation
  const updateBookingMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      toast({ title: "Booking updated!" });
    },
  });

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessData.business_name) {
      toast({
        title: "Business name required",
        description: "Please enter your business name.",
        variant: "destructive",
      });
      return;
    }
    createProviderMutation.mutate(businessData);
  };

  if (authLoading || providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return null;

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const upcomingBookings = bookings.filter(b => ["confirmed", "in_progress"].includes(b.status || ""));
  const completedBookings = bookings.filter(b => ["completed", "cancelled"].includes(b.status || ""));

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

  const currentBookings = activeTab === "pending" 
    ? pendingBookings 
    : activeTab === "upcoming" 
    ? upcomingBookings 
    : completedBookings;

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <div className="pt-20 md:pt-24 flex">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col w-64 min-h-[calc(100vh-6rem)] bg-card border-r border-border p-4">
          <div className="flex items-center gap-3 p-4 mb-4">
            <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-accent" />
            </div>
            <div>
              <p className="font-semibold text-foreground">{provider?.business_name || user?.user_metadata?.name || "Provider"}</p>
              <p className="text-sm text-muted-foreground">Service Provider</p>
            </div>
          </div>

          <nav className="flex-1 space-y-1">
            {sidebarLinks.map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  link.active
                    ? "bg-accent/10 text-accent"
                    : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                }`}
              >
                <link.icon className="w-5 h-5" />
                {link.label}
              </Link>
            ))}
          </nav>

          <button 
            onClick={handleSignOut}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 transition-colors mt-4"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 md:p-8">
          <div className="max-w-5xl mx-auto">
            {/* No Provider Profile - Show Setup */}
            {!provider && (
              <div className="bg-card rounded-2xl shadow-card p-8 text-center">
                <Briefcase className="w-16 h-16 text-accent mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-foreground mb-2">Set Up Your Business Profile</h2>
                <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                  Create your business profile to start receiving bookings and growing your business on Fixora.
                </p>
                <Dialog open={isSetupOpen} onOpenChange={setIsSetupOpen}>
                  <DialogTrigger asChild>
                    <Button size="lg">
                      <Plus className="w-5 h-5 mr-2" />
                      Create Business Profile
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-lg">
                    <DialogHeader>
                      <DialogTitle>Create Your Business Profile</DialogTitle>
                      <DialogDescription>
                        Enter your business details to get started.
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateProfile} className="space-y-4 mt-4">
                      <div>
                        <Label htmlFor="business_name">Business Name *</Label>
                        <Input
                          id="business_name"
                          value={businessData.business_name}
                          onChange={(e) => setBusinessData({ ...businessData, business_name: e.target.value })}
                          placeholder="e.g., John's Plumbing Services"
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                          id="description"
                          value={businessData.description}
                          onChange={(e) => setBusinessData({ ...businessData, description: e.target.value })}
                          placeholder="Describe your services..."
                          rows={3}
                        />
                      </div>
                      <div>
                        <Label htmlFor="location">City</Label>
                        <CitySelect
                          value={businessData.location}
                          onChange={(value) => setBusinessData({ ...businessData, location: value })}
                          placeholder="Select your city..."
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="phone">Phone</Label>
                          <Input
                            id="phone"
                            value={businessData.phone}
                            onChange={(e) => setBusinessData({ ...businessData, phone: e.target.value })}
                            placeholder="(555) 123-4567"
                          />
                        </div>
                        <div>
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={businessData.email}
                            onChange={(e) => setBusinessData({ ...businessData, email: e.target.value })}
                            placeholder="contact@business.com"
                          />
                        </div>
                      </div>
                      <Button type="submit" className="w-full" disabled={createProviderMutation.isPending}>
                        {createProviderMutation.isPending ? "Creating..." : "Create Profile"}
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            )}

            {/* Provider Dashboard Content */}
            {provider && (
              <>
                {/* Application Status Banner */}
                <ApplicationStatusBanner 
                  status={(provider as any).application_status || "pending"} 
                  rejectionReason={(provider as any).rejection_reason}
                  providerId={provider.id}
                />

                {/* Header */}
                <div className="mb-8">
                  <div className="flex items-center gap-2 mb-2">
                    <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                      Welcome back, {provider.business_name}!
                    </h1>
                    {provider.verified && <VerifiedBadge size="lg" />}
                  </div>
                  <p className="text-muted-foreground">
                    {provider.verified 
                      ? "Manage your bookings, services, and grow your business."
                      : "Complete your profile while waiting for verification."}
                  </p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
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
                      <span className="text-muted-foreground text-sm">Jobs Completed</span>
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{provider.total_jobs || 0}</p>
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
                      {provider.rating ? Number(provider.rating).toFixed(1) : "N/A"}
                    </p>
                  </div>
                </div>

                {/* Services Quick View */}
                <div className="bg-card rounded-2xl shadow-card p-6 mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-foreground">Your Services</h2>
                    <Button variant="outline" size="sm" asChild>
                      <Link to="/provider-dashboard/services">
                        <Plus className="w-4 h-4 mr-1" />
                        Add Service
                      </Link>
                    </Button>
                  </div>
                  {services.length === 0 ? (
                    <p className="text-muted-foreground text-center py-8">
                      No services yet. Add your first service to start receiving bookings.
                    </p>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {services.slice(0, 3).map((service) => (
                        <div key={service.id} className="border border-border rounded-lg p-4">
                          <h3 className="font-medium text-foreground">{service.title}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            ${Number(service.price).toFixed(0)} / {service.price_type}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bookings */}
                <div className="bg-card rounded-2xl shadow-card">
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <h2 className="text-xl font-semibold text-foreground">Bookings</h2>
                      <div className="flex gap-2">
                        {["pending", "upcoming", "completed"].map((tab) => (
                          <button
                            key={tab}
                            onClick={() => setActiveTab(tab as typeof activeTab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                              activeTab === tab
                                ? "bg-primary text-primary-foreground"
                                : "text-muted-foreground hover:bg-secondary"
                            }`}
                          >
                            {tab} {tab === "pending" && pendingBookings.length > 0 && `(${pendingBookings.length})`}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {currentBookings.length > 0 ? (
                      currentBookings.map((booking) => (
                        <div key={booking.id} className="p-6 hover:bg-secondary/50 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <h3 className="font-semibold text-foreground">
                                  {booking.services?.title || "Service"}
                                </h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status || "pending")}`}>
                                  {(booking.status || "pending").replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-muted-foreground text-sm mb-2">
                                Customer: {booking.customer?.name || "Unknown"}
                              </p>
                              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="w-4 h-4" />
                                  {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {booking.scheduled_time}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {booking.address}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="text-lg font-semibold text-foreground">
                                ${Number(booking.total_amount).toFixed(0)}
                              </span>
                              {booking.status === "pending" && (
                                <>
                                  <Button
                                    size="sm"
                                    onClick={() => updateBookingMutation.mutate({ id: booking.id, status: "confirmed" })}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-1" />
                                    Accept
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => updateBookingMutation.mutate({ id: booking.id, status: "cancelled" })}
                                  >
                                    <XCircle className="w-4 h-4 mr-1" />
                                    Decline
                                  </Button>
                                </>
                              )}
                              {booking.status === "confirmed" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingMutation.mutate({ id: booking.id, status: "in_progress" })}
                                >
                                  Start Job
                                </Button>
                              )}
                              {booking.status === "in_progress" && (
                                <Button
                                  size="sm"
                                  onClick={() => updateBookingMutation.mutate({ id: booking.id, status: "completed" })}
                                >
                                  Complete
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="p-12 text-center">
                        <p className="text-muted-foreground">No {activeTab} bookings found.</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </main>

        {/* Mobile Sidebar */}
        <MobileSidebar
          links={sidebarLinks.map(link => ({
            ...link,
            label: link.label === "Messages" && unreadCount > 0 ? `Messages (${unreadCount})` : link.label
          }))}
          onSignOut={handleSignOut}
          userInfo={{
            name: provider?.business_name || user?.user_metadata?.name || "Provider",
            subtitle: "Service Provider",
            icon: Briefcase,
            iconBgClass: "bg-accent/10",
            iconClass: "text-accent",
          }}
        />
      </div>
    </div>
  );
};

export default ProviderDashboard;