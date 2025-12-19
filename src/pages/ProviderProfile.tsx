import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Mail, Phone, MapPin, Camera, Save, ArrowLeft, Briefcase, 
  Clock, Image as ImageIcon
} from "lucide-react";

const SKILL_SUGGESTIONS = [
  "Plumbing", "Electrical", "HVAC", "Carpentry", "Painting", 
  "Landscaping", "Roofing", "Flooring", "Cleaning", "Moving",
  "Appliance Repair", "Pest Control", "Security Systems", "Pool Maintenance"
];

const ProviderProfile = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    business_name: "",
    description: "",
    location: "",
    phone: "",
    email: "",
    experience_years: 0,
    skills: [] as string[],
    avatar_url: "",
    banner_image_url: "",
  });
  const [skillInput, setSkillInput] = useState("");
  const [uploading, setUploading] = useState<"avatar" | "banner" | null>(null);

  // Fetch provider profile
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["my-provider-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Update form when provider loads
  useEffect(() => {
    if (provider) {
      setFormData({
        business_name: provider.business_name || "",
        description: provider.description || "",
        location: provider.location || "",
        phone: provider.phone || "",
        email: provider.email || "",
        experience_years: provider.experience_years || 0,
        skills: provider.skills || [],
        avatar_url: provider.avatar_url || "",
        banner_image_url: provider.banner_image_url || "",
      });
    }
  }, [provider]);

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase
        .from("service_providers")
        .update({
          business_name: data.business_name,
          description: data.description,
          location: data.location,
          phone: data.phone,
          email: data.email,
          experience_years: data.experience_years,
          skills: data.skills,
          avatar_url: data.avatar_url,
          banner_image_url: data.banner_image_url,
        })
        .eq("user_id", user!.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-provider-profile"] });
      toast({ title: "Profile updated successfully!" });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to update profile",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Handle image upload
  const handleImageUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "avatar" | "banner"
  ) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(type);
    try {
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/${type}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      if (type === "avatar") {
        setFormData({ ...formData, avatar_url: publicUrl });
      } else {
        setFormData({ ...formData, banner_image_url: publicUrl });
      }
      toast({ title: "Image uploaded! Click Save to update profile." });
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setUploading(null);
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill) && formData.skills.length < 10) {
      setFormData({ ...formData, skills: [...formData.skills, trimmedSkill] });
      setSkillInput("");
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove),
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileMutation.mutate(formData);
  };

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || providerLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Provider profile not found.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-2xl">
          <Link to="/provider-dashboard" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>

          <div className="bg-card rounded-2xl shadow-card overflow-hidden">
            {/* Banner Image */}
            <div className="relative h-40 bg-gradient-to-r from-primary to-accent">
              {formData.banner_image_url && (
                <img 
                  src={formData.banner_image_url} 
                  alt="Banner" 
                  className="w-full h-full object-cover"
                />
              )}
              <label className="absolute bottom-4 right-4 px-3 py-2 bg-black/50 rounded-lg flex items-center gap-2 cursor-pointer hover:bg-black/70 transition-colors text-white text-sm">
                <ImageIcon className="w-4 h-4" />
                {uploading === "banner" ? "Uploading..." : "Change Banner"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleImageUpload(e, "banner")}
                  className="hidden"
                  disabled={uploading !== null}
                />
              </label>
            </div>

            <div className="p-8 pt-0">
              {/* Avatar */}
              <div className="flex justify-center -mt-12 mb-6">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-card border-4 border-card flex items-center justify-center overflow-hidden">
                    {formData.avatar_url ? (
                      <img 
                        src={formData.avatar_url} 
                        alt="Profile" 
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User className="w-12 h-12 text-primary" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center cursor-pointer hover:bg-primary/90 transition-colors">
                    <Camera className="w-4 h-4 text-primary-foreground" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, "avatar")}
                      className="hidden"
                      disabled={uploading !== null}
                    />
                  </label>
                </div>
              </div>

              <h1 className="text-2xl font-bold text-foreground text-center mb-6">
                Edit Business Profile
              </h1>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Business Name */}
                <div className="space-y-2">
                  <Label htmlFor="business_name">Business Name *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="business_name"
                      value={formData.business_name}
                      onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                      className="pl-10"
                      placeholder="Your business name"
                      required
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label htmlFor="description">About Your Services</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe your services, experience, and what makes you stand out..."
                    rows={4}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location">Service Area / Location</Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      className="pl-10"
                      placeholder="e.g., Sahiwal, Punjab"
                    />
                  </div>
                </div>

                {/* Experience Years */}
                <div className="space-y-2">
                  <Label htmlFor="experience_years">Years of Experience</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="experience_years"
                      type="number"
                      min="0"
                      max="50"
                      value={formData.experience_years}
                      onChange={(e) => setFormData({ ...formData, experience_years: parseInt(e.target.value) || 0 })}
                      className="pl-10"
                    />
                  </div>
                </div>

                {/* Skills */}
                <div className="space-y-2">
                  <Label>Skills / Services Offered</Label>
                  <div className="flex gap-2">
                    <Input
                      value={skillInput}
                      onChange={(e) => setSkillInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill(skillInput);
                        }
                      }}
                      placeholder="Type a skill and press Enter"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleAddSkill(skillInput)}
                      disabled={!skillInput.trim()}
                    >
                      Add
                    </Button>
                  </div>
                  
                  {/* Skill suggestions */}
                  <div className="flex flex-wrap gap-1 mt-2">
                    {SKILL_SUGGESTIONS.filter(s => !formData.skills.includes(s)).slice(0, 6).map(skill => (
                      <button
                        key={skill}
                        type="button"
                        onClick={() => handleAddSkill(skill)}
                        className="px-2 py-1 text-xs bg-secondary text-muted-foreground rounded hover:bg-secondary/80 transition-colors"
                      >
                        + {skill}
                      </button>
                    ))}
                  </div>

                  {/* Selected skills */}
                  {formData.skills.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {formData.skills.map(skill => (
                        <Badge 
                          key={skill} 
                          variant="secondary"
                          className="cursor-pointer hover:bg-destructive/20"
                          onClick={() => handleRemoveSkill(skill)}
                        >
                          {skill} ×
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Phone */}
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="pl-10"
                        placeholder="Phone number"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-2">
                    <Label htmlFor="email">Business Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="pl-10"
                        placeholder="Business email"
                      />
                    </div>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={updateProfileMutation.isPending}
                >
                  <Save className="w-4 h-4 mr-2" />
                  {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ProviderProfile;
