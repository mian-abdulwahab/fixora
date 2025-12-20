import { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MessageSquare, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender_id: string;
  receiver_id: string;
  created_at: string;
  read: boolean;
}

interface Conversation {
  id: string;
  name: string;
  avatar_url: string | null;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

const CustomerChat = () => {
  const { providerId } = useParams();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(providerId || null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations (providers the customer has booked with)
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["customer-conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get unique providers from bookings
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("provider_id")
        .eq("user_id", user.id);

      if (error) throw error;

      const providerIds = [...new Set(bookings.map(b => b.provider_id))];
      if (providerIds.length === 0) return [];

      // Get provider profiles
      const { data: providers } = await supabase
        .from("service_providers")
        .select("id, business_name, avatar_url, user_id")
        .in("id", providerIds);

      // Get last message and unread count for each provider
      const conversationList: Conversation[] = await Promise.all(
        (providers || []).map(async (provider) => {
          const { data: messages } = await supabase
            .from("messages")
            .select("*")
            .or(`sender_id.eq.${provider.user_id},receiver_id.eq.${provider.user_id}`)
            .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
            .order("created_at", { ascending: false })
            .limit(1);

          const lastMsg = messages?.find(m => 
            (m.sender_id === provider.user_id && m.receiver_id === user.id) ||
            (m.sender_id === user.id && m.receiver_id === provider.user_id)
          );

          const { count } = await supabase
            .from("messages")
            .select("*", { count: "exact", head: true })
            .eq("sender_id", provider.user_id)
            .eq("receiver_id", user.id)
            .eq("read", false);

          return {
            id: provider.user_id,
            name: provider.business_name || "Provider",
            avatar_url: provider.avatar_url,
            lastMessage: lastMsg?.content,
            lastMessageTime: lastMsg?.created_at,
            unreadCount: count || 0,
          };
        })
      );

      return conversationList.sort((a, b) => {
        if (!a.lastMessageTime) return 1;
        if (!b.lastMessageTime) return -1;
        return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
      });
    },
    enabled: !!user?.id,
  });

  // If providerId is passed, find the provider's user_id
  useEffect(() => {
    const fetchProviderUserId = async () => {
      if (providerId && !selectedConversation) {
        const { data } = await supabase
          .from("service_providers")
          .select("user_id")
          .eq("id", providerId)
          .single();
        
        if (data) {
          setSelectedConversation(data.user_id);
        }
      }
    };
    fetchProviderUserId();
  }, [providerId, selectedConversation]);

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["messages", selectedConversation, user?.id],
    queryFn: async () => {
      if (!selectedConversation || !user?.id) return [];

      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(
          `and(sender_id.eq.${user.id},receiver_id.eq.${selectedConversation}),and(sender_id.eq.${selectedConversation},receiver_id.eq.${user.id})`
        )
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data as Message[];
    },
    enabled: !!selectedConversation && !!user?.id,
  });

  // Mark messages as read
  useEffect(() => {
    const markAsRead = async () => {
      if (!selectedConversation || !user?.id) return;
      
      await supabase
        .from("messages")
        .update({ read: true })
        .eq("sender_id", selectedConversation)
        .eq("receiver_id", user.id)
        .eq("read", false);

      queryClient.invalidateQueries({ queryKey: ["customer-conversations"] });
    };

    markAsRead();
  }, [selectedConversation, user?.id, queryClient]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Real-time subscription
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel("customer-messages-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
        },
        (payload) => {
          const newMsg = payload.new as Message;
          if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
            queryClient.invalidateQueries({ queryKey: ["messages"] });
            queryClient.invalidateQueries({ queryKey: ["customer-conversations"] });
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, queryClient]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async () => {
      if (!selectedConversation || !user?.id || !newMessage.trim()) return;

      const { error } = await supabase.from("messages").insert({
        sender_id: user.id,
        receiver_id: selectedConversation,
        content: newMessage.trim(),
      });

      if (error) throw error;
    },
    onSuccess: () => {
      setNewMessage("");
      queryClient.invalidateQueries({ queryKey: ["messages"] });
      queryClient.invalidateQueries({ queryKey: ["customer-conversations"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to send message",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessageMutation.mutate();
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);
  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="pt-20 md:pt-24 pb-8">
        <div className="container mx-auto px-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>

          <div className="bg-card rounded-2xl shadow-card overflow-hidden h-[calc(100vh-12rem)]">
            <div className="flex h-full">
              {/* Conversations List */}
              <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
                <div className="p-4 border-b border-border">
                  <h2 className="text-lg font-semibold text-foreground mb-3">Messages</h2>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search conversations..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>

                <ScrollArea className="flex-1">
                  {conversationsLoading ? (
                    <div className="p-4 space-y-3">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="animate-pulse flex gap-3">
                          <div className="w-12 h-12 rounded-full bg-muted" />
                          <div className="flex-1 space-y-2">
                            <div className="h-4 bg-muted rounded w-1/2" />
                            <div className="h-3 bg-muted rounded w-3/4" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">No conversations yet</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Book a service to start chatting
                      </p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {filteredConversations.map((convo) => (
                        <button
                          key={convo.id}
                          onClick={() => setSelectedConversation(convo.id)}
                          className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                            selectedConversation === convo.id
                              ? "bg-primary/10"
                              : "hover:bg-secondary"
                          }`}
                        >
                          <Avatar className="w-12 h-12">
                            <AvatarImage src={convo.avatar_url || undefined} />
                            <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 text-left min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-foreground truncate">
                                {convo.name}
                              </span>
                              {convo.lastMessageTime && (
                                <span className="text-xs text-muted-foreground">
                                  {format(new Date(convo.lastMessageTime), "MMM d")}
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-muted-foreground truncate">
                              {convo.lastMessage || "No messages yet"}
                            </p>
                          </div>
                          {convo.unreadCount > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5">
                              {convo.unreadCount}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>

              {/* Chat Area */}
              <div className={`flex-1 flex flex-col ${!selectedConversation ? 'hidden md:flex' : ''}`}>
                {selectedConversation ? (
                  <>
                    {/* Chat Header */}
                    <div className="p-4 border-b border-border flex items-center gap-3">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="md:hidden"
                        onClick={() => setSelectedConversation(null)}
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </Button>
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={selectedConvo?.avatar_url || undefined} />
                        <AvatarFallback>
                          {selectedConvo?.name.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {selectedConvo?.name}
                        </h3>
                        <p className="text-sm text-muted-foreground">Service Provider</p>
                      </div>
                    </div>

                    {/* Messages */}
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        {messages.length === 0 ? (
                          <div className="text-center py-8">
                            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                            <p className="text-muted-foreground">
                              Start a conversation with {selectedConvo?.name}
                            </p>
                          </div>
                        ) : (
                          messages.map((message) => {
                            const isMe = message.sender_id === user?.id;
                            return (
                              <div
                                key={message.id}
                                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
                              >
                                <div
                                  className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                                    isMe
                                      ? "bg-primary text-primary-foreground rounded-br-md"
                                      : "bg-secondary text-foreground rounded-bl-md"
                                  }`}
                                >
                                  <p>{message.content}</p>
                                  <p
                                    className={`text-xs mt-1 ${
                                      isMe ? "text-primary-foreground/70" : "text-muted-foreground"
                                    }`}
                                  >
                                    {format(new Date(message.created_at), "h:mm a")}
                                  </p>
                                </div>
                              </div>
                            );
                          })
                        )}
                        <div ref={messagesEndRef} />
                      </div>
                    </ScrollArea>

                    {/* Message Input */}
                    <form
                      onSubmit={handleSendMessage}
                      className="p-4 border-t border-border flex gap-2"
                    >
                      <Input
                        placeholder="Type a message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button
                        type="submit"
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="w-4 h-4" />
                      </Button>
                    </form>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center">
                    <div className="text-center">
                      <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                      <h3 className="text-lg font-semibold text-foreground mb-2">
                        Select a conversation
                      </h3>
                      <p className="text-muted-foreground">
                        Choose a provider to start messaging
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default CustomerChat;
