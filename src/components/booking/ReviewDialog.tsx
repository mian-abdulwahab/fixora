import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Star } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface ReviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  providerId: string;
  providerName: string;
}

const SUB_CATEGORIES = [
  { key: "punctuality", label: "Punctuality", description: "Was the provider on time?" },
  { key: "quality", label: "Quality", description: "How was the work quality?" },
  { key: "value", label: "Value for Money", description: "Was the price fair?" },
  { key: "communication", label: "Communication", description: "How well did they communicate?" },
];

const StarRating = ({
  value,
  onChange,
  size = "lg",
}: {
  value: number;
  onChange: (v: number) => void;
  size?: "sm" | "lg";
}) => {
  const [hover, setHover] = useState(0);
  const iconSize = size === "sm" ? "w-5 h-5" : "w-8 h-8";

  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={() => onChange(star)}
          onMouseEnter={() => setHover(star)}
          onMouseLeave={() => setHover(0)}
          className="p-0.5 hover:scale-110 transition-transform"
        >
          <Star
            className={`${iconSize} ${
              star <= (hover || value)
                ? "text-accent fill-accent"
                : "text-muted"
            }`}
          />
        </button>
      ))}
    </div>
  );
};

const ReviewDialog = ({ open, onOpenChange, bookingId, providerId, providerName }: ReviewDialogProps) => {
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [subRatings, setSubRatings] = useState({
    punctuality: 0,
    quality: 0,
    value: 0,
    communication: 0,
  });
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const createReviewMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not authenticated");
      if (rating === 0) throw new Error("Please select an overall rating");

      const { data, error } = await supabase
        .from("reviews")
        .insert({
          user_id: user.id,
          booking_id: bookingId,
          provider_id: providerId,
          rating,
          comment: comment || null,
          punctuality_rating: subRatings.punctuality || null,
          quality_rating: subRatings.quality || null,
          value_rating: subRatings.value || null,
          communication_rating: subRatings.communication || null,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast({
        title: "Review Submitted!",
        description: "Thank you for your detailed feedback.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["provider-reviews", providerId] });
      queryClient.invalidateQueries({ queryKey: ["provider-detail", providerId] });
      queryClient.invalidateQueries({ queryKey: ["user-reviews"] });
      onOpenChange(false);
      setRating(0);
      setComment("");
      setSubRatings({ punctuality: 0, quality: 0, value: 0, communication: 0 });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to submit review",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createReviewMutation.mutate();
  };

  const ratingLabels = ["", "Poor", "Fair", "Good", "Very Good", "Excellent"];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rate Your Experience</DialogTitle>
          <DialogDescription>
            How was your experience with {providerName}?
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5 mt-4">
          {/* Overall Rating */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Overall Rating *</Label>
            <div className="flex flex-col items-center gap-1 py-2">
              <StarRating value={rating} onChange={setRating} size="lg" />
              {rating > 0 && (
                <p className="text-sm text-muted-foreground font-medium">
                  {ratingLabels[rating]}
                </p>
              )}
            </div>
          </div>

          {/* Sub-Ratings */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Detailed Ratings (Optional)</Label>
            <div className="space-y-3">
              {SUB_CATEGORIES.map(({ key, label, description }) => (
                <div
                  key={key}
                  className="flex items-center justify-between p-3 rounded-lg bg-secondary/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground">{description}</p>
                  </div>
                  <StarRating
                    value={subRatings[key as keyof typeof subRatings]}
                    onChange={(v) =>
                      setSubRatings((prev) => ({ ...prev, [key]: v }))
                    }
                    size="sm"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Comment */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Your Review (Optional)</Label>
            <Textarea
              placeholder="Share your experience..."
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
            />
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={rating === 0 || createReviewMutation.isPending}
          >
            {createReviewMutation.isPending ? "Submitting..." : "Submit Review"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
