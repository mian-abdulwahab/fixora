import { useState, useEffect, useRef } from "react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, MessageSquare, Search, ArrowLeft } from "lucide-react";
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
  role: string;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

const AdminMessages = () => {
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch all conversations (anyone who has messaged the admin)
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery({
    queryKey: ["admin-conversations", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      // Get all messages involving admin
      const { data: allMessages, error } = await supabase
        .from("messages")
        .select("sender_id, receiver_id, content, created_at, read")
        .or(`sender_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Get unique user IDs
      const userIds = new Set<string>();
      allMessages?.forEach(msg => {
        if (msg.sender_id !== user.id) userIds.add(msg.sender_id);
        if (msg.receiver_id !== user.id) userIds.add(msg.receiver_id);
      });

      if (userIds.size === 0) return [];

      // Get profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, name, avatar_url")
        .in("id", Array.from(userIds));

      // Check which are providers
      const { data: providers } = await supabase
        .from("service_providers")
        .select("user_id")
        .in("user_id", Array.from(userIds));

      const providerUserIds = new Set(providers?.map(p => p.user_id) || []);

      const conversationList: Conversation[] = (profiles || []).map(profile => {
        const msgs = allMessages?.filter(m =>
          (m.sender_id === profile.id && m.receiver_id === user.id) ||
          (m.sender_id === user.id && m.receiver_id === profile.id)
        ) || [];

        const lastMsg = msgs[0];
        const unread = msgs.filter(m => m.sender_id === profile.id && !m.read).length;

        return {
          id: profile.id,
          name: profile.name || "User",
          avatar_url: profile.avatar_url,
          role: providerUserIds.has(profile.id) ? "Provider" : "Customer",
          lastMessage: lastMsg?.content,
          lastMessageTime: lastMsg?.created_at,
          unreadCount: unread,
        };
      });

      return conversationList
        .filter(c => c.lastMessage)
        .sort((a, b) => {
          if (!a.lastMessageTime) return 1;
          if (!b.lastMessageTime) return -1;
          return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
        });
    },
    enabled: !!user?.id,
  });

  // Fetch messages for selected conversation
  const { data: messages = [] } = useQuery({
    queryKey: ["admin-chat-messages", selectedConversation, user?.id],
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
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
    };
    markAsRead();
  }, [selectedConversation, user?.id, queryClient]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Realtime subscription
  useEffect(() => {
    if (!user?.id) return;
    const channel = supabase
      .channel("admin-messages-realtime")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, (payload) => {
        const newMsg = payload.new as Message;
        if (newMsg.receiver_id === user.id || newMsg.sender_id === user.id) {
          queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
          queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user?.id, queryClient]);

  const sendMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ["admin-chat-messages"] });
      queryClient.invalidateQueries({ queryKey: ["admin-conversations"] });
    },
    onError: (error: Error) => {
      toast({ title: "Failed to send", description: error.message, variant: "destructive" });
    },
  });

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    sendMutation.mutate();
  };

  const selectedConvo = conversations.find(c => c.id === selectedConversation);
  const filtered = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground mb-2">Messages</h1>
        <p className="text-muted-foreground">Chat with customers and providers.</p>
      </div>

      <div className="bg-card rounded-2xl shadow-card overflow-hidden h-[calc(100vh-14rem)]">
        <div className="flex h-full">
          {/* Conversations List */}
          <div className={`w-full md:w-80 border-r border-border flex flex-col ${selectedConversation ? 'hidden md:flex' : ''}`}>
            <div className="p-4 border-b border-border">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search..."
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
              ) : filtered.length === 0 ? (
                <div className="p-8 text-center">
                  <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                  <p className="text-muted-foreground">No conversations yet</p>
                </div>
              ) : (
                <div className="p-2">
                  {filtered.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConversation(convo.id)}
                      className={`w-full p-3 rounded-lg flex items-center gap-3 transition-colors ${
                        selectedConversation === convo.id ? "bg-primary/10" : "hover:bg-secondary"
                      }`}
                    >
                      <Avatar className="w-12 h-12">
                        <AvatarImage src={convo.avatar_url || undefined} />
                        <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-foreground truncate">{convo.name}</span>
                          {convo.lastMessageTime && (
                            <span className="text-xs text-muted-foreground">
                              {format(new Date(convo.lastMessageTime), "MMM d")}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{convo.role}</span>
                          <p className="text-sm text-muted-foreground truncate flex-1">{convo.lastMessage}</p>
                        </div>
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
                <div className="p-4 border-b border-border flex items-center gap-3">
                  <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedConversation(null)}>
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={selectedConvo?.avatar_url || undefined} />
                    <AvatarFallback>{selectedConvo?.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <h3 className="font-semibold text-foreground">{selectedConvo?.name}</h3>
                    <p className="text-sm text-muted-foreground">{selectedConvo?.role}</p>
                  </div>
                </div>

                <ScrollArea className="flex-1 p-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8">
                        <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">No messages yet</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.sender_id === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                            <div className={`max-w-[70%] px-4 py-2 rounded-2xl ${
                              isMe ? "bg-primary text-primary-foreground rounded-br-md" : "bg-secondary text-foreground rounded-bl-md"
                            }`}>
                              <p>{msg.content}</p>
                              <p className={`text-xs mt-1 ${isMe ? "text-primary-foreground/70" : "text-muted-foreground"}`}>
                                {format(new Date(msg.created_at), "h:mm a")}
                              </p>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                <form onSubmit={handleSend} className="p-4 border-t border-border flex gap-2">
                  <Input
                    placeholder="Type a message..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="flex-1"
                  />
                  <Button type="submit" disabled={!newMessage.trim() || sendMutation.isPending}>
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">Select a conversation</h3>
                  <p className="text-muted-foreground">Choose a user to start messaging</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminMessages;
