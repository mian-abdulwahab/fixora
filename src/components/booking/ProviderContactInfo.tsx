import { Phone, Mail, MapPin } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatPhoneForDisplay } from "@/lib/phoneValidation";

interface ProviderContactInfoProps {
  providerId: string;
  bookingStatus: string;
}

const ProviderContactInfo = ({ providerId, bookingStatus }: ProviderContactInfoProps) => {
  const showContact = ["confirmed", "in_progress", "completed"].includes(bookingStatus);

  const { data: provider, isLoading } = useQuery({
    queryKey: ["provider-contact", providerId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("service_providers")
        .select("phone, email, location")
        .eq("id", providerId)
        .maybeSingle();
      
      if (error) throw error;
      return data;
    },
    enabled: showContact && !!providerId,
  });

  if (!showContact) {
    return (
      <div className="bg-muted/50 rounded-lg p-4 text-sm text-muted-foreground">
        <p>Provider contact information will be available once your booking is confirmed.</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="bg-secondary/50 rounded-lg p-4 animate-pulse">
        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  if (!provider) return null;

  return (
    <div className="bg-secondary/50 rounded-lg p-4 space-y-2">
      <h4 className="font-medium text-foreground text-sm mb-3">Provider Contact</h4>
      {provider.phone && (
        <div className="flex items-center gap-2 text-sm">
          <Phone className="w-4 h-4 text-primary" />
          <a href={`tel:${provider.phone}`} className="text-foreground hover:text-primary transition-colors">
            {formatPhoneForDisplay(provider.phone)}
          </a>
        </div>
      )}
      {provider.email && (
        <div className="flex items-center gap-2 text-sm">
          <Mail className="w-4 h-4 text-primary" />
          <a href={`mailto:${provider.email}`} className="text-foreground hover:text-primary transition-colors">
            {provider.email}
          </a>
        </div>
      )}
      {provider.location && (
        <div className="flex items-center gap-2 text-sm">
          <MapPin className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">{provider.location}</span>
        </div>
      )}
    </div>
  );
};

export default ProviderContactInfo;
