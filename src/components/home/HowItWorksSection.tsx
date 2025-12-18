import { Search, Calendar, CreditCard, ThumbsUp } from "lucide-react";

const steps = [
  {
    icon: Search,
    title: "Search & Browse",
    description: "Find the perfect service provider by browsing categories, reading reviews, and comparing prices.",
    step: "01",
  },
  {
    icon: Calendar,
    title: "Book Appointment",
    description: "Select your preferred date and time. Our providers offer flexible scheduling to fit your needs.",
    step: "02",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Pay securely through our platform. Your payment is protected until the job is completed.",
    step: "03",
  },
  {
    icon: ThumbsUp,
    title: "Rate & Review",
    description: "Share your experience to help others find great service providers in your area.",
    step: "04",
  },
];

const HowItWorksSection = () => {
  return (
    <section className="py-20 md:py-28 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            How It Works
          </span>
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Get Your Home Fixed in 4 Easy Steps
          </h2>
          <p className="text-muted-foreground text-lg">
            From finding the right professional to getting the job done, we've made the entire process simple and hassle-free.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Connecting Line (Desktop) */}
          <div className="hidden lg:block absolute top-16 left-[12.5%] right-[12.5%] h-0.5 bg-border" />

          {steps.map((step, index) => (
            <div
              key={step.step}
              className="relative text-center group"
            >
              {/* Step Number Badge */}
              <div className="relative inline-flex">
                <div className="w-32 h-32 rounded-full bg-card shadow-card group-hover:shadow-card-hover transition-all duration-300 flex items-center justify-center mb-6 relative z-10">
                  <step.icon className="w-12 h-12 text-primary" />
                </div>
                <span className="absolute -top-2 -right-2 w-10 h-10 rounded-full gradient-hero text-primary-foreground text-sm font-bold flex items-center justify-center shadow-lg z-20">
                  {step.step}
                </span>
              </div>

              {/* Content */}
              <h3 className="text-xl font-semibold text-foreground mb-3">
                {step.title}
              </h3>
              <p className="text-muted-foreground text-sm max-w-xs mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
