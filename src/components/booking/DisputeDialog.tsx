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
}

const DisputeDialog = ({ bookingId, providerId, providerName }: DisputeDialogProps) => {
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
      const { error } = await (supabase as any)
        .from("disputes")
        .insert({
          booking_id: bookingId,
          customer_id: user.id,
          provider_id: providerId,
          subject,
          description,
          priority,
        });

      if (error) throw error;

      // Notify admin
      try {
        await supabase.functions.invoke("create-notification", {
          body: {
            userId: user.id,
            title: "Dispute Submitted",
            message: `Your complaint against ${providerName} has been submitted. Our team will review it shortly.`,
            type: "info",
            relatedId: bookingId,
            relatedType: "booking",
          },
        });
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
            File a complaint about your booking with {providerName}. Our admin team will mediate.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="space-y-2">
            <Label>Subject *</Label>
            <Input
              placeholder="e.g., Poor quality work, No show, Overcharged..."
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
