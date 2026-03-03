import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
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

interface DisputeDialogProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  customerId?: string;
  customerName?: string;
  isProvider?: boolean;
}

const DisputeDialog = ({ bookingId, providerId, providerName, customerId, customerName, isProvider = false }: DisputeDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSubmitting(true);
    try {
      // For provider-raised disputes, we need to resolve the customer_id from the booking
      let resolvedCustomerId = customerId;
      if (isProvider && !resolvedCustomerId) {
        const { data: booking } = await supabase
          .from("bookings")
          .select("user_id")
          .eq("id", bookingId)
          .single();
        resolvedCustomerId = booking?.user_id;
      }

      const { error } = await (supabase as any)
        .from("disputes")
        .insert({
          booking_id: bookingId,
          customer_id: isProvider ? resolvedCustomerId : user.id,
          provider_id: providerId,
          subject,
          description,
          priority,
        });

      if (error) throw error;

      // Notify the filing user
      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            userId: user.id,
            title: "Dispute Submitted",
            message: `Your complaint has been submitted. Our team will review it shortly.`,
            type: "info",
            relatedId: bookingId,
            relatedType: "booking",
          },
        });
      } catch {}

      // Notify the other party
      try {
        if (isProvider && resolvedCustomerId) {
          await supabase.functions.invoke("create-notification", {
            body: {
              userId: resolvedCustomerId,
              title: "Dispute Filed Against Your Booking",
              message: `${providerName} has raised a dispute regarding your booking. An admin will review and mediate.`,
              type: "warning",
              relatedId: bookingId,
              relatedType: "booking",
            },
          });
        } else if (!isProvider) {
          // Notify provider
          const { data: providerData } = await supabase
            .from("service_providers")
            .select("user_id")
            .eq("id", providerId)
            .single();

          if (providerData) {
            await supabase.functions.invoke("create-notification", {
              body: {
                userId: providerData.user_id,
                title: "Dispute Filed Against You",
                message: `A customer has raised a dispute regarding a booking. An admin will review and mediate.`,
                type: "warning",
                relatedId: bookingId,
                relatedType: "booking",
              },
            });
          }
        }
      } catch {}

      // Notify all admins
      try {
        const { data: adminRoles } = await supabase
          .from("user_roles")
          .select("user_id")
          .eq("role", "admin");

        if (adminRoles) {
          for (const admin of adminRoles) {
            await supabase.functions.invoke("create-notification", {
              body: {
                userId: admin.user_id,
                title: "New Dispute Filed ⚠️",
                message: `A ${isProvider ? "provider" : "customer"} has filed a ${priority} priority dispute. Please review.`,
                type: "warning",
                relatedId: bookingId,
                relatedType: "booking",
              },
            });
          }
        }
      } catch {}

      toast({
        title: "Dispute Submitted ✅",
        description: "Our team will review your complaint and get back to you.",
      });
      setOpen(false);
      setSubject("");
      setDescription("");
      setPriority("medium");
    } catch (err: any) {
      toast({
        title: "Failed to submit dispute",
        description: err.message,
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const otherPartyName = isProvider ? (customerName || "the customer") : providerName;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Report Issue
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Report an Issue</DialogTitle>
          <DialogDescription>
            File a complaint about your booking with {otherPartyName}. Our admin team will mediate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              placeholder={isProvider 
                ? "e.g., Customer no-show, Payment issue, Abusive behavior..." 
                : "e.g., Poor quality work, No show, Overcharged..."}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High - Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Description *</Label>
            <Textarea
              placeholder="Describe the issue in detail..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              required
            />
          </div>
          <Button type="submit" className="w-full" disabled={submitting || !subject || !description}>
            {submitting ? "Submitting..." : "Submit Complaint"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DisputeDialog;
