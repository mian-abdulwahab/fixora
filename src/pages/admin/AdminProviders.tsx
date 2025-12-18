import { useState } from "react";
import { useAllProviders, useUpdateProvider } from "@/hooks/useAdmin";
import { format } from "date-fns";
import { Search, CheckCircle, XCircle, Star, MapPin } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const AdminProviders = () => {
  const { data: providers = [], isLoading } = useAllProviders();
  const updateProvider = useUpdateProvider();
  const [search, setSearch] = useState("");

  const filteredProviders = providers.filter(provider => 
    provider.business_name?.toLowerCase().includes(search.toLowerCase()) ||
    provider.email?.toLowerCase().includes(search.toLowerCase())
  );

  const handleVerify = async (id: string, verified: boolean) => {
    try {
      await updateProvider.mutateAsync({ id, updates: { verified } });
      toast.success(verified ? "Provider verified" : "Provider unverified");
    } catch (error) {
      toast.error("Failed to update provider");
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
        <p className="text-muted-foreground">Manage and verify service providers on the platform.</p>
      </div>

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
              <TableHead>Location</TableHead>
              <TableHead>Rating</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Verified</TableHead>
              <TableHead>Joined</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProviders.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                  No providers found
                </TableCell>
              </TableRow>
            ) : (
              filteredProviders.map((provider) => (
                <TableRow key={provider.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium text-foreground">{provider.business_name}</p>
                      <p className="text-sm text-muted-foreground">{provider.email}</p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      {provider.location || "—"}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span>{Number(provider.rating || 0).toFixed(1)}</span>
                      <span className="text-muted-foreground">({provider.total_reviews || 0})</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      provider.is_active 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {provider.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell>
                    {provider.verified ? (
                      <CheckCircle className="w-5 h-5 text-emerald-600" />
                    ) : (
                      <XCircle className="w-5 h-5 text-muted-foreground" />
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {provider.created_at ? format(new Date(provider.created_at), "MMM d, yyyy") : "—"}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleVerify(provider.id, !provider.verified)}
                      >
                        {provider.verified ? "Unverify" : "Verify"}
                      </Button>
                      <Button
                        variant={provider.is_active ? "destructive" : "default"}
                        size="sm"
                        onClick={() => handleToggleActive(provider.id, !provider.is_active)}
                      >
                        {provider.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};

export default AdminProviders;
