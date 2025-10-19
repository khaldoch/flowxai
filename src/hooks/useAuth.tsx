
import { useState, useEffect, createContext, useContext, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  userRole: string | null;
  clientId: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signUp: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [clientId, setClientId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        // First, check for existing Supabase session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
        }
        
        if (session?.user && mounted) {
          console.log('Found Supabase session for:', session.user.email);
          setSession(session);
          setUser(session.user);
          await setUserRoleBasedOnEmail(session.user.email || '');
        } else {
          // No active session, check for stored auth
          const mockStored = localStorage.getItem('mock_auth');
          const supabaseStored = localStorage.getItem('supabase_auth');
          
          if (mockStored && mounted) {
            try {
              const { email, role } = JSON.parse(mockStored);
              console.log('Found mock auth for:', email);
              // Only use mock auth for hardcoded test users
              if (email === 'admin@flowaix.com' || email === 'client@flowaix.com') {
                const mockUser = {
                  id: role === 'admin' ? 'admin-user-id' : 'client-user-id',
                  email: email,
                  app_metadata: {},
                  user_metadata: {},
                  aud: 'authenticated',
                  created_at: new Date().toISOString(),
                  updated_at: new Date().toISOString(),
                  role
                } as User;
                
                const mockSession = {
                  access_token: 'mock-access-token',
                  refresh_token: 'mock-refresh-token',
                  expires_in: 3600,
                  token_type: 'bearer',
                  user: mockUser
                } as Session;
                
                console.log('Restoring mock session for:', email);
                setSession(mockSession);
                setUser(mockUser);
                await setUserRoleBasedOnEmail(email);
              } else {
                localStorage.removeItem('mock_auth');
              }
            } catch (error) {
              console.error('Error parsing mock auth:', error);
              localStorage.removeItem('mock_auth');
            }
          } else if (supabaseStored && mounted) {
            try {
              const { email } = JSON.parse(supabaseStored);
              console.log('Found stored Supabase auth for:', email);
              // Try to refresh the session
              const { data: { session: refreshedSession } } = await supabase.auth.refreshSession();
              if (refreshedSession?.user && refreshedSession.user.email === email && mounted) {
                console.log('Successfully refreshed session for:', email);
                setSession(refreshedSession);
                setUser(refreshedSession.user);
                await setUserRoleBasedOnEmail(email);
              } else {
                console.log('Failed to refresh session, clearing stored auth');
                localStorage.removeItem('supabase_auth');
              }
            } catch (error) {
              console.error('Error refreshing session:', error);
              localStorage.removeItem('supabase_auth');
            }
          }
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state change:', event, session?.user?.email);
        if (session?.user && mounted) {
          setSession(session);
          setUser(session.user);
          await setUserRoleBasedOnEmail(session.user.email || '');
        } else if (mounted) {
          setSession(null);
          setUser(null);
          setUserRole(null);
          setClientId(null);
        }
        if (mounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const setUserRoleBasedOnEmail = async (email: string) => {
    if (email === 'admin@flowaix.com') {
      setUserRole('admin');
      setClientId(null);
    } else {
      // For client users, find their client ID from the database
      setUserRole('client');
      
      try {
        const { data: clients, error } = await supabase
          .from('clients')
          .select('id')
          .eq('email', email)
          .single();
        
        if (error || !clients) {
          // Fallback to default client ID if user's client not found
          console.warn(`Client not found for email ${email}, using default client ID`);
          setClientId('550e8400-e29b-41d4-a716-446655440000');
        } else {
          setClientId(clients.id);
        }
      } catch (err) {
        console.error('Error fetching client ID:', err);
        setClientId('550e8400-e29b-41d4-a716-446655440000');
      }
    }
    setLoading(false);
  };

  const signIn = async (email: string, password: string) => {
    // First check if it's a hardcoded test user
    if (
      (email === 'admin@flowaix.com' && password === 'admin123') ||
      (email === 'client@flowaix.com' && password === 'client123')
    ) {
      const mockUser = {
        id: email === 'admin@flowaix.com' ? 'admin-user-id' : 'client-user-id',
        email: email,
        app_metadata: {},
        user_metadata: {},
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        role: email === 'admin@flowaix.com' ? 'admin' : 'client'
      } as User;

      const mockSession = {
        access_token: 'mock-access-token',
        refresh_token: 'mock-refresh-token',
        expires_in: 3600,
        token_type: 'bearer',
        user: mockUser
      } as Session;

      setSession(mockSession);
      setUser(mockUser);
      await setUserRoleBasedOnEmail(email);
      localStorage.setItem('mock_auth', JSON.stringify({ email, role: mockUser.role }));
      
      return { error: null };
    }

    // If not a hardcoded user, try Supabase auth
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      if (data.user && data.session) {
        setSession(data.session);
        setUser(data.user);
        await setUserRoleBasedOnEmail(email);
        
        // Store real auth session
        localStorage.setItem('supabase_auth', JSON.stringify({ 
          email, 
          role: email === 'admin@flowaix.com' ? 'admin' : 'client'
        }));
        
        return { error: null };
      }

      return { error: { message: 'Authentication failed' } };
    } catch (err) {
      return { error: { message: 'Invalid credentials' } };
    }
  };

  const signUp = async (email: string, password: string) => {
    return { error: { message: 'Sign up is disabled. Please contact administrator.' } };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setUserRole(null);
    setClientId(null);
    localStorage.removeItem('supabase_auth');
    localStorage.removeItem('mock_auth');
  };

  const value = {
    user,
    session,
    userRole,
    clientId,
    loading,
    signIn,
    signUp,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
