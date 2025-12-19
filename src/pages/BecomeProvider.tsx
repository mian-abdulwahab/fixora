import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  TrendingUp, 
  Calendar, 
  Wallet, 
  Users, 
  Shield,
  CheckCircle2,
  ArrowRight,
  Loader2
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useMutation } from "@tanstack/react-query";

const benefits = [
  {
    icon: TrendingUp,
    title: "Grow Your Business",
    description: "Access thousands of potential customers actively looking for your services.",
  },
  {
    icon: Calendar,
    title: "Flexible Schedule",
    description: "Set your own availability and work when it suits you best.",
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    description: "Get paid directly to your account with our secure payment system.",
  },
  {
    icon: Users,
    title: "Build Your Reputation",
    description: "Collect reviews and ratings to stand out from the competition.",
  },
];

const categories = [
  "Plumbing",
  "Electrical",
  "HVAC",
  "Carpentry",
  "Painting",
  "Appliances",
  "Handyman",
  "Landscaping",
];

const BecomeProvider = () => {
  const { toast } = useToast();
  const { user, signUp } = useAuth();
  const navigate = useNavigate();
  const [isNewUser, setIsNewUser] = useState(!user);
  const [formData, setFormData] = useState({
    businessName: "",
    ownerName: "",
    email: "",
    phone: "",
    password: "",
    category: "",
    experience: "",
    description: "",
    location: "",
    agreeTerms: false,
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Mutation for creating provider profile
  const createProviderMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("service_providers")
        .insert({
          user_id: userId,
          business_name: formData.businessName,
          description: formData.description,
          location: formData.location,
          phone: formData.phone,
          email: formData.email || user?.email,
          application_status: "pending",
          verified: false,
          is_active: true,
        });
      
      if (error) throw error;
      
      // Update user profile to provider role
      await supabase
        .from("profiles")
        .update({ role: "provider" })
        .eq("id", userId);
    },
    onSuccess: () => {
      toast({
        title: "Application Submitted!",
        description: "Your application has been submitted for review. We'll notify you once it's approved (usually within 24-48 hours).",
      });
      navigate("/provider-dashboard");
    },
    onError: (error: Error) => {
      toast({
        title: "Submission Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.agreeTerms) {
      toast({
        title: "Terms Required",
        description: "Please agree to the terms and conditions.",
        variant: "destructive",
      });
      return;
    }

    try {
      if (user) {
        // User is already logged in, just create provider profile
        await createProviderMutation.mutateAsync(user.id);
      } else {
        // New user - register first then create provider profile
        if (!formData.password || formData.password.length < 6) {
          toast({
            title: "Password Required",
            description: "Please enter a password with at least 6 characters.",
            variant: "destructive",
          });
          return;
        }

        const { error } = await signUp(formData.email, formData.password, formData.ownerName, "provider");
        
        if (error) {
          toast({
            title: "Registration Failed",
            description: error.message,
            variant: "destructive",
          });
          return;
        }

        // Get the newly created user
        const { data: { user: newUser } } = await supabase.auth.getUser();
        
        if (newUser) {
          await createProviderMutation.mutateAsync(newUser.id);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    }
  };

  const isSubmitting = createProviderMutation.isPending;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="relative py-20 md:py-28 gradient-hero overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
            <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
          </div>
          
          <div className="container mx-auto px-4 relative z-10">
            <div className="max-w-3xl mx-auto text-center">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm mb-6">
                <Shield className="w-4 h-4" />
                Join 5,000+ verified providers
              </span>
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6">
                Grow Your Service Business with Fixora
              </h1>
              <p className="text-lg md:text-xl text-primary-foreground/80 mb-8">
                Connect with homeowners in your area, manage bookings effortlessly, and get paid securely.
              </p>
              <Button variant="accent" size="xl" asChild>
                <a href="#apply">
                  Apply Now
                  <ArrowRight className="w-5 h-5 ml-2" />
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Benefits
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Why Join Fixora?
              </h2>
              <p className="text-muted-foreground text-lg">
                We provide everything you need to grow and manage your home service business.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {benefits.map((benefit) => (
                <div
                  key={benefit.title}
                  className="bg-card rounded-2xl shadow-card p-6 text-center hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-14 h-14 rounded-xl gradient-hero flex items-center justify-center mx-auto mb-4">
                    <benefit.icon className="w-7 h-7 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {benefit.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20 md:py-28 bg-secondary/30">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Get Started
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How to Become a Provider
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { step: "01", title: "Apply Online", description: "Fill out our simple application form with your business details and experience." },
                { step: "02", title: "Get Verified", description: "We'll review your application and verify your credentials within 24-48 hours." },
                { step: "03", title: "Start Earning", description: "Once approved, start receiving booking requests and grow your business!" },
              ].map((item) => (
                <div key={item.step} className="text-center">
                  <div className="w-16 h-16 rounded-full gradient-hero text-primary-foreground text-2xl font-bold flex items-center justify-center mx-auto mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-muted-foreground text-sm">{item.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Application Form */}
        <section id="apply" className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="max-w-2xl mx-auto">
              <div className="text-center mb-12">
                <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                  Application
                </span>
                <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                  Apply to Become a Provider
                </h2>
                <p className="text-muted-foreground">
                  Fill out the form below and we'll review your application within 24-48 hours.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="bg-card rounded-2xl shadow-card p-8 space-y-6">
                {/* Info Banner */}
                <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-6">
                  <div className="flex items-start gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                      <p className="text-sm text-foreground font-medium">What happens next?</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        After submitting, your application will be reviewed by our team. 
                        Once approved, you'll receive a verified badge and become visible to customers.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="businessName">Business Name *</Label>
                    <Input
                      id="businessName"
                      name="businessName"
                      placeholder="Your business name"
                      value={formData.businessName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ownerName">Owner Name *</Label>
                    <Input
                      id="ownerName"
                      name="ownerName"
                      placeholder="Your full name"
                      value={formData.ownerName}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      placeholder="your@email.com"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={!!user}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number *</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      placeholder="+92 xxx xxxxxxx"
                      value={formData.phone}
                      onChange={handleChange}
                      required
                    />
                  </div>
                </div>

                {/* Password field for new users */}
                {!user && (
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <Input
                      id="password"
                      name="password"
                      type="password"
                      placeholder="Create a password (min 6 characters)"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      minLength={6}
                    />
                    <p className="text-xs text-muted-foreground">
                      This will create your account on Fixora
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Service Category *</Label>
                    <Select
                      value={formData.category}
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat} value={cat.toLowerCase()}>
                            {cat}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      name="experience"
                      type="number"
                      placeholder="e.g., 5"
                      value={formData.experience}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="location">Service Area *</Label>
                  <Input
                    id="location"
                    name="location"
                    placeholder="City, Region"
                    value={formData.location}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">About Your Services *</Label>
                  <Textarea
                    id="description"
                    name="description"
                    placeholder="Tell us about your services, expertise, and what makes you stand out..."
                    value={formData.description}
                    onChange={handleChange}
                    rows={4}
                    required
                  />
                </div>

                <div className="flex items-start gap-3">
                  <Checkbox
                    id="agreeTerms"
                    checked={formData.agreeTerms}
                    onCheckedChange={(checked) =>
                      setFormData({ ...formData, agreeTerms: checked as boolean })
                    }
                  />
                  <label htmlFor="agreeTerms" className="text-sm text-muted-foreground">
                    I agree to the{" "}
                    <Link to="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link to="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>

                <Button 
                  type="submit" 
                  size="lg" 
                  className="w-full" 
                  disabled={!formData.agreeTerms || isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Submitting Application...
                    </>
                  ) : (
                    "Submit Application"
                  )}
                </Button>

                {user && (
                  <p className="text-center text-sm text-muted-foreground">
                    Logged in as {user.email}
                  </p>
                )}
              </form>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default BecomeProvider;