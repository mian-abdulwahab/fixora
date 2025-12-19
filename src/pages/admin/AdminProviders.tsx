import { useState } from "react";
import { useAllProviders, useUpdateProvider } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Star, MapPin, Clock, AlertCircle, Eye } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

interface Provider {
  id: string;
  business_name: string;
  email: string | null;
  phone: string | null;
  location: string | null;
  description: string | null;
  avatar_url: string | null;
  rating: number | null;
  total_reviews: number | null;
  is_active: boolean | null;
  verified: boolean | null;
  application_status: string | null;
  rejection_reason: string | null;
  experience_years: number | null;
  skills: string[] | null;
  created_at: string | null;
  profiles?: { name: string | null; email: string | null } | null;
}

const AdminProviders: React.FC = () => {
  const { data: providers = [], isLoading } = useAllProviders();
  const updateProvider = useUpdateProvider();
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<any>(null);
  const [rejectionReason, setRejectionReason] = useState("");

  const filteredProviders = providers.filter((provider: any) => {
    const matchesSearch = 
      provider.business_name?.toLowerCase().includes(search.toLowerCase()) ||
      provider.email?.toLowerCase().includes(search.toLowerCase());
    
    if (activeTab === "all") return matchesSearch;
    
    const status = provider.application_status || "pending";
    return matchesSearch && status === activeTab;
  });

  // Count providers by status
  const pendingCount = providers.filter((p: any) => p.application_status === "pending" || !p.application_status).length;
  const approvedCount = providers.filter((p: any) => p.application_status === "approved").length;
  const rejectedCount = providers.filter((p: any) => p.application_status === "rejected").length;

  const handleApprove = async (provider: any) => {
    try {
      await updateProvider.mutateAsync({ 
        id: provider.id, 
        updates: { 
          verified: true, 
          application_status: "approved",
          is_active: true,
          rejection_reason: null 
        } 
      });
      toast.success(`${provider.business_name} has been approved!`);
    } catch (error) {
      toast.error("Failed to approve provider");
    }
  };

  const handleReject = async () => {
    if (!selectedProvider) return;
    
    try {
      await updateProvider.mutateAsync({ 
        id: selectedProvider.id, 
        updates: { 
          verified: false, 
          application_status: "rejected",
          is_active: false,
          rejection_reason: rejectionReason || "Your application was not approved. Please contact support for more information."
        } 
      });
      toast.success(`${selectedProvider.business_name} has been rejected`);
      setRejectDialogOpen(false);
      setSelectedProvider(null);
      setRejectionReason("");
    } catch (error) {
      toast.error("Failed to reject provider");
    }
  };

  const handleToggleActive = async (id: string, is_active: boolean) => {
    try {
      await updateProvider.mutateAsync({ id, updates: { is_active } });
      toast.success(is_active ? "Provider activated" : "Provider deactivated");
    } catch (error) {
      toast.error("Failed to update provider");
    }
  };

  const getStatusBadge = (provider: any) => {
    const status = provider.application_status || "pending";
    switch (status) {
      case "approved":
        return (
          <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-100">
            <CheckCircle className="w-3 h-3 mr-1" />
            Approved
          </Badge>
        );
      case "rejected":
        return (
          <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10">
            <XCircle className="w-3 h-3 mr-1" />
            Rejected
          </Badge>
        );
      default:
        return (
          <Badge className="bg-amber-100 text-amber-700 hover:bg-amber-100">
            <Clock className="w-3 h-3 mr-1" />
            Pending Review
          </Badge>
        );
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Service Providers</h1>
        <p className="text-muted-foreground">Review and manage provider applications.</p>
      </div>

      {/* Pending Applications Alert */}
      {pendingCount > 0 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600" />
          <p className="text-amber-800">
            You have <strong>{pendingCount}</strong> pending provider application{pendingCount !== 1 ? "s" : ""} awaiting review.
          </p>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="relative">
            Pending
            {pendingCount > 0 && (
              <span className="ml-2 px-1.5 py-0.5 text-xs bg-amber-500 text-white rounded-full">
                {pendingCount}
              </span>
            )}
          </TabsTrigger>
          <TabsTrigger value="approved">
            Approved ({approvedCount})
          </TabsTrigger>
          <TabsTrigger value="rejected">
            Rejected ({rejectedCount})
          </TabsTrigger>
          <TabsTrigger value="all">
            All ({providers.length})
          </TabsTrigger>
        </TabsList>

        <div className="bg-card rounded-xl shadow-card">
          <div className="p-4 border-b border-border">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search providers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Business</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Skills</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Applied</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProviders.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    {activeTab === "pending" ? "No pending applications" : "No providers found"}
                  </TableCell>
                </TableRow>
              ) : (
                filteredProviders.map((provider) => (
                  <TableRow key={provider.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {provider.avatar_url ? (
                          <img 
                            src={provider.avatar_url} 
                            alt={provider.business_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <span className="text-primary font-semibold">
                              {provider.business_name?.charAt(0) || "P"}
                            </span>
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-medium text-foreground">{provider.business_name}</p>
                            {provider.verified && (
                              <CheckCircle className="w-4 h-4 text-emerald-600" />
                            )}
                          </div>
                          <p className="text-sm text-muted-foreground">{provider.email}</p>
                          {provider.location && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              {provider.location}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-foreground">
                        {provider.experience_years ? `${provider.experience_years} years` : "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {provider.skills?.slice(0, 3).map(skill => (
                          <Badge key={skill} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {(provider.skills?.length || 0) > 3 && (
                          <Badge variant="outline" className="text-xs">
                            +{(provider.skills?.length || 0) - 3}
                          </Badge>
                        )}
                        {!provider.skills?.length && <span className="text-muted-foreground">—</span>}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(provider)}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {provider.created_at ? format(new Date(provider.created_at), "MMM d, yyyy") : "—"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedProvider(provider);
                            setDetailsDialogOpen(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {provider.application_status !== "approved" && (
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handleApprove(provider)}
                            className="bg-emerald-600 hover:bg-emerald-700"
                          >
                            <CheckCircle className="w-4 h-4 mr-1" />
                            Approve
                          </Button>
                        )}
                        {provider.application_status !== "rejected" && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => {
                              setSelectedProvider(provider);
                              setRejectDialogOpen(true);
                            }}
                          >
                            <XCircle className="w-4 h-4 mr-1" />
                            Reject
                          </Button>
                        )}
                        {provider.application_status === "approved" && (
                          <Button
                            variant={provider.is_active ? "outline" : "default"}
                            size="sm"
                            onClick={() => handleToggleActive(provider.id, !provider.is_active)}
                          >
                            {provider.is_active ? "Deactivate" : "Activate"}
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </Tabs>

      {/* Provider Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Provider Application Details</DialogTitle>
            <DialogDescription>
              Review the complete application from {selectedProvider?.business_name}
            </DialogDescription>
          </DialogHeader>
          
          {selectedProvider && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedProvider.avatar_url ? (
                  <img 
                    src={selectedProvider.avatar_url} 
                    alt={selectedProvider.business_name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-xl">
                      {selectedProvider.business_name?.charAt(0) || "P"}
                    </span>
                  </div>
                )}
                <div>
                  <h3 className="font-semibold text-lg">{selectedProvider.business_name}</h3>
                  {getStatusBadge(selectedProvider)}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Email</p>
                  <p className="font-medium">{selectedProvider.email || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Phone</p>
                  <p className="font-medium">{selectedProvider.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Location</p>
                  <p className="font-medium">{selectedProvider.location || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Experience</p>
                  <p className="font-medium">
                    {selectedProvider.experience_years ? `${selectedProvider.experience_years} years` : "—"}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-2">Skills</p>
                <div className="flex flex-wrap gap-2">
                  {selectedProvider.skills?.map(skill => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  )) || <span className="text-muted-foreground">No skills listed</span>}
                </div>
              </div>

              <div>
                <p className="text-muted-foreground text-sm mb-1">Description</p>
                <p className="text-foreground text-sm">
                  {selectedProvider.description || "No description provided"}
                </p>
              </div>

              <div>
                <p className="text-muted-foreground text-sm">Applied on</p>
                <p className="font-medium">
                  {selectedProvider.created_at 
                    ? format(new Date(selectedProvider.created_at), "MMMM d, yyyy 'at' h:mm a") 
                    : "—"}
                </p>
              </div>

              {selectedProvider.rejection_reason && (
                <div className="p-3 bg-destructive/10 rounded-lg">
                  <p className="text-sm text-destructive font-medium">Rejection Reason:</p>
                  <p className="text-sm text-destructive">{selectedProvider.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailsDialogOpen(false)}>
              Close
            </Button>
            {selectedProvider?.application_status !== "approved" && (
              <Button 
                className="bg-emerald-600 hover:bg-emerald-700"
                onClick={() => {
                  handleApprove(selectedProvider!);
                  setDetailsDialogOpen(false);
                }}
              >
                Approve
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rejection Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Application</DialogTitle>
            <DialogDescription>
              Provide a reason for rejecting {selectedProvider?.business_name}'s application. This will be shown to the provider.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            placeholder="Enter rejection reason..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={4}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectDialogOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleReject}>
              Reject Application
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminProviders;