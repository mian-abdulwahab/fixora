import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, CheckCircle2, Image, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface PaymentReceiptUploadProps {
  bookingId: string;
  paymentMethod: string | null;
  paymentStatus: string | null;
  existingReceiptUrl: string | null;
}

const PaymentReceiptUpload = ({
  bookingId,
  paymentMethod,
  paymentStatus,
  existingReceiptUrl,
}: PaymentReceiptUploadProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [previewUrl, setPreviewUrl] = useState<string | null>(existingReceiptUrl);

  const uploadMutation = useMutation({
    mutationFn: async (file: File) => {
      if (!user) throw new Error("Not authenticated");

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${bookingId}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("payment-receipts")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("payment-receipts")
        .getPublicUrl(filePath);

      // Update booking with receipt URL
      const { error: updateError } = await supabase
        .from("bookings")
        .update({ payment_receipt_url: urlData.publicUrl })
        .eq("id", bookingId);

      if (updateError) throw updateError;

      return urlData.publicUrl;
    },
    onSuccess: (url) => {
      setPreviewUrl(url);
      toast({
        title: "Receipt Uploaded!",
        description: "Your payment receipt has been uploaded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Upload Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 5MB.",
        variant: "destructive",
      });
      return;
    }

    uploadMutation.mutate(file);
  };

  // Don't show for cash payments
  if (paymentMethod === "cash") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Cash payment - pay directly to the provider on service day</span>
      </div>
    );
  }

  if (!paymentMethod) return null;

  // Already paid
  if (paymentStatus === "paid") {
    return (
      <div className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>Payment confirmed</span>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="p-3 rounded-lg bg-accent/10 text-sm">
        <p className="font-medium text-foreground mb-1">
          Payment via {paymentMethod === "jazzcash" ? "JazzCash" : paymentMethod === "easypaisa" ? "Easypaisa" : "Bank Transfer"}
        </p>
        <p className="text-muted-foreground text-xs">
          Please complete your payment and upload the receipt/screenshot below.
        </p>
      </div>

      {previewUrl ? (
        <div className="space-y-2">
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={previewUrl}
              alt="Payment receipt"
              className="w-full max-h-48 object-contain bg-secondary"
            />
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-600">
            <CheckCircle2 className="w-4 h-4" />
            <span>Receipt uploaded - awaiting verification</span>
          </div>
        </div>
      ) : (
        <label className="flex flex-col items-center gap-2 p-6 border-2 border-dashed border-border rounded-xl cursor-pointer hover:border-primary/50 hover:bg-secondary/50 transition-all">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploadMutation.isPending}
          />
          {uploadMutation.isPending ? (
            <>
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-muted-foreground">Uploading...</span>
            </>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground" />
              <span className="text-sm font-medium text-foreground">Upload Payment Receipt</span>
              <span className="text-xs text-muted-foreground">
                JPG, PNG or screenshot (max 5MB)
              </span>
            </>
          )}
        </label>
      )}
    </div>
  );
};

export default PaymentReceiptUpload;
