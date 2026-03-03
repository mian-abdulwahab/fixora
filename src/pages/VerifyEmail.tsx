import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench, Mail, CheckCircle2, RefreshCw, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";

const VerifyEmail = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    const checkVerification = async () => {
      if (user?.id) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("email_verified")
          .eq("id", user.id)
          .single();
        
        if (profile?.email_verified) {
          setEmailVerified(true);
          return;
        }
      }
      
      // NOTE: Real OTP sending is commented out for testing.
      // Uncomment the line below and comment out the dummy logic to enable real OTP flow.
      // if (user && !otpSent) {
      //   sendOtp();
      // }
      
      // Dummy: mark OTP as "sent" without actually sending
      if (user && !otpSent) {
        setOtpSent(true);
      }
    };
    
    checkVerification();
  }, [user, loading, navigate, otpSent]);

  useEffect(() => {
    if (cooldownSeconds > 0) {
      const timer = setTimeout(() => setCooldownSeconds(cooldownSeconds - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldownSeconds]);

  const updateProfileVerification = async () => {
    if (!user?.id) return;
    
    await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", user.id);
  };

  // Real OTP sending logic - kept for future use
  const sendOtp = async () => {
    setIsResending(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session expired",
          description: "Please login again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("send-otp", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Send OTP error:", error);
        toast({
          title: "Failed to send OTP",
          description: error.message || "Please try again.",
          variant: "destructive",
        });
      } else {
        setOtpSent(true);
        setCooldownSeconds(30);
        toast({
          title: "OTP Sent!",
          description: "Check your email for the 6-digit verification code.",
        });
      }
    } catch (err) {
      console.error("Send OTP exception:", err);
      toast({
        title: "Error",
        description: "Failed to send verification code.",
        variant: "destructive",
      });
    }
    setIsResending(false);
  };

  // Real OTP verification logic - kept for future use
  const handleVerifyOtp = async () => {
    if (otpValue.length !== 6) {
      toast({
        title: "Invalid OTP",
        description: "Please enter the complete 6-digit code.",
        variant: "destructive",
      });
      return;
    }

    setIsVerifying(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast({
          title: "Session expired",
          description: "Please login again.",
          variant: "destructive",
        });
        navigate("/login");
        return;
      }

      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: { otp: otpValue },
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });

      if (error) {
        console.error("Verify OTP error:", error);
        toast({
          title: "Verification failed",
          description: error.message || "Invalid or expired OTP.",
          variant: "destructive",
        });
      } else if (data?.success) {
        setEmailVerified(true);
        toast({
          title: "Email Verified!",
          description: "Your email has been verified successfully.",
        });
      } else {
        toast({
          title: "Verification failed",
          description: data?.error || "Invalid or expired OTP.",
          variant: "destructive",
        });
      }
    } catch (err) {
      console.error("Verify OTP exception:", err);
      toast({
        title: "Error",
        description: "Failed to verify code.",
        variant: "destructive",
      });
    }
    setIsVerifying(false);
  };

  // Dummy verification for testing - marks email as verified without OTP
  const handleDummyVerify = async () => {
    setIsVerifying(true);
    await updateProfileVerification();
    setEmailVerified(true);
    toast({
      title: "Email Verified! (Test Mode)",
      description: "Your email has been marked as verified for testing.",
    });
    setIsVerifying(false);
  };

  // Fetch actual role from DB before redirecting to avoid stale cached role
  const handleContinue = async () => {
    if (!user?.id) {
      navigate("/dashboard");
      return;
    }

    // Check admin role
    const { data: isAdmin } = await supabase.rpc("has_role", {
      _user_id: user.id,
      _role: "admin" as const,
    });

    if (isAdmin) {
      navigate("/admin");
      return;
    }

    // Check provider role
    const { data: providerProfile } = await supabase
      .from("service_providers")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (providerProfile) {
      navigate("/provider-dashboard");
      return;
    }

    // Default: customer
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-8 bg-background">
      <div className="w-full max-w-md text-center">
        {/* Logo */}
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
            <Wrench className="w-5 h-5 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold text-foreground">Fixora</span>
        </Link>

        <div className="bg-card rounded-2xl shadow-card p-8">
          {emailVerified ? (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-emerald-100 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Email Verified!</h1>
              <p className="text-muted-foreground mb-6">
                Your email has been verified successfully. You can now access your dashboard.
              </p>
              <Button onClick={handleContinue} className="w-full">
                Continue to Dashboard
              </Button>
            </>
          ) : (
            <>
              <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 flex items-center justify-center">
                <Mail className="w-8 h-8 text-primary" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">Verify Your Email</h1>
              <p className="text-muted-foreground mb-2">
                We've sent a 6-digit verification code to:
              </p>
              <p className="font-medium text-foreground mb-6">{user?.email}</p>
              
              <div className="flex justify-center mb-6">
                <InputOTP
                  maxLength={6}
                  value={otpValue}
                  onChange={(value) => setOtpValue(value)}
                >
                  <InputOTPGroup>
                    <InputOTPSlot index={0} />
                    <InputOTPSlot index={1} />
                    <InputOTPSlot index={2} />
                    <InputOTPSlot index={3} />
                    <InputOTPSlot index={4} />
                    <InputOTPSlot index={5} />
                  </InputOTPGroup>
                </InputOTP>
              </div>

              {/* Real verify button - uses OTP validation */}
              <Button
                onClick={handleVerifyOtp}
                className="w-full mb-3"
                disabled={isVerifying || otpValue.length !== 6}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify Email"
                )}
              </Button>

              {/* Dummy verify button for testing - bypasses OTP */}
              <Button
                onClick={handleDummyVerify}
                variant="secondary"
                className="w-full mb-3"
                disabled={isVerifying}
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify Without OTP (Testing)
              </Button>

              <p className="text-sm text-muted-foreground mb-4">
                Didn't receive the code? Check your spam folder or
              </p>
              
              <Button
                onClick={sendOtp}
                variant="outline"
                className="w-full"
                disabled={isResending || cooldownSeconds > 0}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : cooldownSeconds > 0 ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend in {cooldownSeconds}s
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Code
                  </>
                )}
              </Button>
            </>
          )}
        </div>

        <p className="text-sm text-muted-foreground mt-6">
          Need help?{" "}
          <Link to="/contact" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
};

export default VerifyEmail;
