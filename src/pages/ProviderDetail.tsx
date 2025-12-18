import { useState } from "react";
import { useParams, Link } from "react-router-dom";
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

const mockProvider = {
  id: "1",
  name: "Ahmed's Plumbing Services",
  category: "Plumbing",
  rating: 4.9,
  reviews: 156,
  jobs: 320,
  location: "Sahiwal, Punjab",
  verified: true,
  phone: "+92 300 1234567",
  email: "ahmed@plumbingservices.com",
  image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&h=400&fit=crop",
  avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
  description: "Professional plumbing services with over 10 years of experience. We specialize in residential and commercial plumbing, including leak repairs, pipe installation, drain cleaning, and emergency services. Our team is fully licensed and insured, ensuring quality work every time.",
  services: [
    { name: "Leak Repair", price: "$50 - $150", duration: "1-2 hours" },
    { name: "Pipe Installation", price: "$100 - $300", duration: "2-4 hours" },
    { name: "Drain Cleaning", price: "$75 - $200", duration: "1-2 hours" },
    { name: "Water Heater Service", price: "$150 - $400", duration: "2-3 hours" },
    { name: "Emergency Plumbing", price: "$100 - $250", duration: "Varies" },
  ],
  reviews_list: [
    { id: 1, user: "Ali K.", rating: 5, comment: "Excellent service! Ahmed fixed our leak quickly and professionally. Highly recommend!", date: "2 weeks ago" },
    { id: 2, user: "Sarah M.", rating: 5, comment: "Very responsive and fair pricing. Will definitely use again.", date: "1 month ago" },
    { id: 3, user: "Hassan R.", rating: 4, comment: "Good work, arrived on time. Minor delay in getting parts but overall satisfied.", date: "1 month ago" },
  ],
};

const timeSlots = [
  "09:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM", "05:00 PM"
];

const ProviderDetail = () => {
  const { id } = useParams();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [selectedService, setSelectedService] = useState("");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [isBookingOpen, setIsBookingOpen] = useState(false);

  const handleBooking = (e: React.FormEvent) => {
    e.preventDefault();
    toast({
      title: "Booking Submitted!",
      description: "Your booking request has been sent. The provider will contact you shortly.",
    });
    setIsBookingOpen(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero Section */}
        <div className="relative h-64 md:h-80 overflow-hidden">
          <img
            src={mockProvider.image}
            alt={mockProvider.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
        </div>

        <div className="container mx-auto px-4">
          {/* Provider Info Card */}
          <div className="relative -mt-24 mb-8">
            <div className="bg-card rounded-2xl shadow-card-hover p-6 md:p-8">
              <div className="flex flex-col md:flex-row gap-6">
                {/* Avatar */}
                <div className="shrink-0">
                  <img
                    src={mockProvider.avatar}
                    alt={mockProvider.name}
                    className="w-24 h-24 md:w-32 md:h-32 rounded-2xl object-cover border-4 border-card shadow-lg"
                  />
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-foreground">
                          {mockProvider.name}
                        </h1>
                        {mockProvider.verified && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <p className="text-muted-foreground mb-4">{mockProvider.category}</p>
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <div className="flex items-center gap-1">
                          <Star className="w-5 h-5 text-accent fill-accent" />
                          <span className="font-semibold text-foreground">{mockProvider.rating}</span>
                          <span className="text-muted-foreground">({mockProvider.reviews} reviews)</span>
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <MapPin className="w-4 h-4" />
                          {mockProvider.location}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Award className="w-4 h-4" />
                          {mockProvider.jobs} jobs completed
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <Button variant="outline" size="lg">
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Message
                      </Button>
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
                              Schedule an appointment with {mockProvider.name}
                            </DialogDescription>
                          </DialogHeader>
                          <form onSubmit={handleBooking} className="space-y-4 mt-4">
                            <div className="space-y-2">
                              <Label>Select Service</Label>
                              <Select value={selectedService} onValueChange={setSelectedService}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Choose a service" />
                                </SelectTrigger>
                                <SelectContent>
                                  {mockProvider.services.map((service) => (
                                    <SelectItem key={service.name} value={service.name}>
                                      {service.name} ({service.price})
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>

                            <div className="space-y-2">
                              <Label>Select Date</Label>
                              <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                disabled={(date) => date < new Date()}
                                className="rounded-md border"
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Select Time</Label>
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
                              <Label>Your Address</Label>
                              <Input
                                placeholder="Enter your address"
                                value={address}
                                onChange={(e) => setAddress(e.target.value)}
                                required
                              />
                            </div>

                            <div className="space-y-2">
                              <Label>Additional Notes (Optional)</Label>
                              <Textarea
                                placeholder="Describe your issue or any special requirements..."
                                value={notes}
                                onChange={(e) => setNotes(e.target.value)}
                                rows={3}
                              />
                            </div>

                            <Button type="submit" className="w-full">
                              Confirm Booking
                            </Button>
                          </form>
                        </DialogContent>
                      </Dialog>
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
                  {mockProvider.description}
                </p>
              </section>

              {/* Services */}
              <section className="bg-card rounded-2xl shadow-card p-6">
                <h2 className="text-xl font-semibold text-foreground mb-4">Services Offered</h2>
                <div className="space-y-3">
                  {mockProvider.services.map((service) => (
                    <div
                      key={service.name}
                      className="flex items-center justify-between p-4 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                    >
                      <div>
                        <h3 className="font-medium text-foreground">{service.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          <Clock className="w-3 h-3 inline mr-1" />
                          {service.duration}
                        </p>
                      </div>
                      <span className="font-semibold text-primary">{service.price}</span>
                    </div>
                  ))}
                </div>
              </section>

              {/* Reviews */}
              <section className="bg-card rounded-2xl shadow-card p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-foreground">Reviews</h2>
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <span className="font-semibold text-foreground">{mockProvider.rating}</span>
                    <span className="text-muted-foreground">({mockProvider.reviews} reviews)</span>
                  </div>
                </div>
                <div className="space-y-4">
                  {mockProvider.reviews_list.map((review) => (
                    <div key={review.id} className="p-4 rounded-xl bg-secondary/50">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-foreground">{review.user}</span>
                        <span className="text-sm text-muted-foreground">{review.date}</span>
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
                      <p className="text-muted-foreground text-sm">{review.comment}</p>
                    </div>
                  ))}
                </div>
              </section>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Card */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Contact Information</h3>
                <div className="space-y-3">
                  <a
                    href={`tel:${mockProvider.phone}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <Phone className="w-5 h-5 text-primary" />
                    <span className="text-foreground">{mockProvider.phone}</span>
                  </a>
                  <a
                    href={`mailto:${mockProvider.email}`}
                    className="flex items-center gap-3 p-3 rounded-xl bg-secondary/50 hover:bg-secondary transition-colors"
                  >
                    <Mail className="w-5 h-5 text-primary" />
                    <span className="text-foreground text-sm">{mockProvider.email}</span>
                  </a>
                </div>
              </div>

              {/* Trust Badges */}
              <div className="bg-card rounded-2xl shadow-card p-6">
                <h3 className="font-semibold text-foreground mb-4">Why Choose Us</h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Verified Provider</p>
                      <p className="text-xs text-muted-foreground">Background checked</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <Award className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">10+ Years Experience</p>
                      <p className="text-xs text-muted-foreground">Industry professional</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground text-sm">Satisfaction Guaranteed</p>
                      <p className="text-xs text-muted-foreground">Money back promise</p>
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
