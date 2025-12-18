import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Wrench, Mail, Lock, Eye, EyeOff, User, Phone } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const Register = () => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [role, setRole] = useState<"user" | "provider">("user");
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

    setIsLoading(true);

    // Simulate registration - will be replaced with actual auth
    setTimeout(() => {
      toast({
        title: "Account created!",
        description: "Welcome to Fixora. Please check your email to verify your account.",
      });
      setIsLoading(false);
      navigate("/login");
    }, 1000);
  };

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
            Join the Fixora <br /> Community
          </h2>
          <p className="text-primary-foreground/80 text-lg max-w-md">
            {role === "user"
              ? "Get access to thousands of verified service providers in your area."
              : "Grow your business by connecting with homeowners who need your services."}
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
            Sign up to get started with Fixora
          </p>

          {/* Role Toggle */}
          <div className="flex p-1 bg-secondary rounded-lg mb-6">
            <button
              type="button"
              onClick={() => setRole("user")}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === "user"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              I need services
            </button>
            <button
              type="button"
              onClick={() => setRole("provider")}
              className={`flex-1 py-2.5 rounded-md text-sm font-medium transition-all ${
                role === "provider"
                  ? "bg-card shadow-sm text-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              I'm a provider
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
                  placeholder="Enter your phone number"
                  value={formData.phone}
                  onChange={handleChange}
                  className="pl-10 h-12"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={formData.password}
                  onChange={handleChange}
                  className="pl-10 pr-10 h-12"
                  required
                  minLength={8}
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

            <Button type="submit" className="w-full h-12" disabled={isLoading}>
              {isLoading ? "Creating account..." : "Create Account"}
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
