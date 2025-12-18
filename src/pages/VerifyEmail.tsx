import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Wrench, Mail, CheckCircle2, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const VerifyEmail = () => {
  const { user, userRole, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isResending, setIsResending] = useState(false);
  const [emailVerified, setEmailVerified] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login");
      return;
    }

    // Check if email is verified
    if (user?.email_confirmed_at) {
      setEmailVerified(true);
      // Update profile
      updateProfileVerification();
    }
  }, [user, loading, navigate]);

  const updateProfileVerification = async () => {
    if (!user?.id) return;
    
    await supabase
      .from("profiles")
      .update({ email_verified: true })
      .eq("id", user.id);
  };

  const handleResendEmail = async () => {
    if (!user?.email) return;
    
    setIsResending(true);
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: user.email,
      options: {
        emailRedirectTo: `${window.location.origin}/verify-email`,
      },
    });

    if (error) {
      toast({
        title: "Failed to resend",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Email sent!",
        description: "Check your inbox for the verification link.",
      });
    }
    setIsResending(false);
  };

  const handleContinue = () => {
    switch (userRole) {
      case "admin":
        navigate("/admin");
        break;
      case "provider":
        navigate("/provider-dashboard");
        break;
      default:
        navigate("/dashboard");
    }
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
                We've sent a verification link to:
              </p>
              <p className="font-medium text-foreground mb-6">{user?.email}</p>
              <p className="text-sm text-muted-foreground mb-6">
                Click the link in the email to verify your account. If you don't see it, check your spam folder.
              </p>
              <Button
                onClick={handleResendEmail}
                variant="outline"
                className="w-full"
                disabled={isResending}
              >
                {isResending ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Resend Verification Email
                  </>
                )}
              </Button>
              <Button
                onClick={() => window.location.reload()}
                variant="ghost"
                className="w-full mt-3"
              >
                I've verified my email
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