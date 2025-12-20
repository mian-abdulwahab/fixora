import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  CreditCard,
  ArrowLeft,
  DollarSign,
  Calendar,
  CheckCircle,
  Clock
} from "lucide-react";
import { useMyBookings } from "@/hooks/useBookings";
import { format } from "date-fns";

const CustomerPayments = () => {
  const { data: bookings = [], isLoading } = useMyBookings();

  const paidBookings = bookings.filter(b => b.payment_status === "paid");
  const pendingBookings = bookings.filter(b => b.payment_status === "pending" && b.status !== "cancelled");

  const totalPaid = paidBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);
  const totalPending = pendingBookings.reduce((sum, b) => sum + Number(b.total_amount), 0);

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-accent/10 text-accent";
      case "refunded":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-muted text-muted-foreground";
    }
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Payments</h1>
              <p className="text-muted-foreground">View your payment history and pending payments</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Total Paid</span>
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <p className="text-2xl font-bold text-foreground">${totalPaid.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">{paidBookings.length} payments</p>
            </div>
            <div className="bg-card rounded-xl shadow-card p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-muted-foreground text-sm">Pending Payments</span>
                <Clock className="w-5 h-5 text-accent" />
              </div>
              <p className="text-2xl font-bold text-foreground">${totalPending.toFixed(0)}</p>
              <p className="text-sm text-muted-foreground">{pendingBookings.length} pending</p>
            </div>
          </div>

          {/* Payment History */}
          <div className="bg-card rounded-2xl shadow-card">
            <div className="p-6 border-b border-border">
              <h2 className="text-xl font-semibold text-foreground">Payment History</h2>
            </div>
            
            <div className="divide-y divide-border">
              {isLoading ? (
                <div className="p-12 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                </div>
              ) : bookings.filter(b => b.status !== "cancelled").length > 0 ? (
                bookings.filter(b => b.status !== "cancelled").map((booking) => (
                  <div key={booking.id} className="p-6 hover:bg-secondary/50 transition-colors">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center shrink-0">
                          <DollarSign className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div>
                          <h3 className="font-medium text-foreground">
                            {booking.services?.title || "Service Payment"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {booking.service_providers?.business_name}
                          </p>
                          <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                            <Calendar className="w-4 h-4" />
                            {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentStatusColor(booking.payment_status)}`}>
                          {booking.payment_status}
                        </span>
                        <span className="text-lg font-semibold text-foreground">
                          ${Number(booking.total_amount).toFixed(0)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <CreditCard className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground mb-4">No payment history yet.</p>
                  <Button asChild>
                    <Link to="/services">Browse Services</Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerPayments;
