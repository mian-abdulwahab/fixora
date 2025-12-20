import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Star, 
  MapPin, 
  CheckCircle2, 
  Phone, 
  Mail, 
  Clock,
  Calendar as CalendarIcon,
  MessageSquare,
  Shield,
  Award,
  ArrowLeft
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { useProviderReviews } from "@/hooks/useReviews";

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const ProviderDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  // Fetch provider details
  const { data: provider, isLoading: providerLoading } = useQuery({
    queryKey: ["provider-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("*")
        .eq("id", id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch provider services
  const { data: services = [] } = useQuery({
    queryKey: ["provider-services-public", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("provider_id", id)
        .eq("is_active", true);
      
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  // Fetch reviews
  const { data: reviews = [] } = useProviderReviews(id || "");

  // Fetch customer profile for address
  const { data: customerProfile } = useQuery({
    queryKey: ["customer-profile", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("address")
        .eq("id", user.id)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  // Set address from profile
  useState(() => {
    if (customerProfile?.address && !address) {
      setAddress(customerProfile.address);
    }
  });

  // Create booking mutation
  const createBookingMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Please login to book");
      if (!selectedDate || !selectedTime || !selectedService || !address) {
        throw new Error("Please fill all required fields");
      }

      const service = services.find(s => s.id === selectedService);
      if (!service) throw new Error("Service not found");

      const { data, error } = await supabase
        .from("bookings")
        .insert({
          user_id: user.id,
          provider_id: id,
          service_id: selectedService,
          scheduled_date: format(selectedDate, "yyyy-MM-dd"),
          scheduled_time: selectedTime,
          address,
          notes,
          total_amount: service.price,
        })
        .select()
        .single();

      if (error) throw error;

      // Create notification for provider
      if (provider?.user_id) {
        await supabase.from("notifications").insert({
          user_id: provider.user_id,
          title: "New Booking Request! 📅",
          message: `You have a new booking request for "${service.title}" on ${format(selectedDate, "MMM d, yyyy")} at ${selectedTime}.`,
          type: "booking",
          related_id: data.id,
          related_type: "booking",
        });
      }

      return data;
    },
    onSuccess: () => {
      toast({
        title: "Booking Submitted!",
        description: "Your booking request has been sent. The provider will respond shortly.",
      });
      setIsBookingOpen(false);
      queryClient.invalidateQueries({ queryKey: ["my-bookings"] });
      // Reset form
      setSelectedDate(undefined);
      setSelectedTime("");
      setSelectedService("");
      setNotes("");
    },
    onError: (error: Error) => {
      toast({
        title: "Booking Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to book a service.",
        variant: "destructive",
      });
      navigate("/login");
      return;
    }
    createBookingMutation.mutate();
  };

  if (providerLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <div className="pt-24 container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Provider Not Found</h1>
          <Button asChild>
            <Link to="/services">Browse Services</Link>
          </Button>
        </div>
      </div>
    );
  }

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : Number(provider.rating || 0);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          {provider.banner_image_url ? (
            <img
              src={provider.banner_image_url}
              alt={provider.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-r from-primary/20 to-accent/20" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          {/* Provider Info Card */}
          <div className="relative -mt-24 mb-8">
            <div className="bg-card rounded-2xl shadow-card-hover p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0">
                  {provider.avatar_url ? (
                    <img
                      src={provider.avatar_url}
                      alt={provider.business_name}
                      className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-card shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-primary/10 flex items-center justify-center border-4 border-card shadow-lg">
                      <span className="text-4xl font-bold text-primary">
                        {provider.business_name?.charAt(0) || "P"}
                      </span>
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          {provider.business_name}
                        </h1>
                        {provider.verified && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      {provider.location && (
                        <p className="text-muted-foreground mb-4">{provider.location}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-accent fill-accent" />
                          <span className="font-semibold text-foreground">
                            {averageRating.toFixed(1)}
                          </span>
                          <span className="text-muted-foreground">
                            ({provider.total_reviews || reviews.length} reviews)
                          </span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Award className="w-4 h-4" />
                          {provider.total_jobs || 0} jobs completed
                        </div>
                        {provider.experience_years && (
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Clock className="w-4 h-4" />
                            {provider.experience_years} years experience
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      {services.length === 0 ? (
                        <Button size="lg" disabled variant="secondary">
                          <CalendarIcon className="w-4 h-4 mr-2" />
                          No Services Available
                        </Button>
                      ) : (
                        <Dialog open={isBookingOpen} onOpenChange={setIsBookingOpen}>
                          <DialogTrigger asChild>
                            <Button size="lg">
                              <CalendarIcon className="w-4 h-4 mr-2" />
                              Book Now
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Book a Service</DialogTitle>
                              <DialogDescription>
                                Schedule an appointment with {provider.business_name}
                              </DialogDescription>
                            </DialogHeader>
                            <form onSubmit={handleBooking} className="space-y-4 mt-4">
                              <div className="space-y-2">
                                <Label>Select Service *</Label>
                                <Select value={selectedService} onValueChange={setSelectedService}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a service" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {services.map((service) => (
                                      <SelectItem key={service.id} value={service.id}>
                                        {service.title} (${Number(service.price).toFixed(0)})
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Select Date *</Label>
                                <Calendar
                                  mode="single"
                                  selected={selectedDate}
                                  onSelect={setSelectedDate}
                                  disabled={(date) => date < new Date()}
                                  className="rounded-md border"
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Select Time *</Label>
                                <Select value={selectedTime} onValueChange={setSelectedTime}>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Choose a time slot" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {timeSlots.map((time) => (
                                      <SelectItem key={time} value={time}>
                                        {time}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div className="space-y-2">
                                <Label>Your Address *</Label>
                                <Input
                                  placeholder="Enter your address"
                                  value={address}
                                  onChange={(e) => setAddress(e.target.value)}
                                  required
                                />
                              </div>

                              <div className="space-y-2">
                                <Label>Work Description / Notes</Label>
                                <Textarea
                                  placeholder="Describe the work needed or any special requirements..."
                                  value={notes}
                                  onChange={(e) => setNotes(e.target.value)}
                                  rows={3}
                                />
                              </div>

                              <Button 
                                type="submit" 
                                className="w-full"
                                disabled={createBookingMutation.isPending}
                              >
                                {createBookingMutation.isPending ? "Submitting..." : "Confirm Booking"}
                              </Button>
                            </form>
                          </DialogContent>
                        </Dialog>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-16">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-8">
              {/* About */}
              <section className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">About</h2>
                <p className="text-muted-foreground leading-relaxed">
                  {provider.description || "Professional service provider ready to help with your needs."}
                </p>
                {provider.skills && provider.skills.length > 0 && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-foreground mb-2">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {provider.skills.map((skill: string) => (
                        <span key={skill} className="px-3 py-1 bg-secondary rounded-full text-sm text-foreground">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Services */}
              <section className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Services Offered</h2>
                {services.length > 0 ? (
                  <div className="space-y-3">
                    {services.map((service) => (
                      <div
                        key={service.id}
                        className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                      >
                        <div>
                          <h3 className="font-medium text-foreground">{service.title}</h3>
                          {service.description && (
                            <p className="text-sm text-muted-foreground mt-1">{service.description}</p>
                          )}
                          {service.duration_minutes && (
                            <p className="text-sm text-muted-foreground">
                              <Clock className="w-3 h-3 inline mr-1" />
                              {service.duration_minutes} mins
                            </p>
                          )}
                        </div>
                        <span className="font-semibold text-primary">
                          ${Number(service.price).toFixed(0)}
                          {service.price_type === "hourly" && "/hr"}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CalendarIcon className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground font-medium">No services available yet</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      This provider hasn't added any services. Check back later!
                    </p>
                  </div>
                )}
              </section>

              {/* Reviews */}
              <section className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <span className="font-semibold text-foreground">{averageRating.toFixed(1)}</span>
                    <span className="text-muted-foreground">({reviews.length} reviews)</span>
                  </div>
                </div>
                {reviews.length > 0 ? (
                  <div className="space-y-4">
                    {reviews.map((review) => (
                      <div key={review.id} className="p-4 rounded-xl bg-secondary/50">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-foreground">
                            {review.profiles?.name || "Customer"}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(review.created_at), "MMM d, yyyy")}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mb-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? "text-accent fill-accent" : "text-muted"
                              }`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-muted-foreground text-sm">{review.comment}</p>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">No reviews yet.</p>
                )}
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-3">
                  {provider.phone && (
                    <a
                      href={`tel:${provider.phone}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <Phone className="w-5 h-5 text-primary" />
                      <span className="text-foreground">{provider.phone}</span>
                    </a>
                  )}
                  {provider.email && (
                    <a
                      href={`mailto:${provider.email}`}
                      className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <Mail className="w-5 h-5 text-primary" />
                      <span className="text-foreground text-sm">{provider.email}</span>
                    </a>
                  )}
                  {provider.location && (
                    <div className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50">
                      <MapPin className="w-5 h-5 text-primary" />
                      <span className="text-foreground text-sm">{provider.location}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Why Choose Us</h3>
                <div className="space-y-3">
                  {provider.verified && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">Verified Provider</p>
                        <p className="text-xs text-muted-foreground">Background checked</p>
                      </div>
                    </div>
                  )}
                  {provider.experience_years && provider.experience_years > 0 && (
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Award className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground text-sm">{provider.experience_years}+ Years Experience</p>
                        <p className="text-xs text-muted-foreground">Industry professional</p>
                      </div>
                    </div>
                  )}
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">{provider.total_jobs || 0} Jobs Completed</p>
                      <p className="text-xs text-muted-foreground">Trusted by customers</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProviderDetail;
