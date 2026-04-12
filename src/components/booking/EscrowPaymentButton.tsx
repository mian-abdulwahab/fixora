import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreditCard, Loader2, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface EscrowPaymentButtonProps {
  bookingId: string;
  amount: number;
  escrowStatus?: string;
  paymentStatus?: string;
}

const EscrowPaymentButton = ({ bookingId, amount, escrowStatus, paymentStatus }: EscrowPaymentButtonProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  if (paymentStatus === "paid") {
    return (
      <div className="flex items-center gap-2 text-sm">
        <Shield className="w-4 h-4 text-emerald-600" />
        <span className="text-emerald-600 font-medium">
          {escrowStatus === "held" && "Funds Secured in Escrow"}
          {escrowStatus === "released" && "Funds Released to Provider"}
          {escrowStatus === "disputed" && "Funds Frozen - Under Review"}
          {(!escrowStatus || escrowStatus === "none") && "Payment Confirmed"}
        </span>
      </div>
    );
  }

  const handlePayment = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-checkout", {
        body: { bookingId },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error("No checkout URL received");
      }
    } catch (err: any) {
      toast({
        title: "Payment Error",
        description: err.message || "Failed to initiate payment",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handlePayment}
      disabled={loading}
      className="bg-emerald-600 hover:bg-emerald-700"
      size="sm"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <CreditCard className="w-4 h-4 mr-2" />
      )}
      Pay Rs. {amount.toLocaleString()} (Escrow)
    </Button>
  );
};

export default EscrowPaymentButton;
