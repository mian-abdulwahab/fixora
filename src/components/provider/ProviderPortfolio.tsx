import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Image as ImageIcon, X, Expand } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ProviderPortfolioProps {
  providerId: string;
  editable?: boolean;
}

const ProviderPortfolio = ({ providerId, editable = false }: ProviderPortfolioProps) => {
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [newPortfolio, setNewPortfolio] = useState({
    image_url: "",
    title: "",
    description: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch portfolio items
  const { data: portfolioItems = [], isLoading } = useQuery({
    queryKey: ["provider-portfolio", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("provider_portfolios")
        .select("*")
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!providerId,
  });

  // Add portfolio item mutation
  const addPortfolioMutation = useMutation({
    mutationFn: async (data: typeof newPortfolio) => {
      const { error } = await supabase.from("provider_portfolios").insert({
        provider_id: providerId,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-portfolio"] });
      setIsAddOpen(false);
      setNewPortfolio({ image_url: "", title: "", description: "" });
      toast({ title: "Portfolio item added!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to add portfolio item",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete portfolio item mutation
  const deletePortfolioMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("provider_portfolios").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["provider-portfolio"] });
      toast({ title: "Portfolio item removed!" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPortfolio.image_url) {
      toast({
        title: "Image URL required",
        description: "Please provide an image URL for your portfolio item.",
        variant: "destructive",
      });
      return;
    }
    addPortfolioMutation.mutate(newPortfolio);
  };

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-muted rounded w-1/3"></div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="aspect-square bg-muted rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-2xl shadow-card p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <ImageIcon className="w-6 h-6 text-primary" />
          <h2 className="text-xl font-semibold text-foreground">Portfolio</h2>
        </div>
        {editable && (
          <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Add Photo
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Portfolio Photo</DialogTitle>
                <DialogDescription>
                  Showcase your work by adding photos of completed projects
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL *</Label>
                  <Input
                    id="image_url"
                    placeholder="https://example.com/image.jpg"
                    value={newPortfolio.image_url}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, image_url: e.target.value })
                    }
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Paste a direct link to your image
                  </p>
                </div>
                {newPortfolio.image_url && (
                  <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
                    <img
                      src={newPortfolio.image_url}
                      alt="Preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = "/placeholder.svg";
                      }}
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="title">Title (optional)</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Kitchen Renovation"
                    value={newPortfolio.title}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, title: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description (optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe the project..."
                    value={newPortfolio.description}
                    onChange={(e) =>
                      setNewPortfolio({ ...newPortfolio, description: e.target.value })
                    }
                    rows={3}
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={addPortfolioMutation.isPending}
                >
                  {addPortfolioMutation.isPending ? "Adding..." : "Add to Portfolio"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {portfolioItems.length === 0 ? (
        <div className="text-center py-12 bg-secondary/30 rounded-lg">
          <ImageIcon className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">
            {editable
              ? "No portfolio items yet. Add photos of your work!"
              : "No portfolio photos available"}
          </p>
          {editable && (
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => setIsAddOpen(true)}
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Photo
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {portfolioItems.map((item) => (
            <div
              key={item.id}
              className="group relative aspect-square rounded-lg overflow-hidden cursor-pointer"
              onClick={() => setSelectedImage(item.image_url)}
            >
              <img
                src={item.image_url}
                alt={item.title || "Portfolio item"}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "/placeholder.svg";
                }}
              />
              <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-colors flex items-center justify-center">
                <Expand className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {item.title && (
                <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-foreground/80 to-transparent">
                  <p className="text-white text-sm font-medium truncate">
                    {item.title}
                  </p>
                </div>
              )}
              {editable && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deletePortfolioMutation.mutate(item.id);
                  }}
                  className="absolute top-2 right-2 p-2 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedImage && (
        <div
          className="fixed inset-0 z-50 bg-foreground/90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <button
            className="absolute top-4 right-4 p-2 text-white hover:bg-white/10 rounded-full"
            onClick={() => setSelectedImage(null)}
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={selectedImage}
            alt="Portfolio"
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
};

export default ProviderPortfolio;