import { Link } from "react-router-dom";
import { Star, MapPin, CheckCircle2, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

const featuredProviders = [
  {
    id: "1",
    name: "Ahmed's Plumbing",
    category: "Plumbing",
    rating: 4.9,
    reviews: 156,
    jobs: 320,
    location: "Sahiwal, Punjab",
    verified: true,
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=400&fit=crop",
    specialties: ["Leak Repair", "Pipe Installation", "Drain Cleaning"],
  },
  {
    id: "2",
    name: "PowerFix Electrical",
    category: "Electrical",
    rating: 4.8,
    reviews: 203,
    jobs: 450,
    location: "Sahiwal, Punjab",
    verified: true,
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=400&fit=crop",
    specialties: ["Wiring", "Installations", "Safety Inspections"],
  },
  {
    id: "3",
    name: "CoolBreeze HVAC",
    category: "HVAC",
    rating: 4.9,
    reviews: 98,
    jobs: 180,
    location: "Sahiwal, Punjab",
    verified: true,
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=400&fit=crop",
    specialties: ["AC Repair", "Heating Systems", "Maintenance"],
  },
];

const FeaturedProvidersSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              Top Rated
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
              Featured Service Providers
            </h2>
            <p className="text-muted-foreground text-lg max-w-xl">
              Discover our highest-rated professionals, trusted by thousands of homeowners.
            </p>
          </div>
          <Button variant="outline" asChild>
            <Link to="/services">
              View All Providers
              <ArrowRight className="w-4 h-4 ml-2" />
            </Link>
          </Button>
        </div>

        {/* Providers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredProviders.map((provider) => (
            <Link
              key={provider.id}
              to={`/provider/${provider.id}`}
              className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
            >
              {/* Header with Image */}
              <div className="relative h-48 overflow-hidden">
                <img
                  src={provider.image}
                  alt={provider.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="text-lg font-semibold text-primary-foreground">
                      {provider.name}
                    </h3>
                    {provider.verified && (
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                    )}
                  </div>
                  <span className="text-primary-foreground/80 text-sm">
                    {provider.category}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                {/* Rating & Location */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    <Star className="w-5 h-5 text-accent fill-accent" />
                    <span className="font-semibold text-foreground">{provider.rating}</span>
                    <span className="text-muted-foreground text-sm">
                      ({provider.reviews} reviews)
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-muted-foreground text-sm">
                    <MapPin className="w-4 h-4" />
                    {provider.location}
                  </div>
                </div>

                {/* Specialties */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {provider.specialties.map((specialty) => (
                    <span
                      key={specialty}
                      className="px-3 py-1 rounded-full bg-secondary text-secondary-foreground text-xs font-medium"
                    >
                      {specialty}
                    </span>
                  ))}
                </div>

                {/* Stats */}
                <div className="flex items-center justify-between pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">
                    <span className="font-semibold text-foreground">{provider.jobs}</span> jobs completed
                  </span>
                  <span className="text-primary text-sm font-medium group-hover:underline">
                    View Profile
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProvidersSection;
