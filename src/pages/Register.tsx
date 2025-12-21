import { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Wrench, Mail, Lock, Eye, EyeOff, User, Phone, Shield, Key, Briefcase, Clock, MapPin } from "lucide-react";
import CitySelect from "@/components/ui/CitySelect";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { validatePakistaniPhone, getPhoneError, formatPakistaniPhone } from "@/lib/phoneValidation";

const SKILL_SUGGESTIONS = [
  "Plumbing", "Electrical", "HVAC", "Carpentry", "Painting", 
  "Landscaping", "Roofing", "Flooring", "Cleaning", "Moving",
  "Appliance Repair", "Pest Control", "Security Systems", "Pool Maintenance"
];

const Register = () => {
  const [searchParams] = useSearchParams();
  const initialRole = (searchParams.get("role") as "user" | "provider" | "admin") || "user";
  
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    adminKey: "",
    city: "",
    // Provider-specific fields
    businessName: "",
    description: "",
    location: "",
    experienceYears: "",
    skills: [] as string[],
    skillInput: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showAdminKey, setShowAdminKey] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [role, setRole] = useState<"user" | "provider" | "admin">(initialRole);
  const navigate = useNavigate();
  const { toast } = useToast();
  const { signUp, user, userRole, loading } = useAuth();

  // Update role when URL param changes
  useEffect(() => {
    const urlRole = searchParams.get("role") as "user" | "provider" | "admin";
    if (urlRole && ["user", "provider", "admin"].includes(urlRole)) {
      setRole(urlRole);
    }
  }, [searchParams]);

  // Redirect if already logged in based on role
  useEffect(() => {
    if (!loading && user && userRole) {
      redirectBasedOnRole(userRole);
    }
  }, [user, userRole, loading]);

  const redirectBasedOnRole = (userRoleValue: string) => {
    switch (userRoleValue) {
      case "admin":
        navigate("/admin");
        break;
      case "provider":
        navigate("/provider-dashboard");
        break;
      default:
        navigate("/dashboard");
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Validate phone on change
    if (name === "phone") {
      setPhoneError(getPhoneError(value));
    }
  };

  const handlePhoneBlur = () => {
    if (formData.phone) {
      const formatted = formatPakistaniPhone(formData.phone);
      setFormData({ ...formData, phone: formatted });
      setPhoneError(getPhoneError(formatted));
    }
  };

  const handleAddSkill = (skill: string) => {
    const trimmedSkill = skill.trim();
    if (trimmedSkill && !formData.skills.includes(trimmedSkill) && formData.skills.length < 10) {
      setFormData({ 
        ...formData, 
        skills: [...formData.skills, trimmedSkill],
        skillInput: ""
      });
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skillToRemove)
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "Please make sure both passwords are the same.",
        variant: "destructive",
      });
      return;
    }

    if (formData.password.length < 6) {
      toast({
        title: "Password too short",
        description: "Password must be at least 6 characters long.",
        variant: "destructive",
      });
      return;
    }

    // Validate phone number
    if (formData.phone && !validatePakistaniPhone(formData.phone)) {
      toast({
        title: "Invalid phone number",
        description: "Please enter a valid Pakistani phone number.",
        variant: "destructive",
      });
      return;
    }

    // Provider-specific validations
    if (role === "provider") {
      if (!formData.businessName.trim()) {
        toast({
          title: "Business name required",
          description: "Please enter your business or professional name.",
          variant: "destructive",
        });
        return;
      }
      if (formData.skills.length === 0) {
        toast({
          title: "Skills required",
          description: "Please add at least one skill.",
          variant: "destructive",
        });
        return;
      }
    }

    // Customer city validation
    if (role === "user" && !formData.city) {
      toast({
        title: "City required",
        description: "Please select your city to see nearby providers.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    // Verify admin key if registering as admin
    if (role === "admin") {
      if (!formData.adminKey.trim()) {
        toast({
          title: "Admin key required",
          description: "Please enter the admin registration key.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error: verifyError } = await supabase.functions.invoke("verify-admin-key", {
          body: { adminKey: formData.adminKey },
        });

        if (verifyError || !data?.valid) {
          toast({
            title: "Invalid admin key",
            description: "The admin registration key is incorrect.",
            variant: "destructive",
          });
          setIsLoading(false);
          return;
        }
      } catch {
        toast({
          title: "Verification failed",
          description: "Could not verify admin key. Please try again.",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    const { error } = await signUp(formData.email, formData.password, formData.name, role);

    if (error) {
      const errorMessage = error.message.toLowerCase();
      if (errorMessage.includes("already registered") || errorMessage.includes("already exists") || errorMessage.includes("duplicate")) {
        toast({
          title: "Email already registered",
          description: "An account with this email already exists. Please sign in instead.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Registration failed",
          description: error.message,
          variant: "destructive",
        });
      }
      setIsLoading(false);
      return;
    }

    // Get the newly created user
    const { data: { user: newUser } } = await supabase.auth.getUser();

    if (newUser) {
      // Update the profile with phone and city
      const profileUpdate: Record<string, string | null> = {
        phone: formData.phone || null,
        name: formData.name,
        email: formData.email,
      };

      if (role === "user") {
        // For customers, store city in address field (will be used for filtering)
        profileUpdate.address = formData.city;
      }

      await supabase
        .from("profiles")
        .update(profileUpdate)
        .eq("id", newUser.id);

      if (role === "provider") {
        const { error: providerError } = await supabase
          .from("service_providers")
          .insert({
            user_id: newUser.id,
            business_name: formData.businessName.trim(),
            description: formData.description.trim() || null,
            location: formData.location.trim() || null,
            email: formData.email,
            phone: formData.phone || null,
            experience_years: parseInt(formData.experienceYears) || 0,
            skills: formData.skills,
            application_status: "pending",
            verified: false,
            is_active: false,
          });

        if (providerError) {
          console.error("Error creating provider profile:", providerError);
          toast({
            title: "Profile creation issue",
            description: "Account created but provider profile couldn't be set up. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Application submitted!",
            description: "Your provider application has been submitted for review. You'll be notified once approved.",
          });
        }
      } else if (role === "admin") {
        const { data: roleData, error: roleError } = await supabase.functions.invoke("verify-admin-key", {
          body: { adminKey: formData.adminKey, userId: newUser.id },
        });

        if (roleError || !roleData?.roleAssigned) {
          console.error("Error assigning admin role:", roleError);
          toast({
            title: "Admin role assignment issue",
            description: "Account created but admin role couldn't be assigned. Please contact support.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Admin account created!",
            description: "Your admin account has been set up successfully.",
          });
        }
      } else {
        toast({
          title: "Account created!",
          description: "Please check your email to verify your account.",
        });
      }
    }

    setIsLoading(false);
    navigate("/verify-email");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Image */}
      <div className="hidden lg:flex flex-1 gradient-hero items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 right-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
          <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
        </div>
        <div className="text-center relative z-10">
          <h2 className="text-4xl font-bold text-primary-foreground mb-4">
            {role === "provider" ? "Grow Your Business" : "Join the Fixora"} <br /> 
            {role === "provider" ? "with Fixora" : "Community"}
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            {role === "admin"
              ? "Manage the platform, users, and service providers with full administrative access."
              : role === "provider"
              ? "Connect with homeowners who need your services. Your application will be reviewed by our team for verification."
              : "Get access to thousands of verified service providers in your area."}
          </p>
        </div>
      </div>

      {/* Right Side - Form */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-auto">
        <div className="w-full max-w-md py-8">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 mb-8">
            <div className="w-10 h-10 gradient-hero rounded-xl flex items-center justify-center">
              <Wrench className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold text-foreground">Fixora</span>
          </Link>

          <h1 className="text-3xl font-bold text-foreground mb-2">Create an account</h1>
          <p className="text-muted-foreground mb-6">
            {role === "provider" 
              ? "Register as a service provider to join our platform" 
              : "Sign up to get started with Fixora"}
          </p>

          {/* Role Toggle */}
          <div className="flex p-1 bg-secondary rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                role === "user"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Customer
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                role === "provider"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Provider
            </button>
            <button
              type="button"
              onClick={() => setRole("admin")}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-all ${
                role === "admin"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Admin
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="name"
                  name="name"
                  type="text"
                  placeholder="Enter your full name"
                  value={formData.name}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="phone"
                  name="phone"
                  type="tel"
                  placeholder="03XX-XXXXXXX"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handlePhoneBlur}
                  className={`pl-10 h-12 ${phoneError ? "border-destructive" : ""}`}
                  required={role === "provider"}
                />
              </div>
              {phoneError && (
                <p className="text-xs text-destructive">{phoneError}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Pakistani format: 03XX-XXXXXXX or +92XXXXXXXXXX
              </p>
            </div>

            {/* Customer city field */}
            {role === "user" && (
              <div className="space-y-2">
                <Label htmlFor="city">Your City *</Label>
                <CitySelect
                  value={formData.city}
                  onChange={(value) => setFormData({ ...formData, city: value })}
                  placeholder="Select your city..."
                />
                <p className="text-xs text-muted-foreground">
                  We'll show you service providers in your area
                </p>
              </div>
            )}

            {/* Provider-specific fields */}
            {role === "provider" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="businessName">Business / Professional Name *</Label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="businessName"
                      name="businessName"
                      type="text"
                      placeholder="e.g., John's Plumbing Services"
                      value={formData.businessName}
                      onChange={handleChange}
                      className="pl-10 h-12"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">City / Service Area</Label>
                  <CitySelect
                    value={formData.location}
                    onChange={(value) => setFormData({ ...formData, location: value })}
                    placeholder="Select your city..."
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="experienceYears">Years of Experience</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="experienceYears"
                      name="experienceYears"
                      type="number"
                      min="0"
                      max="50"
                      placeholder="e.g., 5"
                      value={formData.experienceYears}
                      onChange={handleChange}
                      className="pl-10 h-12"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Skills / Services Offered *</Label>
                  <div className="flex gap-2">
                    <Input
                      name="skillInput"
                      type="text"
                      placeholder="Type a skill and press Enter"
                      value={formData.skillInput}
                      onChange={handleChange}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddSkill(formData.skillInput);
                        }
                      }}
                      className="h-10"
                    />
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => handleAddSkill(formData.skillInput)}
                      disabled={!formData.skillInput.trim()}
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

                <div className="space-y-2">
                  <Label htmlFor="description">About Your Services</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Describe your services, experience, and what makes you stand out..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={3}
                    className="resize-none"
                  />
                </div>
              </>
            )}

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password (min 6 chars)"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            {/* Admin Key Field */}
            {role === "admin" && (
              <div className="space-y-2">
                <Label htmlFor="adminKey" className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-primary" />
                  Admin Registration Key
                </Label>
                <div className="relative">
                  <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <Input
                    id="adminKey"
                    name="adminKey"
                    type={showAdminKey ? "text" : "password"}
                    placeholder="Enter secret admin key"
                    value={formData.adminKey}
                    onChange={handleChange}
                    className="pl-10 pr-10 h-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowAdminKey(!showAdminKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showAdminKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  Contact system administrator to get the admin registration key
                </p>
              </div>
            )}

            {role === "provider" && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
                <strong>Note:</strong> Your application will be reviewed by our team. You'll be notified once approved and will then be visible to customers.
              </div>
            )}

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading 
                ? "Creating account..." 
                : role === "provider"
                  ? "Submit Application"
                  : `Create ${role === "admin" ? "Admin" : "Customer"} Account`
              }
            </Button>
          </form>

          <p className="text-center text-muted-foreground mt-6 text-sm">
            By signing up, you agree to our{" "}
            <Link to="/terms" className="text-primary hover:underline">
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link to="/privacy" className="text-primary hover:underline">
              Privacy Policy
            </Link>
          </p>

          <p className="text-center text-muted-foreground mt-4">
            Already have an account?{" "}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;
