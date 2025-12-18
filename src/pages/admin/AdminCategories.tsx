import { useState } from "react";
import { useAllCategories, useCreateCategory, useUpdateCategory, useDeleteCategory } from "@/hooks/useAdmin";
import { Plus, Pencil, Trash2, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CategoryForm = {
  name: string;
  slug: string;
  description: string;
  icon: string;
};

const defaultForm: CategoryForm = {
  name: "",
  slug: "",
  description: "",
  icon: "",
};

const AdminCategories = () => {
  const { data: categories = [], isLoading } = useAllCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CategoryForm>(defaultForm);

  const handleOpenCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (category: typeof categories[0]) => {
    setEditingId(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      icon: category.icon || "",
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.slug) {
      toast.error("Name and slug are required");
      return;
    }

    try {
      if (editingId) {
        await updateCategory.mutateAsync({
          id: editingId,
          updates: form,
        });
        toast.success("Category updated");
      } else {
        await createCategory.mutateAsync(form);
        toast.success("Category created");
      }
      setIsDialogOpen(false);
      setForm(defaultForm);
      setEditingId(null);
    } catch (error) {
      toast.error("Failed to save category");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    
    try {
      await deleteCategory.mutateAsync(id);
      toast.success("Category deleted");
    } catch (error) {
      toast.error("Failed to delete category");
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
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
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-2">Service Categories</h1>
          <p className="text-muted-foreground">Manage the service categories available on the platform.</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>
      </div>

      <div className="bg-card rounded-xl shadow-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Icon</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  No categories found
                </TableCell>
              </TableRow>
            ) : (
              categories.map((category) => (
                <TableRow key={category.id}>
                  <TableCell className="font-medium text-foreground">
                    {category.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground font-mono text-sm">
                    {category.slug}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {category.icon || "—"}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">
                    {category.description || "—"}
                  </TableCell>
                  <TableCell>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      category.is_active 
                        ? "bg-emerald-100 text-emerald-700" 
                        : "bg-destructive/10 text-destructive"
                    }`}>
                      {category.is_active ? "Active" : "Inactive"}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEdit(category)}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => handleDelete(category.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Category" : "Create Category"}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Name *
              </label>
              <Input
                value={form.name}
                onChange={(e) => {
                  const name = e.target.value;
                  setForm(prev => ({
                    ...prev,
                    name,
                    slug: editingId ? prev.slug : generateSlug(name),
                  }));
                }}
                placeholder="e.g., Home Cleaning"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Slug *
              </label>
              <Input
                value={form.slug}
                onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))}
                placeholder="e.g., home-cleaning"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Icon (Lucide icon name)
              </label>
              <Input
                value={form.icon}
                onChange={(e) => setForm(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="e.g., home"
              />
            </div>
            
            <div>
              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Description
              </label>
              <Input
                value={form.description}
                onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Brief description of this category"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createCategory.isPending || updateCategory.isPending}>
              {editingId ? "Save Changes" : "Create Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
