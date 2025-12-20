import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  ArrowLeft,
  User,
  Phone,
  FileText
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import BookingActions from "@/components/booking/BookingActions";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const ProviderBookings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"pending" | "upcoming" | "completed">("pending");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);

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

  // Fetch bookings
  const { data: bookings = [], isLoading } = useQuery({
    queryKey: ["provider-bookings", provider?.id],
    queryFn: async () => {
      if (!provider?.id) return [];
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services:service_id (title, price)
        `)
        .eq("provider_id", provider.id)
        .order("scheduled_date", { ascending: true });
      
      if (error) throw error;
      
      // Fetch customer profiles
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

  const pendingBookings = bookings.filter(b => b.status === "pending");
  const upcomingBookings = bookings.filter(b => ["confirmed", "in_progress"].includes(b.status || ""));
  const completedBookings = bookings.filter(b => ["completed", "cancelled"].includes(b.status || ""));

  const currentBookings = activeTab === "pending" 
    ? pendingBookings 
    : activeTab === "upcoming" 
    ? upcomingBookings 
    : completedBookings;

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
        <div className="container mx-auto px-4 max-w-5xl">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/provider-dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Bookings</h1>
              <p className="text-muted-foreground">Manage your customer bookings</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-accent">{pendingBookings.length}</p>
              <p className="text-sm text-muted-foreground">Pending</p>
            </div>
            <div className="bg-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-primary">{upcomingBookings.length}</p>
              <p className="text-sm text-muted-foreground">Upcoming</p>
            </div>
            <div className="bg-card rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-emerald-600">{completedBookings.length}</p>
              <p className="text-sm text-muted-foreground">Completed</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="bg-card rounded-2xl shadow-card">
            <div className="p-4 border-b border-border flex gap-2">
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
                  {tab}
                </button>
              ))}
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
                        <div className="flex items-center gap-2 mb-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">{booking.customer?.name || "Customer"}</span>
                          {booking.customer?.phone && (
                            <>
                              <span className="text-muted-foreground">•</span>
                              <Phone className="w-4 h-4 text-muted-foreground" />
                              <span className="text-muted-foreground">{booking.customer.phone}</span>
                            </>
                          )}
                        </div>
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
                        <Button 
                          variant="ghost" 
                          size="sm"
                          onClick={() => setSelectedBooking(booking)}
                        >
                          <FileText className="w-4 h-4 mr-1" />
                          Details
                        </Button>
                        <BookingActions 
                          booking={{
                            id: booking.id,
                            status: booking.status || "pending",
                            provider_id: booking.provider_id,
                            user_id: booking.user_id,
                            services: booking.services,
                          }} 
                          isProvider={true}
                        />
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
        </div>
      </main>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
          </DialogHeader>
          {selectedBooking && (
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Service</p>
                <p className="font-medium text-foreground">{selectedBooking.services?.title}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Customer</p>
                <p className="font-medium text-foreground">{selectedBooking.customer?.name}</p>
                {selectedBooking.customer?.email && (
                  <p className="text-sm text-muted-foreground">{selectedBooking.customer.email}</p>
                )}
                {selectedBooking.customer?.phone && (
                  <p className="text-sm text-muted-foreground">{selectedBooking.customer.phone}</p>
                )}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Date</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(selectedBooking.scheduled_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Time</p>
                  <p className="font-medium text-foreground">{selectedBooking.scheduled_time}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="font-medium text-foreground">{selectedBooking.address}</p>
              </div>
              {selectedBooking.notes && (
                <div>
                  <p className="text-sm text-muted-foreground">Work Notes</p>
                  <p className="font-medium text-foreground">{selectedBooking.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Amount</p>
                <p className="text-xl font-bold text-primary">
                  ${Number(selectedBooking.total_amount).toFixed(0)}
                </p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ProviderBookings;
