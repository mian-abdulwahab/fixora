import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { format, isSameDay, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { CalendarDays, Clock, Plus, Trash2, Save } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface BookingCalendarProps {
  providerId: string;
}

const DAYS_OF_WEEK = [
  { value: 0, label: "Sunday" },
  { value: 1, label: "Monday" },
  { value: 2, label: "Tuesday" },
  { value: 3, label: "Wednesday" },
  { value: 4, label: "Thursday" },
  { value: 5, label: "Friday" },
  { value: 6, label: "Saturday" },
];

const TIME_SLOTS = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

const BookingCalendar = ({ providerId }: BookingCalendarProps) => {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isAvailabilityOpen, setIsAvailabilityOpen] = useState(false);
  const [isBlockOpen, setIsBlockOpen] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [newAvailability, setNewAvailability] = useState({
    day_of_week: 1,
    start_time: "09:00",
    end_time: "17:00",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch bookings for the provider
  const { data: bookings = [] } = useQuery({
    queryKey: ["provider-calendar-bookings", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services:service_id (title),
          profiles:user_id (name, email)
        `)
        .eq("provider_id", providerId)
        .in("status", ["confirmed", "in_progress", "pending"]);
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Fetch availability
  const { data: availability = [] } = useQuery({
    queryKey: ["provider-availability", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_availability")
        .select("*")
        .eq("provider_id", providerId)
        .order("day_of_week");
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Fetch blocked dates
  const { data: blockedDates = [] } = useQuery({
    queryKey: ["provider-blocked-dates", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("blocked_dates")
        .select("*")
        .eq("provider_id", providerId);
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Add availability mutation
  const addAvailabilityMutation = useMutation({
    mutationFn: async (data: typeof newAvailability) => {
      const { error } = await supabase.from("provider_availability").upsert({
        provider_id: providerId,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability"] });
      setIsAvailabilityOpen(false);
      toast({ title: "Availability updated!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update availability",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Block date mutation
  const blockDateMutation = useMutation({
    mutationFn: async (date: Date) => {
      const { error } = await supabase.from("blocked_dates").insert({
        provider_id: providerId,
        blocked_date: format(date, "yyyy-MM-dd"),
        reason: blockReason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-blocked-dates"] });
      setIsBlockOpen(false);
      setBlockReason("");
      toast({ title: "Date blocked!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to block date",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Unblock date mutation
  const unblockDateMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("blocked_dates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-blocked-dates"] });
      toast({ title: "Date unblocked!" });
    },
  });

  // Delete availability mutation
  const deleteAvailabilityMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provider_availability").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-availability"] });
      toast({ title: "Availability removed!" });
    },
  });

  const selectedDateBookings = bookings.filter((b) =>
    isSameDay(new Date(b.scheduled_date), selectedDate || new Date())
  );

  const isDateBlocked = (date: Date) =>
    blockedDates.some((bd) => isSameDay(new Date(bd.blocked_date), date));

  const getDateBookingCount = (date: Date) =>
    bookings.filter((b) => isSameDay(new Date(b.scheduled_date), date)).length;

  return (
    <div className="bg-card rounded-2xl shadow-card">
      <div className="p-6 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-3">
          <CalendarDays className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Booking Calendar</h2>
        </div>
        <div className="flex gap-2">
          <Dialog open={isAvailabilityOpen} onOpenChange={setIsAvailabilityOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Clock className="w-4 h-4 mr-2" />
                Set Hours
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Set Working Hours</DialogTitle>
                <DialogDescription>
                  Define your availability for each day of the week
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label>Day of Week</Label>
                  <Select
                    value={newAvailability.day_of_week.toString()}
                    onValueChange={(v) =>
                      setNewAvailability({ ...newAvailability, day_of_week: parseInt(v) })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {DAYS_OF_WEEK.map((day) => (
                        <SelectItem key={day.value} value={day.value.toString()}>
                          {day.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Start Time</Label>
                    <Select
                      value={newAvailability.start_time}
                      onValueChange={(v) =>
                        setNewAvailability({ ...newAvailability, start_time: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>End Time</Label>
                    <Select
                      value={newAvailability.end_time}
                      onValueChange={(v) =>
                        setNewAvailability({ ...newAvailability, end_time: v })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TIME_SLOTS.map((time) => (
                          <SelectItem key={time} value={time}>
                            {time}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <Button
                  onClick={() => addAvailabilityMutation.mutate(newAvailability)}
                  className="w-full"
                  disabled={addAvailabilityMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Availability
                </Button>
              </div>

              {/* Current Availability */}
              {availability.length > 0 && (
                <div className="mt-6 pt-6 border-t border-border">
                  <h4 className="font-medium text-foreground mb-3">Current Schedule</h4>
                  <div className="space-y-2">
                    {availability.map((a) => (
                      <div
                        key={a.id}
                        className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                      >
                        <div>
                          <span className="font-medium">
                            {DAYS_OF_WEEK.find((d) => d.value === a.day_of_week)?.label}
                          </span>
                          <span className="text-muted-foreground ml-2">
                            {a.start_time} - {a.end_time}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteAvailabilityMutation.mutate(a.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={isBlockOpen} onOpenChange={setIsBlockOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Block Date
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Block a Date</DialogTitle>
                <DialogDescription>
                  Mark a date as unavailable for bookings
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 mt-4">
                <Calendar
                  mode="single"
                  selected={selectedDate}
                  onSelect={setSelectedDate}
                  disabled={(date) => date < new Date() || isDateBlocked(date)}
                  className="rounded-md border"
                />
                <div className="space-y-2">
                  <Label>Reason (optional)</Label>
                  <Input
                    placeholder="e.g., Holiday, Personal day"
                    value={blockReason}
                    onChange={(e) => setBlockReason(e.target.value)}
                  />
                </div>
                <Button
                  onClick={() => selectedDate && blockDateMutation.mutate(selectedDate)}
                  className="w-full"
                  disabled={!selectedDate || blockDateMutation.isPending}
                >
                  Block {selectedDate && format(selectedDate, "MMM d, yyyy")}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 p-6">
        {/* Calendar */}
        <div>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            className="rounded-md border p-3"
            modifiers={{
              blocked: (date) => isDateBlocked(date),
              hasBookings: (date) => getDateBookingCount(date) > 0,
            }}
            modifiersStyles={{
              blocked: { backgroundColor: "hsl(var(--destructive) / 0.1)" },
              hasBookings: { backgroundColor: "hsl(var(--primary) / 0.1)" },
            }}
          />

          {/* Blocked Dates List */}
          {blockedDates.length > 0 && (
            <div className="mt-4">
              <h4 className="font-medium text-foreground mb-2">Blocked Dates</h4>
              <div className="space-y-2">
                {blockedDates.map((bd) => (
                  <div
                    key={bd.id}
                    className="flex items-center justify-between p-2 bg-destructive/10 rounded-lg text-sm"
                  >
                    <div>
                      <span className="font-medium">
                        {format(new Date(bd.blocked_date), "MMM d, yyyy")}
                      </span>
                      {bd.reason && (
                        <span className="text-muted-foreground ml-2">- {bd.reason}</span>
                      )}
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => unblockDateMutation.mutate(bd.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Day Details */}
        <div>
          <h3 className="font-semibold text-foreground mb-4">
            {selectedDate ? format(selectedDate, "EEEE, MMMM d, yyyy") : "Select a date"}
          </h3>

          {isDateBlocked(selectedDate || new Date()) ? (
            <div className="p-4 bg-destructive/10 rounded-lg text-center">
              <p className="text-destructive font-medium">This date is blocked</p>
            </div>
          ) : selectedDateBookings.length === 0 ? (
            <div className="p-8 bg-secondary/30 rounded-lg text-center">
              <CalendarDays className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No bookings for this date</p>
            </div>
          ) : (
            <div className="space-y-3">
              {selectedDateBookings.map((booking) => (
                <div
                  key={booking.id}
                  className="p-4 border border-border rounded-lg"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-foreground">
                      {booking.scheduled_time}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        booking.status === "confirmed"
                          ? "bg-primary/10 text-primary"
                          : booking.status === "pending"
                          ? "bg-accent/10 text-accent"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {(booking as any).services?.title || "Service"}
                  </p>
                  <p className="text-sm text-foreground mt-1">
                    {(booking as any).profiles?.name || "Customer"}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">{booking.address}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BookingCalendar;