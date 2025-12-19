import { useState } from "react";
import { useAllBookings } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Search, Calendar, DollarSign, Eye, CheckCircle, XCircle, Clock, MoreHorizontal } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

const AdminBookings: React.FC = () => {
  const { data: bookings = [], isLoading } = useAllBookings();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "confirmed" | "completed" | "cancelled">("all");
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const filteredBookings = bookings.filter(booking => {
    const matchesSearch = 
      booking.profile?.name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.service_providers?.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      booking.services?.title?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    return matchesSearch && booking.status === activeTab;
  });

  // Count bookings by status
  const pendingCount = bookings.filter(b => b.status === "pending").length;
  const confirmedCount = bookings.filter(b => b.status === "confirmed").length;
  const completedCount = bookings.filter(b => b.status === "completed").length;
  const cancelledCount = bookings.filter(b => b.status === "cancelled").length;

  const updateBookingStatus = async (id: string, status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      toast.success(`Booking status updated to ${status}`);
    } catch (error) {
      toast.error("Failed to update booking status");
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: "pending" | "paid" | "refunded") => {
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ payment_status })
        .eq("id", id);
      
      if (error) throw error;
      
      queryClient.invalidateQueries({ queryKey: ["admin", "bookings"] });
      toast.success(`Payment status updated to ${payment_status}`);
    } catch (error) {
      toast.error("Failed to update payment status");
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "confirmed":
        return <Badge className="bg-blue-100 text-blue-700">Confirmed</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "completed":
        return <Badge className="bg-emerald-100 text-emerald-700">Completed</Badge>;
      case "cancelled":
        return <Badge className="bg-destructive/10 text-destructive">Cancelled</Badge>;
      case "in_progress":
        return <Badge className="bg-purple-100 text-purple-700">In Progress</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getPaymentBadge = (status: string | null) => {
    switch (status) {
      case "paid":
        return <Badge className="bg-emerald-100 text-emerald-700">Paid</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-700">Pending</Badge>;
      case "refunded":
        return <Badge className="bg-purple-100 text-purple-700">Refunded</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
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

      {/* Stats Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-amber-600 mb-1">
            <Clock className="w-4 h-4" />
            <span className="text-sm font-medium">Pending</span>
          </div>
          <p className="text-2xl font-bold">{pendingCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Confirmed</span>
          </div>
          <p className="text-2xl font-bold">{confirmedCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <p className="text-2xl font-bold">{completedCount}</p>
        </div>
        <div className="bg-card rounded-lg p-4 border border-border">
          <div className="flex items-center gap-2 text-destructive mb-1">
            <XCircle className="w-4 h-4" />
            <span className="text-sm font-medium">Cancelled</span>
          </div>
          <p className="text-2xl font-bold">{cancelledCount}</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="all">All ({bookings.length})</TabsTrigger>
          <TabsTrigger value="pending">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="confirmed">Confirmed ({confirmedCount})</TabsTrigger>
          <TabsTrigger value="completed">Completed ({completedCount})</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled ({cancelledCount})</TabsTrigger>
        </TabsList>

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
                  <TableHead>Date & Time</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredBookings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
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
                        <div className="flex flex-col">
                          <span className="text-foreground">
                            {format(new Date(booking.scheduled_date), "MMM d, yyyy")}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {booking.scheduled_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 font-medium">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          {Number(booking.total_amount).toFixed(0)}
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(booking.status)}
                      </TableCell>
                      <TableCell>
                        {getPaymentBadge(booking.payment_status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedBooking(booking);
                              setDetailsDialogOpen(true);
                            }}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => updateBookingStatus(booking.id, "confirmed")}
                                disabled={booking.status === "confirmed"}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-blue-600" />
                                Mark Confirmed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateBookingStatus(booking.id, "in_progress")}
                                disabled={booking.status === "in_progress"}
                              >
                                <Clock className="w-4 h-4 mr-2 text-purple-600" />
                                Mark In Progress
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateBookingStatus(booking.id, "completed")}
                                disabled={booking.status === "completed"}
                              >
                                <CheckCircle className="w-4 h-4 mr-2 text-emerald-600" />
                                Mark Completed
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updateBookingStatus(booking.id, "cancelled")}
                                disabled={booking.status === "cancelled"}
                                className="text-destructive"
                              >
                                <XCircle className="w-4 h-4 mr-2" />
                                Cancel Booking
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => updatePaymentStatus(booking.id, "paid")}
                                disabled={booking.payment_status === "paid"}
                              >
                                <DollarSign className="w-4 h-4 mr-2 text-emerald-600" />
                                Mark as Paid
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => updatePaymentStatus(booking.id, "refunded")}
                                disabled={booking.payment_status === "refunded"}
                              >
                                <DollarSign className="w-4 h-4 mr-2 text-purple-600" />
                                Mark as Refunded
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </Tabs>

      {/* Booking Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Booking Details</DialogTitle>
            <DialogDescription>
              Complete information about this booking
            </DialogDescription>
          </DialogHeader>
          
          {selectedBooking && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Booking ID</p>
                  <p className="font-mono text-sm">{selectedBooking.id.slice(0, 8)}...</p>
                </div>
                <div className="flex gap-2">
                  {getStatusBadge(selectedBooking.status)}
                  {getPaymentBadge(selectedBooking.payment_status)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Customer</p>
                  <p className="font-medium">{selectedBooking.profile?.name || "Unknown"}</p>
                  <p className="text-muted-foreground">{selectedBooking.profile?.email}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Provider</p>
                  <p className="font-medium">{selectedBooking.service_providers?.business_name || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Service</p>
                  <p className="font-medium">{selectedBooking.services?.title || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Amount</p>
                  <p className="font-medium">${Number(selectedBooking.total_amount).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Date</p>
                  <p className="font-medium">
                    {format(new Date(selectedBooking.scheduled_date), "MMMM d, yyyy")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Time</p>
                  <p className="font-medium">{selectedBooking.scheduled_time}</p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Address</p>
                <p className="text-foreground">{selectedBooking.address}</p>
              </div>

              {selectedBooking.notes && (
                <div>
                  <p className="text-muted-foreground text-sm mb-1">Notes</p>
                  <p className="text-foreground text-sm">{selectedBooking.notes}</p>
                </div>
              )}

              <div>
                <p className="text-muted-foreground text-sm">Created on</p>
                <p className="text-sm">
                  {selectedBooking.created_at 
                    ? format(new Date(selectedBooking.created_at), "MMMM d, yyyy 'at' h:mm a") 
                    : "—"}
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;