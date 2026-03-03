import { useState } from "react";
import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Gift, 
  Copy, 
  CheckCircle, 
  Users, 
  Coins, 
  Share2,
  ArrowLeft
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "FIXORA-";
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
};

const ReferralProgram = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);

  // Get or create referral code
  const { data: referralCode } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await (supabase as any)
        .from("referral_codes")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data as { code: string; id: string } | null;
    },
    enabled: !!user?.id,
  });

  const createCodeMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("Not logged in");
      const code = generateCode();
      const { data, error } = await (supabase as any)
        .from("referral_codes")
        .insert({ user_id: user.id, code })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["referral-code"] });
      toast({ title: "Referral code created! 🎉" });
    },
  });

  // Get referrals
  const { data: referrals = [] } = useQuery({
    queryKey: ["my-referrals", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Get total credits
  const { data: credits = [] } = useQuery({
    queryKey: ["my-credits", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await (supabase as any)
        .from("referral_credits")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  const totalCredits = credits.reduce((sum: number, c: any) => sum + Number(c.amount || 0), 0);
  const successfulReferrals = referrals.filter((r: any) => r.status === "completed").length;

  const handleCopy = async () => {
    if (!referralCode?.code) return;
    await navigator.clipboard.writeText(referralCode.code);
    setCopied(true);
    toast({ title: "Copied to clipboard! 📋" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (!referralCode?.code) return;
    const shareText = `Join Fixora using my referral code: ${referralCode.code} and get Rs.100 off your first booking! 🔧`;
    
    if (navigator.share) {
      try {
        await navigator.share({ title: "Fixora Referral", text: shareText });
      } catch {}
    } else {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Share text copied!" });
    }
  };

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="pt-20 md:pt-24 container mx-auto px-4 pb-12">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Referral Program</h1>
              <p className="text-muted-foreground">Invite friends, earn credits!</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <Users className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{referrals.length}</p>
              <p className="text-sm text-muted-foreground">Invited</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <CheckCircle className="w-8 h-8 text-primary mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">{successfulReferrals}</p>
              <p className="text-sm text-muted-foreground">Joined</p>
            </div>
            <div className="bg-card rounded-xl p-6 shadow-card text-center">
              <Coins className="w-8 h-8 text-accent mx-auto mb-2" />
              <p className="text-2xl font-bold text-foreground">Rs.{totalCredits}</p>
              <p className="text-sm text-muted-foreground">Credits Earned</p>
            </div>
          </div>

          {/* Referral Code */}
          <div className="bg-card rounded-2xl shadow-card p-8 mb-8">
            <div className="text-center mb-6">
              <Gift className="w-12 h-12 text-primary mx-auto mb-3" />
              <h2 className="text-xl font-bold text-foreground mb-2">Your Referral Code</h2>
              <p className="text-muted-foreground">
                Share your code with friends. When they sign up and complete their first booking, you both get Rs.100 credit!
              </p>
            </div>

            {referralCode?.code ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 bg-secondary rounded-xl p-4 text-center">
                    <span className="text-2xl font-mono font-bold tracking-widest text-primary">
                      {referralCode.code}
                    </span>
                  </div>
                  <Button variant="outline" size="icon" onClick={handleCopy}>
                    {copied ? <CheckCircle className="w-5 h-5 text-primary" /> : <Copy className="w-5 h-5" />}
                  </Button>
                  <Button variant="outline" size="icon" onClick={handleShare}>
                    <Share2 className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <Button onClick={() => createCodeMutation.mutate()} disabled={createCodeMutation.isPending}>
                  <Gift className="w-4 h-4 mr-2" />
                  {createCodeMutation.isPending ? "Generating..." : "Generate My Referral Code"}
                </Button>
              </div>
            )}
          </div>

          {/* How it works */}
          <div className="bg-card rounded-2xl shadow-card p-8 mb-8">
            <h3 className="text-lg font-semibold text-foreground mb-4">How It Works</h3>
            <div className="space-y-4">
              {[
                { step: "1", title: "Share Your Code", desc: "Send your referral code to friends and family" },
                { step: "2", title: "They Sign Up", desc: "Your friend creates an account using your code" },
                { step: "3", title: "Both Earn Credits", desc: "You both get Rs.100 credit after their first booking!" },
              ].map((item) => (
                <div key={item.step} className="flex items-start gap-4">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <span className="text-sm font-bold text-primary">{item.step}</span>
                  </div>
                  <div>
                    <h4 className="font-medium text-foreground">{item.title}</h4>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Credit History */}
          {credits.length > 0 && (
            <div className="bg-card rounded-2xl shadow-card p-8">
              <h3 className="text-lg font-semibold text-foreground mb-4">Credit History</h3>
              <div className="space-y-3">
                {credits.map((credit: any) => (
                  <div key={credit.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                    <div>
                      <p className="text-sm font-medium text-foreground">{credit.description || credit.type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(credit.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">+Rs.{Number(credit.amount)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default ReferralProgram;
