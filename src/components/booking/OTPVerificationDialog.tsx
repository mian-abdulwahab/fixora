import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { KeyRound, Loader2, Copy, CheckCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

interface OTPVerificationDialogProps {
  bookingId: string;
  isProvider: boolean;
  status: string;
  escrowStatus?: string;
}

const OTPVerificationDialog = ({ bookingId, isProvider, status, escrowStatus }: OTPVerificationDialogProps) => {
  const [open, setOpen] = useState(false);
  const [otp, setOtp] = useState("");
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Only show for in_progress bookings with held escrow
  if (status !== "in_progress" || (escrowStatus !== "held" && escrowStatus !== "none")) return null;

  const generateOtp = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("generate_completion_otp", {
        booking_id: bookingId,
      });
      if (error) throw error;
      setGeneratedOtp(data);
      toast({ title: "OTP Generated!", description: "Share this code with the provider when the job is done." });
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    if (otp.length !== 4) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc("verify_completion_otp", {
        p_booking_id: bookingId,
        p_otp: otp,
      });
      if (error) throw error;

      if (data === true) {
        toast({ title: "Job Completed! 🎉", description: "Funds have been released to your wallet." });
        setOpen(false);
        queryClient.invalidateQueries({ queryKey: ["provider-bookings"] });
        queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
        queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
      } else {
        toast({ title: "Invalid OTP", description: "The code you entered is incorrect.", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const copyOtp = () => {
    if (generatedOtp) {
      navigator.clipboard.writeText(generatedOtp);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Customer: Generate OTP
  if (!isProvider) {
    return (
      <>
        <Button size="sm" variant="outline" onClick={() => { setOpen(true); generateOtp(); }}>
          <KeyRound className="w-4 h-4 mr-1" />
          Generate Completion OTP
        </Button>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Job Completion OTP</DialogTitle>
              <DialogDescription>
                Share this code with the service provider when they finish the job. This verifies the work is done.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center py-6">
              {loading ? (
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              ) : generatedOtp ? (
                <>
                  <div className="text-5xl font-bold tracking-[0.5em] text-primary mb-4">
                    {generatedOtp}
                  </div>
                  <Button variant="outline" size="sm" onClick={copyOtp}>
                    {copied ? <CheckCircle className="w-4 h-4 mr-1" /> : <Copy className="w-4 h-4 mr-1" />}
                    {copied ? "Copied!" : "Copy Code"}
                  </Button>
                  <p className="text-sm text-muted-foreground mt-4 text-center">
                    Only share this code after you're satisfied with the work. Once verified, funds will be released from escrow.
                  </p>
                </>
              ) : (
                <p className="text-muted-foreground">Failed to generate OTP. Please try again.</p>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </>
    );
  }

  // Provider: Enter OTP
  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
        <KeyRound className="w-4 h-4 mr-1" />
        Enter Completion OTP
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Enter Completion Code</DialogTitle>
            <DialogDescription>
              Ask the customer for the 4-digit completion code to mark the job as done and receive your payment.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col items-center py-6 gap-6">
            <InputOTP maxLength={4} value={otp} onChange={setOtp}>
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
              </InputOTPGroup>
            </InputOTP>
            <Button
              onClick={verifyOtp}
              disabled={otp.length !== 4 || loading}
              className="w-full"
            >
              {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle className="w-4 h-4 mr-2" />}
              Verify & Complete Job
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default OTPVerificationDialog;
