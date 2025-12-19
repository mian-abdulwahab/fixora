import { CheckCircle, Clock, XCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ApplicationStatusBannerProps {
  status: "pending" | "approved" | "rejected";
  rejectionReason?: string | null;
  providerId: string;
}

const ApplicationStatusBanner = ({ status, rejectionReason, providerId }: ApplicationStatusBannerProps) => {
  const queryClient = useQueryClient();

  const resubmitMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("service_providers")
        .update({ 
          application_status: "pending",
          rejection_reason: null 
        })
        .eq("id", providerId);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
      toast.success("Application resubmitted for review!");
    },
    onError: () => {
      toast.error("Failed to resubmit application");
    },
  });

  if (status === "approved") {
    return (
      <div className="mb-6 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center shrink-0">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
        </div>
        <div>
          <h3 className="font-semibold text-emerald-800">Verified Provider</h3>
          <p className="text-sm text-emerald-700">
            Your application has been approved. You're now visible to customers and can receive bookings.
          </p>
        </div>
      </div>
    );
  }

  if (status === "rejected") {
    return (
      <div className="mb-6 p-4 bg-destructive/5 border border-destructive/20 rounded-xl">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
            <XCircle className="w-5 h-5 text-destructive" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-destructive">Application Rejected</h3>
            <p className="text-sm text-muted-foreground mt-1">
              {rejectionReason || "Your application was not approved. Please contact support for more information."}
            </p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={() => resubmitMutation.mutate()}
              disabled={resubmitMutation.isPending}
            >
              {resubmitMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Resubmitting...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Resubmit Application
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Pending status
  return (
    <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
        <Clock className="w-5 h-5 text-amber-600" />
      </div>
      <div>
        <h3 className="font-semibold text-amber-800">Application Under Review</h3>
        <p className="text-sm text-amber-700">
          Your application has been submitted and is being reviewed by our team. 
          You'll be notified once a decision is made. This usually takes 24-48 hours.
        </p>
      </div>
    </div>
  );
};

export default ApplicationStatusBanner;