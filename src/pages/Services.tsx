import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, 
  MapPin, 
  Star, 
  CheckCircle2, 
  Filter,
  SlidersHorizontal,
  ChevronDown
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const categories = [
  { id: "all", name: "All Services" },
  { id: "plumbing", name: "Plumbing" },
  { id: "electrical", name: "Electrical" },
  { id: "hvac", name: "HVAC" },
  { id: "carpentry", name: "Carpentry" },
  { id: "painting", name: "Painting" },
  { id: "appliance", name: "Appliances" },
  { id: "handyman", name: "Handyman" },
  { id: "landscaping", name: "Landscaping" },
];

const mockProviders = [
  {
    id: "1",
    name: "Ahmed's Plumbing Services",
    category: "plumbing",
    rating: 4.9,
    reviews: 156,
    jobs: 320,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $50",
    image: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=400&h=300&fit=crop",
    description: "Professional plumbing services with 10+ years of experience. Specializing in leak repairs, pipe installation, and emergency services.",
  },
  {
    id: "2",
    name: "PowerFix Electrical",
    category: "electrical",
    rating: 4.8,
    reviews: 203,
    jobs: 450,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $60",
    image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?w=400&h=300&fit=crop",
    description: "Licensed electricians offering comprehensive electrical services for residential and commercial properties.",
  },
  {
    id: "3",
    name: "CoolBreeze HVAC",
    category: "hvac",
    rating: 4.9,
    reviews: 98,
    jobs: 180,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $75",
    image: "https://images.unsplash.com/photo-1504328345606-18bbc8c9d7d1?w=400&h=300&fit=crop",
    description: "Expert HVAC technicians for all your heating and cooling needs. 24/7 emergency services available.",
  },
  {
    id: "4",
    name: "Master Woodworks",
    category: "carpentry",
    rating: 4.7,
    reviews: 87,
    jobs: 145,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $55",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop",
    description: "Custom carpentry and woodworking services. From furniture repair to full renovations.",
  },
  {
    id: "5",
    name: "ColorPro Painting",
    category: "painting",
    rating: 4.8,
    reviews: 134,
    jobs: 267,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $40",
    image: "https://images.unsplash.com/photo-1562259949-e8e7689d7828?w=400&h=300&fit=crop",
    description: "Professional painting services for interior and exterior projects. Quality work guaranteed.",
  },
  {
    id: "6",
    name: "QuickFix Handyman",
    category: "handyman",
    rating: 4.6,
    reviews: 245,
    jobs: 512,
    location: "Sahiwal, Punjab",
    verified: true,
    price: "From $35",
    image: "https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=400&h=300&fit=crop",
    description: "Your go-to handyman for all home repairs. No job too small!",
  },
];

const Services = () => {
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("category") || "all");
  const [sortBy, setSortBy] = useState("rating");

  const filteredProviders = mockProviders.filter((provider) => {
    const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      provider.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || provider.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedProviders = [...filteredProviders].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        return b.rating - a.rating;
      case "reviews":
        return b.reviews - a.reviews;
      case "jobs":
        return b.jobs - a.jobs;
      default:
        return 0;
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Search Header */}
        <div className="bg-secondary/30 border-b border-border">
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-foreground mb-6">Find Service Providers</h1>
            
            {/* Search Bar */}
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search services or providers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-12 bg-card"
                />
              </div>
              <div className="flex gap-4">
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-full md:w-[180px] h-12 bg-card">
                    <Filter className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="w-full md:w-[160px] h-12 bg-card">
                    <SlidersHorizontal className="w-4 h-4 mr-2" />
                    <SelectValue placeholder="Sort by" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="rating">Top Rated</SelectItem>
                    <SelectItem value="reviews">Most Reviews</SelectItem>
                    <SelectItem value="jobs">Most Jobs</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Results */}
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <p className="text-muted-foreground">
              <span className="font-semibold text-foreground">{sortedProviders.length}</span> providers found
            </p>
          </div>

          {/* Provider Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sortedProviders.map((provider) => (
              <Link
                key={provider.id}
                to={`/provider/${provider.id}`}
                className="group bg-card rounded-2xl shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden"
              >
                {/* Image */}
                <div className="relative h-48 overflow-hidden">
                  <img
                    src={provider.image}
                    alt={provider.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-4 right-4">
                    <span className="px-3 py-1 rounded-full bg-card/90 backdrop-blur-sm text-sm font-medium text-foreground">
                      {provider.price}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                      {provider.name}
                    </h3>
                    {provider.verified && (
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                    {provider.description}
                  </p>

                  <div className="flex items-center gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-accent fill-accent" />
                      <span className="font-medium text-foreground">{provider.rating}</span>
                      <span className="text-muted-foreground text-sm">({provider.reviews})</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground text-sm">
                      <MapPin className="w-4 h-4" />
                      {provider.location}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <span className="text-sm text-muted-foreground">
                      <span className="font-semibold text-foreground">{provider.jobs}</span> jobs
                    </span>
                    <Button size="sm">Book Now</Button>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {sortedProviders.length === 0 && (
            <div className="text-center py-16">
              <p className="text-muted-foreground text-lg mb-4">No providers found matching your criteria.</p>
              <Button variant="outline" onClick={() => { setSearchQuery(""); setSelectedCategory("all"); }}>
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Services;
