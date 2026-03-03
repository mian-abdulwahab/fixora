import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertTriangle, CheckCircle, Clock, MessageSquare } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

const AdminDisputes = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [resolution, setResolution] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ["admin-disputes"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("disputes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await (supabase as any)
        .from("disputes")
        .update({
          status,
          resolution,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Dispute updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-disputes"] });
      setSelectedDispute(null);
      setResolution("");
      setAdminNotes("");
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "open": return <AlertTriangle className="w-4 h-4 text-destructive" />;
      case "in_review": return <Clock className="w-4 h-4 text-accent" />;
      case "resolved": return <CheckCircle className="w-4 h-4 text-primary" />;
      default: return <MessageSquare className="w-4 h-4 text-muted-foreground" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open": return "bg-destructive/10 text-destructive";
      case "in_review": return "bg-accent/10 text-accent";
      case "resolved": return "bg-primary/10 text-primary";
      case "dismissed": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high": return "bg-destructive/10 text-destructive";
      case "medium": return "bg-accent/10 text-accent";
      case "low": return "bg-muted text-muted-foreground";
      default: return "bg-muted text-muted-foreground";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Disputes</h1>
          <p className="text-muted-foreground">Manage customer complaints and disputes</p>
        </div>
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium text-foreground">{disputes.filter((d: any) => d.status === "open").length}</span> open
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Disputes List */}
        <div className="space-y-3">
          {isLoading ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto" />
            </div>
          ) : disputes.length === 0 ? (
            <div className="bg-card rounded-xl p-8 text-center">
              <CheckCircle className="w-12 h-12 text-primary/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No disputes yet — everything's running smoothly!</p>
            </div>
          ) : (
            disputes.map((dispute: any) => (
              <div
                key={dispute.id}
                className={`bg-card rounded-xl p-4 shadow-card cursor-pointer transition-all hover:shadow-card-hover ${
                  selectedDispute?.id === dispute.id ? "ring-2 ring-primary" : ""
                }`}
                onClick={() => {
                  setSelectedDispute(dispute);
                  setResolution(dispute.resolution || "");
                  setAdminNotes(dispute.admin_notes || "");
                }}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getStatusIcon(dispute.status)}
                    <h3 className="font-semibold text-foreground text-sm">{dispute.subject}</h3>
                  </div>
                  <div className="flex gap-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(dispute.priority)}`}>
                      {dispute.priority}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium capitalize ${getStatusColor(dispute.status)}`}>
                      {dispute.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground line-clamp-2">{dispute.description}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {format(new Date(dispute.created_at), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Dispute Detail */}
        {selectedDispute && (
          <div className="bg-card rounded-xl p-6 shadow-card sticky top-24">
            <h3 className="text-lg font-semibold text-foreground mb-4">{selectedDispute.subject}</h3>
            <div className="space-y-4">
              <div>
                <Label className="text-muted-foreground text-xs">Description</Label>
                <p className="text-sm text-foreground mt-1">{selectedDispute.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Priority</Label>
                  <p className="text-sm text-foreground capitalize">{selectedDispute.priority}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Status</Label>
                  <p className="text-sm text-foreground capitalize">{selectedDispute.status.replace("_", " ")}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4 space-y-3">
                <div className="space-y-2">
                  <Label>Admin Notes</Label>
                  <Textarea
                    value={adminNotes}
                    onChange={(e) => setAdminNotes(e.target.value)}
                    placeholder="Internal notes..."
                    rows={2}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Resolution</Label>
                  <Textarea
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    placeholder="Describe the resolution..."
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Update Status</Label>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => resolveMutation.mutate({ id: selectedDispute.id, status: "in_review" })}
                      disabled={resolveMutation.isPending}
                    >
                      Mark In Review
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => resolveMutation.mutate({ id: selectedDispute.id, status: "resolved" })}
                      disabled={resolveMutation.isPending || !resolution}
                    >
                      Resolve
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => resolveMutation.mutate({ id: selectedDispute.id, status: "dismissed" })}
                      disabled={resolveMutation.isPending}
                    >
                      Dismiss
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDisputes;
