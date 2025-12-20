import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle, Star, XCircle } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
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
    service_providers?: {
      business_name: string;
    };
  };
  isProvider?: boolean;
  hasReview?: boolean;
}

const BookingActions = ({ booking, isProvider = false, hasReview = false }: BookingActionsProps) => {
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const updateData: any = { status: newStatus };
      
      // If completing, also increment total_jobs for provider
      if (newStatus === "completed") {
        // First update the booking
        const { error } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", booking.id);
        
        if (error) throw error;

        // Then increment total_jobs
        const { data: provider } = await supabase
          .from("service_providers")
          .select("total_jobs")
          .eq("id", booking.provider_id)
          .single();
        
        if (provider) {
          await supabase
            .from("service_providers")
            .update({ total_jobs: (provider.total_jobs || 0) + 1 })
            .eq("id", booking.provider_id);
        }
      } else {
        const { error } = await supabase
          .from("bookings")
          .update(updateData)
          .eq("id", booking.id);
        
        if (error) throw error;
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
