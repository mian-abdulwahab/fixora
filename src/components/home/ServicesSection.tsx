import { Link } from "react-router-dom";
import { 
  Droplets, 
  Zap, 
  Wind, 
  Hammer, 
  Paintbrush, 
  Home,
  Wrench,
  Leaf,
  ArrowRight
} from "lucide-react";

const services = [
  {
    id: "plumbing",
    name: "Plumbing",
    description: "Leak repairs, pipe installation, drain cleaning & more",
    icon: Droplets,
    color: "from-blue-500 to-blue-600",
  },
  {
    id: "electrical",
    name: "Electrical",
    description: "Wiring, installations, repairs & safety inspections",
    icon: Zap,
    color: "from-yellow-500 to-orange-500",
  },
  {
    id: "hvac",
    name: "HVAC",
    description: "AC repair, heating systems, duct cleaning & maintenance",
    icon: Wind,
    color: "from-cyan-500 to-teal-500",
  },
  {
    id: "carpentry",
    name: "Carpentry",
    description: "Furniture repair, custom woodwork & installations",
    icon: Hammer,
    color: "from-amber-500 to-amber-600",
  },
  {
    id: "painting",
    name: "Painting",
    description: "Interior & exterior painting, wallpaper & finishing",
    icon: Paintbrush,
    color: "from-purple-500 to-pink-500",
  },
  {
    id: "appliance",
    name: "Appliances",
    description: "Repair & maintenance for all home appliances",
    icon: Home,
    color: "from-slate-500 to-slate-600",
  },
  {
    id: "handyman",
    name: "Handyman",
    description: "General repairs, assembly & odd jobs around the house",
    icon: Wrench,
    color: "from-emerald-500 to-green-600",
  },
  {
    id: "landscaping",
    name: "Landscaping",
    description: "Garden maintenance, lawn care & outdoor projects",
    icon: Leaf,
    color: "from-green-500 to-emerald-500",
  },
];

const ServicesSection = () => {
  return (
    <section className="py-20 md:py-28 bg-background">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            Our Services
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Professional Services for Every Need
          </h2>
          <p className="text-muted-foreground text-lg">
            From quick fixes to major repairs, our verified professionals are ready to help with all your home maintenance needs.
          </p>
        </div>

        {/* Services Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, index) => (
            <Link
              key={service.id}
              to={`/services?category=${service.id}`}
              className="group relative bg-card rounded-2xl p-6 shadow-card hover:shadow-card-hover transition-all duration-300 hover:-translate-y-1 overflow-hidden"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              {/* Gradient Background on Hover */}
              <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
              
              {/* Icon */}
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <service.icon className="w-7 h-7 text-primary-foreground" />
              </div>

              {/* Content */}
              <h3 className="text-lg font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                {service.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-4">
                {service.description}
              </p>

              {/* Arrow */}
              <div className="flex items-center text-primary text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                Browse services
                <ArrowRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
              </div>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center mt-12">
          <Link
            to="/services"
            className="inline-flex items-center gap-2 text-primary font-medium hover:gap-3 transition-all"
          >
            View all services
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;
