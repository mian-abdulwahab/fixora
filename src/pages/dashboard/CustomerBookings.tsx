import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  Calendar,
  Clock,
  MapPin,
  ArrowLeft,
  Filter,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useMyBookings } from "@/hooks/useBookings";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import BookingActions from "@/components/booking/BookingActions";
import ProviderContactInfo from "@/components/booking/ProviderContactInfo";
import BookingTrackingTimeline from "@/components/booking/BookingTrackingTimeline";
import PaymentReceiptUpload from "@/components/booking/PaymentReceiptUpload";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const CustomerBookings = () => {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: bookings = [], isLoading } = useMyBookings();

  const { data: userReviews = [] } = useQuery({
    queryKey: ["user-reviews", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("user_id", user.id);
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const reviewedBookingIds = new Set(userReviews.map(r => r.booking_id));

  const getStatusColor = (status: string) => {
    switch (status) {
      case "confirmed":
        return "bg-primary/10 text-primary";
      case "pending":
        return "bg-accent/10 text-accent";
      case "completed":
        return "bg-emerald-100 text-emerald-700";
      case "cancelled":
        return "bg-destructive/10 text-destructive";
      case "in_progress":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const filteredBookings = statusFilter === "all" 
    ? bookings 
    : bookings.filter(b => b.status === statusFilter);

  const toggleExpand = (bookingId: string) => {
    setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="pt-20 md:pt-24 container mx-auto px-4 pb-12">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">My Bookings</h1>
              <p className="text-muted-foreground">View and manage all your service bookings</p>
            </div>
          </div>

          <div className="flex items-center gap-4 mb-6">
            <Filter className="w-5 h-5 text-muted-foreground" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Bookings</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="in_progress">In Progress</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="bg-card rounded-2xl shadow-card divide-y divide-border">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : filteredBookings.length > 0 ? (
              filteredBookings.map((booking) => {
                const isExpanded = expandedBooking === booking.id;
                return (
                  <div key={booking.id} className="hover:bg-secondary/30 transition-colors">
                    <div
                      className="p-6 cursor-pointer"
                      onClick={() => toggleExpand(booking.id)}
                    >
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold text-foreground">
                              {booking.services?.title || "Service"}
                            </h3>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status)}`}>
                              {booking.status.replace("_", " ")}
                            </span>
                          </div>
                          <p className="text-muted-foreground text-sm mb-2">
                            {booking.service_providers?.business_name}
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
                        <div className="flex items-center gap-4">
                          <span className="text-lg font-semibold text-foreground">
                            Rs. {Number(booking.total_amount).toLocaleString()}
                          </span>
                          <BookingActions 
                            booking={{
                              id: booking.id,
                              status: booking.status,
                              provider_id: booking.provider_id,
                              service_providers: booking.service_providers,
                            }}
                            hasReview={reviewedBookingIds.has(booking.id)}
                          />
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleExpand(booking.id);
                            }}
                            className="p-1 rounded-lg hover:bg-secondary transition-colors"
                          >
                            {isExpanded ? (
                              <ChevronUp className="w-5 h-5 text-muted-foreground" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-muted-foreground" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Expanded section: Timeline + Payment */}
                    {isExpanded && (
                      <div className="px-6 pb-6 border-t border-border/50 pt-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          {/* Tracking Timeline */}
                          <div>
                            <h4 className="text-sm font-semibold text-foreground mb-3">
                              Booking Progress
                            </h4>
                            <BookingTrackingTimeline
                              bookingId={booking.id}
                              currentStatus={booking.status}
                            />
                          </div>

                          {/* Payment & Contact */}
                          <div className="space-y-4">
                            {/* Contact info for confirmed+ */}
                            {["confirmed", "in_progress", "completed"].includes(booking.status) && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">
                                  Provider Contact
                                </h4>
                                <ProviderContactInfo 
                                  providerId={booking.provider_id} 
                                  bookingStatus={booking.status} 
                                />
                              </div>
                            )}

                            {/* Payment receipt upload for non-cash methods */}
                            {booking.status !== "cancelled" && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-2">
                                  Payment
                                </h4>
                                <PaymentReceiptUpload
                                  bookingId={booking.id}
                                  paymentMethod={(booking as any).payment_method}
                                  paymentStatus={booking.payment_status}
                                  existingReceiptUrl={(booking as any).payment_receipt_url}
                                />
                              </div>
                            )}

                            {/* Notes */}
                            {booking.notes && (
                              <div>
                                <h4 className="text-sm font-semibold text-foreground mb-1">
                                  Job Notes
                                </h4>
                                <p className="text-sm text-muted-foreground bg-secondary/50 p-3 rounded-lg">
                                  {booking.notes}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              <div className="p-12 text-center">
                <p className="text-muted-foreground mb-4">No bookings found.</p>
                <Button asChild>
                  <Link to="/services">Browse Services</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerBookings;
