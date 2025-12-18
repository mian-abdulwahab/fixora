import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Shield, Clock, Star } from "lucide-react";
import { useState } from "react";

const HeroSection = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [location, setLocation] = useState("");

  const stats = [
    { icon: Shield, value: "5,000+", label: "Verified Providers" },
    { icon: Star, value: "4.9", label: "Average Rating" },
    { icon: Clock, value: "30 min", label: "Avg Response Time" },
  ];

  return (
    <section className="relative min-h-[90vh] flex items-center gradient-hero overflow-hidden">
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-20 left-20 w-72 h-72 bg-primary-foreground rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-accent rounded-full blur-3xl" />
      </div>

      <div className="container mx-auto px-4 py-20 md:py-32 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-foreground/10 backdrop-blur-sm border border-primary-foreground/20 text-primary-foreground text-sm mb-8 animate-fade-in-up">
            <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
            Trusted by 50,000+ homeowners
          </div>

          {/* Heading */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-primary-foreground mb-6 animate-fade-in-up delay-100">
            Your Home Repairs,{" "}
            <span className="relative">
              Simplified
              <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                <path d="M2 10C50 2 150 2 198 10" stroke="hsl(var(--accent))" strokeWidth="4" strokeLinecap="round" />
              </svg>
            </span>
          </h1>

          <p className="text-lg md:text-xl text-primary-foreground/80 mb-10 max-w-2xl mx-auto animate-fade-in-up delay-200">
            Connect with verified local professionals for all your home repair and maintenance needs. Book instantly, pay securely, and enjoy peace of mind.
          </p>

          {/* Search Box */}
          <div className="bg-primary-foreground rounded-2xl p-2 shadow-2xl max-w-3xl mx-auto animate-fade-in-up delay-300">
            <div className="flex flex-col md:flex-row gap-2">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="What service do you need?"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <div className="flex-1 relative">
                <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Your location"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full h-12 md:h-14 pl-12 pr-4 rounded-xl bg-secondary/50 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>
              <Button variant="accent" size="xl" className="md:w-auto" asChild>
                <Link to="/services">Find Services</Link>
              </Button>
            </div>
          </div>

          {/* Popular Services */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3 animate-fade-in-up delay-400">
            <span className="text-primary-foreground/60 text-sm">Popular:</span>
            {["Plumbing", "Electrical", "AC Repair", "Painting"].map((service) => (
              <Link
                key={service}
                to={`/services?q=${service.toLowerCase()}`}
                className="px-4 py-2 rounded-full bg-primary-foreground/10 hover:bg-primary-foreground/20 text-primary-foreground text-sm font-medium transition-colors"
              >
                {service}
              </Link>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-3xl mx-auto">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`flex items-center justify-center gap-3 p-4 rounded-xl bg-primary-foreground/10 backdrop-blur-sm animate-fade-in-up`}
              style={{ animationDelay: `${500 + index * 100}ms` }}
            >
              <stat.icon className="w-8 h-8 text-accent" />
              <div className="text-left">
                <div className="text-2xl font-bold text-primary-foreground">{stat.value}</div>
                <div className="text-sm text-primary-foreground/70">{stat.label}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
