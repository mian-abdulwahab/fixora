import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { 
  Clock, 
  CheckCircle2, 
  XCircle, 
  PlayCircle, 
  Send,
  Loader2
} from "lucide-react";

interface StatusHistoryItem {
  id: string;
  booking_id: string;
  status: string;
  changed_by: string | null;
  note: string | null;
  created_at: string;
}

const STATUS_CONFIG: Record<string, {
  label: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
}> = {
  pending: {
    label: "Booking Submitted",
    icon: Send,
    color: "text-amber-600",
    bgColor: "bg-amber-100",
  },
  confirmed: {
    label: "Provider Accepted",
    icon: CheckCircle2,
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  in_progress: {
    label: "Work In Progress",
    icon: PlayCircle,
    color: "text-blue-600",
    bgColor: "bg-blue-100",
  },
  completed: {
    label: "Job Completed",
    icon: CheckCircle2,
    color: "text-emerald-600",
    bgColor: "bg-emerald-100",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

const EXPECTED_FLOW = ["pending", "confirmed", "in_progress", "completed"];

interface BookingTrackingTimelineProps {
  bookingId: string;
  currentStatus: string;
}

const BookingTrackingTimeline = ({ bookingId, currentStatus }: BookingTrackingTimelineProps) => {
  const [realtimeHistory, setRealtimeHistory] = useState<StatusHistoryItem[]>([]);

  const { data: history = [], isLoading } = useQuery({
    queryKey: ["booking-status-history", bookingId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("booking_status_history")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as StatusHistoryItem[];
    },
    enabled: !!bookingId,
  });

  // Real-time subscription for live updates
  useEffect(() => {
    const channel = supabase
      .channel(`booking-tracking-${bookingId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "booking_status_history",
          filter: `booking_id=eq.${bookingId}`,
        },
        (payload) => {
          setRealtimeHistory((prev) => [...prev, payload.new as StatusHistoryItem]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [bookingId]);

  const allHistory = [...history, ...realtimeHistory.filter(
    (rt) => !history.some((h) => h.id === rt.id)
  )];

  const completedStatuses = new Set(allHistory.map((h) => h.status));
  const isCancelled = currentStatus === "cancelled";

  // Determine the flow to show
  const flowToShow = isCancelled
    ? [...allHistory.map(h => h.status)]
    : EXPECTED_FLOW;

  // Remove duplicates while keeping order
  const uniqueFlow = [...new Set(flowToShow)];

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 p-4">
        <Loader2 className="w-4 h-4 animate-spin text-primary" />
        <span className="text-sm text-muted-foreground">Loading tracking...</span>
      </div>
    );
  }

  return (
    <div className="py-2">
      {/* Progress bar */}
      <div className="flex items-center gap-1 mb-4">
        {EXPECTED_FLOW.map((status, index) => {
          const isCompleted = completedStatuses.has(status);
          const isCurrent = status === currentStatus;
          return (
            <div
              key={status}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${
                isCompleted || isCurrent
                  ? isCancelled
                    ? "bg-destructive"
                    : "bg-primary"
                  : "bg-border"
              }`}
            />
          );
        })}
      </div>

      {/* Timeline */}
      <div className="space-y-0">
        {uniqueFlow.map((status, index) => {
          const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
          const Icon = config.icon;
          const historyItem = allHistory.find((h) => h.status === status);
          const isCompleted = completedStatuses.has(status);
          const isCurrent = status === currentStatus;
          const isFuture = !isCompleted && !isCurrent;

          return (
            <div key={status} className="flex items-start gap-3">
              {/* Timeline line & dot */}
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all ${
                    isCurrent
                      ? `${config.bgColor} ${config.color} ring-2 ring-offset-2 ring-primary/30`
                      : isCompleted
                      ? `${config.bgColor} ${config.color}`
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {isCurrent && !isCancelled ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Icon className="w-4 h-4" />
                  )}
                </div>
                {index < uniqueFlow.length - 1 && (
                  <div
                    className={`w-0.5 h-8 ${
                      isCompleted ? "bg-primary/30" : "bg-border"
                    }`}
                  />
                )}
              </div>

              {/* Content */}
              <div className={`pb-4 ${isFuture ? "opacity-40" : ""}`}>
                <p
                  className={`text-sm font-medium ${
                    isCurrent ? "text-foreground" : isCompleted ? "text-foreground" : "text-muted-foreground"
                  }`}
                >
                  {config.label}
                </p>
                {historyItem && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {format(new Date(historyItem.created_at), "MMM d, yyyy 'at' h:mm a")}
                  </p>
                )}
                {isCurrent && !isCancelled && status !== "completed" && (
                  <p className="text-xs text-primary mt-0.5 font-medium">Current status</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default BookingTrackingTimeline;
