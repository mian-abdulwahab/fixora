import { useState } from "react";
import { useAllBookings } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Search, Calendar, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminBookings = () => {
  const { data: bookings = [], isLoading } = useAllBookings();
  const [search, setSearch] = useState("");

  const filteredBookings = bookings.filter(booking => 
    booking.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
    booking.service_providers?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    booking.services?.title?.toLowerCase().includes(search.toLowerCase())
  );

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

  const getPaymentColor = (status: string) => {
    switch (status) {
      case "paid":
        return "bg-emerald-100 text-emerald-700";
      case "pending":
        return "bg-accent/10 text-accent";
      case "refunded":
        return "bg-purple-100 text-purple-700";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Bookings</h1>
        <p className="text-muted-foreground">View and manage all bookings on the platform.</p>
      </div>

      <div className="bg-card rounded-xl shadow-card">
        <div className="p-4 border-b border-border">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search bookings..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Service</TableHead>
                <TableHead>Provider</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBookings.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    No bookings found
                  </TableCell>
                </TableRow>
              ) : (
                filteredBookings.map((booking) => (
                  <TableRow key={booking.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium text-foreground">{booking.profile?.name || "Unknown"}</p>
                        <p className="text-sm text-muted-foreground">{booking.profile?.email}</p>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {booking.services?.title || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {booking.service_providers?.business_name || "—"}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <Calendar className="w-4 h-4" />
                        {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1 font-medium">
                        <DollarSign className="w-4 h-4 text-muted-foreground" />
                        {Number(booking.total_amount).toFixed(0)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getStatusColor(booking.status || "pending")}`}>
                        {booking.status?.replace("_", " ") || "pending"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium capitalize ${getPaymentColor(booking.payment_status || "pending")}`}>
                        {booking.payment_status || "pending"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminBookings;
