import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

type UserRole = "user" | "provider" | "admin";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  userRole: UserRole | null;
  isAdmin: boolean;
  signUp: (email: string, password: string, name: string, role?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null; role?: UserRole }>;
  signOut: () => Promise<void>;
  refreshRole: () => Promise<UserRole | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const fetchUserRole = async (userId: string) => {
    // Check if user has admin role in user_roles table
    const { data: adminRole } = await supabase.rpc("has_role", {
      _user_id: userId,
      _role: "admin"
    });

    if (adminRole) {
      setIsAdmin(true);
      setUserRole("admin");
      return "admin" as UserRole;
    }

    // Check if user is a provider (has a service_providers entry)
    const { data: providerProfile } = await supabase
      .from("service_providers")
      .select("id, application_status")
      .eq("user_id", userId)
      .maybeSingle();

    if (providerProfile) {
      setUserRole("provider");
      setIsAdmin(false);
      return "provider" as UserRole;
    }

    // Default to user role
    setUserRole("user");
    setIsAdmin(false);
    return "user" as UserRole;
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Defer the role fetch to avoid Supabase deadlock
          setTimeout(() => {
            fetchUserRole(session.user.id);
          }, 0);
        } else {
          setUserRole(null);
          setIsAdmin(false);
        }
        
        setLoading(false);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserRole(session.user.id);
      }
      
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, name: string, role: string = "user") => {
    const redirectUrl = `${window.location.origin}/`;
    
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: {
          name,
          role,
        },
      },
    });
    return { error: error as Error | null };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    
    if (error) {
      return { error: error as Error | null };
    }
    
    // Fetch user role after successful login
    let role: UserRole = "user";
    if (data.user) {
      role = await fetchUserRole(data.user.id);
    }
    
    return { error: null, role };
  };

  const signOut = async () => {
    setUserRole(null);
    setIsAdmin(false);
    await supabase.auth.signOut();
  };

  const refreshRole = async (): Promise<UserRole | null> => {
    if (user?.id) {
      return await fetchUserRole(user.id);
    }
    return null;
  };

  return (
    <AuthContext.Provider value={{ user, session, loading, userRole, isAdmin, signUp, signIn, signOut, refreshRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};