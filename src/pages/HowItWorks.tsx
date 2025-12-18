import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import HowItWorksSection from "@/components/home/HowItWorksSection";
import CTASection from "@/components/home/CTASection";
import { Shield, Clock, Wallet, Star, CheckCircle2, Users } from "lucide-react";

const features = [
  {
    icon: Shield,
    title: "Verified Professionals",
    description: "All service providers go through a rigorous verification process including background checks and skill assessments.",
  },
  {
    icon: Clock,
    title: "Fast Response",
    description: "Get connected with available providers quickly. Most bookings are confirmed within 30 minutes.",
  },
  {
    icon: Wallet,
    title: "Secure Payments",
    description: "Your payments are protected. Pay securely through our platform and only release funds when satisfied.",
  },
  {
    icon: Star,
    title: "Quality Guaranteed",
    description: "Not satisfied? We'll work with you to make it right or provide a full refund.",
  },
  {
    icon: CheckCircle2,
    title: "Transparent Pricing",
    description: "No hidden fees or surprises. Get upfront quotes before booking any service.",
  },
  {
    icon: Users,
    title: "24/7 Support",
    description: "Our customer support team is available around the clock to help with any questions or concerns.",
  },
];

const HowItWorks = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 md:pt-24">
        {/* Hero */}
        <section className="py-16 md:py-24 bg-secondary/30">
          <div className="container mx-auto px-4 text-center">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
              How It Works
            </span>
            <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-6">
              Home Repairs Made Simple
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              We've simplified the process of finding and booking reliable home repair services. Here's how Fixora works.
            </p>
          </div>
        </section>

        {/* Steps */}
        <HowItWorksSection />

        {/* Features */}
        <section className="py-20 md:py-28 bg-background">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
                Why Choose Us
              </span>
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                The Fixora Advantage
              </h2>
              <p className="text-muted-foreground text-lg">
                We're committed to providing the best experience for both homeowners and service providers.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {features.map((feature, index) => (
                <div
                  key={feature.title}
                  className="bg-card rounded-2xl shadow-card p-6 hover:shadow-card-hover transition-all duration-300"
                >
                  <div className="w-12 h-12 rounded-xl gradient-hero flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-primary-foreground" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-muted-foreground text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <CTASection />
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
