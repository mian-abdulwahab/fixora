import { Link } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { 
  MessageSquare,
  ArrowLeft,
  User
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";

const CustomerMessages = () => {
  const { user } = useAuth();

  // Fetch conversations (unique providers the customer has booked)
  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["customer-conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all unique providers from bookings
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          provider_id,
          service_providers(id, business_name, avatar_url)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      // Get unique providers
      const uniqueProviders = new Map();
      bookings?.forEach(booking => {
        if (booking.service_providers && !uniqueProviders.has(booking.provider_id)) {
          uniqueProviders.set(booking.provider_id, booking.service_providers);
        }
      });

      return Array.from(uniqueProviders.values());
    },
    enabled: !!user?.id,
  });

  return (
    <div className="min-h-screen bg-secondary/30">
      <Header />
      
      <main className="pt-20 md:pt-24 container mx-auto px-4 pb-12">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" asChild>
              <Link to="/dashboard">
                <ArrowLeft className="w-5 h-5" />
              </Link>
            </Button>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Messages</h1>
              <p className="text-muted-foreground">Chat with your service providers</p>
            </div>
          </div>

          <div className="bg-card rounded-2xl shadow-card">
            {isLoading ? (
              <div className="p-12 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              </div>
            ) : conversations.length > 0 ? (
              <div className="divide-y divide-border">
                {conversations.map((provider: any) => (
                  <div 
                    key={provider.id} 
                    className="p-4 hover:bg-secondary/50 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                        {provider.avatar_url ? (
                          <img 
                            src={provider.avatar_url} 
                            alt={provider.business_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-foreground">
                          {provider.business_name}
                        </h3>
                        <p className="text-sm text-muted-foreground truncate">
                          Click to start a conversation
                        </p>
                      </div>
                      <MessageSquare className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2">No conversations yet.</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Book a service to start chatting with providers.
                </p>
                <Button asChild>
                  <Link to="/services">Browse Services</Link>
                </Button>
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Full messaging functionality coming soon!
          </p>
        </div>
      </main>
    </div>
  );
};

export default CustomerMessages;
