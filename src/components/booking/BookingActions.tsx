import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import ReviewDialog from "./ReviewDialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface BookingActionsProps {
  booking: {
    id: string;
    status: string;
    provider_id: string;
    user_id?: string;
    service_providers?: {
      business_name: string;
      user_id?: string;
    };
    services?: {
      title: string;
      price?: number;
    } | null;
  };
  isProvider?: boolean;
  hasReview?: boolean;
}

const BookingActions = ({ booking, isProvider = false, hasReview = false }: BookingActionsProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Helper to create notification via secure edge function
  const createNotification = async (userId: string, title: string, message: string, type: string) => {
    try {
      const { error } = await supabase.functions.invoke('create-notification', {
        body: {
          userId,
          title,
          message,
          type,
          relatedId: booking.id,
          relatedType: "booking",
        }
      });
      if (error) {
        console.error("Failed to create notification:", error);
      }
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  // Helper to send booking email
  const sendBookingEmail = async (emailType: string) => {
    try {
      await supabase.functions.invoke('send-booking-email', {
        body: { type: emailType, bookingId: booking.id }
      });
    } catch (err) {
      console.error("Email send error:", err);
    }
  };

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updateData: Record<string, unknown> = { status: newStatus };
      
      // If completing, also increment total_jobs and update payment
      if (newStatus === "completed") {
        // Update the booking with payment status
        const { error } = await supabase
          .from("bookings")
          .update({ 
            status: newStatus,
            payment_status: "paid" 
          })
          .eq("id", booking.id);
        
        if (error) throw error;

        // Increment total_jobs for provider using RPC or direct update
        const { data: provider, error: providerError } = await supabase
          .from("service_providers")
          .select("total_jobs, user_id")
          .eq("id", booking.provider_id)
          .single();
        
        if (providerError) {
          console.error("Error fetching provider:", providerError);
        }
        
        if (provider) {
          const { error: updateError } = await supabase
            .from("service_providers")
            .update({ total_jobs: (provider.total_jobs || 0) + 1 })
            .eq("id", booking.provider_id);
          
          if (updateError) {
            console.error("Error updating total_jobs:", updateError);
          }

          // Notify provider about job completion and earnings
          const amount = booking.services?.price || 0;
          await createNotification(
            provider.user_id,
            "Job Completed! 🎉",
            `You completed the job "${booking.services?.title || 'Service'}". Rs.${amount} has been added to your earnings.`,
            "success"
          );
          // Send completion receipt email
          sendBookingEmail("booking_completed");
        }
      } else {
        const { error } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", booking.id);
        
        if (error) throw error;
      }

      // Create notifications based on status change
      if (newStatus === "confirmed" && booking.user_id) {
        await createNotification(
          booking.user_id,
          "Booking Accepted! ✅",
          `Your booking with ${booking.service_providers?.business_name || "the provider"} has been accepted.`,
          "success"
        );
        // Send confirmation email
        sendBookingEmail("booking_confirmation");
      } else if (newStatus === "cancelled") {
        if (isProvider && booking.user_id) {
          await createNotification(
            booking.user_id,
            "Booking Declined",
            `Unfortunately, ${booking.service_providers?.business_name || "the provider"} couldn't accept your booking.`,
            "warning"
          );
        } else if (!isProvider) {
          // Get provider user_id to notify them
          const { data: provider } = await supabase
            .from("service_providers")
            .select("user_id")
            .eq("id", booking.provider_id)
            .single();
          
          if (provider) {
            await createNotification(
              provider.user_id,
              "Booking Cancelled",
              `A customer cancelled their booking for "${booking.services?.title || 'Service'}".`,
              "warning"
            );
          }
        }
      } else if (newStatus === "in_progress" && booking.user_id) {
        await createNotification(
          booking.user_id,
          "Job Started! 🔧",
          `${booking.service_providers?.business_name || "Your provider"} has started working on your job.`,
          "booking"
        );
      }
    },
    onSuccess: (_, newStatus) => {
      const messages: Record<string, string> = {
        confirmed: "Booking accepted!",
        cancelled: "Booking cancelled.",
        in_progress: "Job started!",
        completed: "Job marked as completed!",
      };
      toast({ title: messages[newStatus] || "Booking updated!" });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update booking",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Provider actions
  if (isProvider) {
    if (booking.status === "pending") {
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            onClick={() => updateStatusMutation.mutate("confirmed")}
            disabled={updateStatusMutation.isPending}
          >
            <CheckCircle className="w-4 h-4 mr-1" />
            Accept
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button size="sm" variant="outline">
                <XCircle className="w-4 h-4 mr-1" />
                Decline
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Decline Booking?</AlertDialogTitle>
                <AlertDialogDescription>
                  This will notify the customer that you cannot accept this booking.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => updateStatusMutation.mutate("cancelled")}>
                  Decline
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      );
    }

    if (booking.status === "confirmed") {
      return (
        <Button
          size="sm"
          onClick={() => updateStatusMutation.mutate("in_progress")}
          disabled={updateStatusMutation.isPending}
        >
          Start Job
        </Button>
      );
    }

    return null;
  }

  // Customer actions
  if (booking.status === "in_progress") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm">
            <CheckCircle className="w-4 h-4 mr-1" />
            Mark Complete
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Job Completion</AlertDialogTitle>
            <AlertDialogDescription>
              Please confirm that the provider has completed the job to your satisfaction.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Not Yet</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatusMutation.mutate("completed")}>
              Confirm Complete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  if (booking.status === "completed" && !hasReview) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => setIsReviewOpen(true)}>
          <Star className="w-4 h-4 mr-1" />
          Leave Review
        </Button>
        <ReviewDialog
          open={isReviewOpen}
          onOpenChange={setIsReviewOpen}
          bookingId={booking.id}
          providerId={booking.provider_id}
          providerName={booking.service_providers?.business_name || "Provider"}
        />
      </>
    );
  }

  if (booking.status === "pending") {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="sm" variant="outline">
            Cancel Booking
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Booking?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this booking?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep Booking</AlertDialogCancel>
            <AlertDialogAction onClick={() => updateStatusMutation.mutate("cancelled")}>
              Yes, Cancel
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return null;
};

export default BookingActions;
