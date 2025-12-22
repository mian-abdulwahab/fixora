import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";

export const useMessageNotifications = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const processedMessages = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("message-notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `receiver_id=eq.${user.id}`,
        },
        async (payload) => {
          const newMessage = payload.new as {
            id: string;
            sender_id: string;
            content: string;
            created_at: string;
          };

          // Prevent duplicate notifications
          if (processedMessages.current.has(newMessage.id)) {
            return;
          }
          processedMessages.current.add(newMessage.id);

          // Fetch sender info
          const { data: senderProfile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", newMessage.sender_id)
            .maybeSingle();

          const { data: senderProvider } = await supabase
            .from("service_providers")
            .select("business_name")
            .eq("user_id", newMessage.sender_id)
            .maybeSingle();

          const senderName = senderProvider?.business_name || senderProfile?.name || "Someone";

          toast({
            title: `New message from ${senderName}`,
            description: newMessage.content.length > 50 
              ? newMessage.content.substring(0, 50) + "..." 
              : newMessage.content,
          });

          // Invalidate unread messages count
          queryClient.invalidateQueries({ queryKey: ["unread-messages-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, toast, queryClient]);
};
