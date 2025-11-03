import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { User } from '@supabase/supabase-js';

// Demo users for the CRM system
const demoUsers = {
  'william@emptyad.com': { id: '11111111-1111-1111-1111-111111111111', email: 'william@emptyad.com', name: 'William Walsh', role: 'CEO' },
  'beck@emptyad.com': { id: '22222222-2222-2222-2222-222222222222', email: 'beck@emptyad.com', name: 'Beck Majdell', role: 'CGO' },
  'roman@emptyad.com': { id: '33333333-3333-3333-3333-333333333333', email: 'roman@emptyad.com', name: 'M.A. Roman', role: 'CTO' }
};

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Clear any existing Supabase session
    supabase.auth.signOut();
    
    // Check for stored demo user
    const storedDemoUser = localStorage.getItem('demoUser');
    if (storedDemoUser) {
      try {
        const demoUser = JSON.parse(storedDemoUser);
        setUser(demoUser);
      } catch (error) {
        console.error('Error parsing stored demo user:', error);
        localStorage.removeItem('demoUser');
      }
    }
    
    setLoading(false);
  }, []);

  const signIn = async (email: string, password: string) => {
    // Check if it's a demo user
    const demoUser = demoUsers[email as keyof typeof demoUsers];
    if (demoUser && password === 'demo') {
      const mockUser = {
        id: demoUser.id,
        email: demoUser.email,
        user_metadata: { name: demoUser.name, role: demoUser.role }
      };
      
      // Update user's online status in database
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_online: true, 
            last_seen: new Date().toISOString() 
          })
          .eq('id', demoUser.id);
        
        if (updateError) {
          console.error('Error updating user online status:', updateError);
        }
      } catch (error) {
        console.error('Error updating online status:', error);
      }
      
      setUser(mockUser as any);
      localStorage.setItem('demoUser', JSON.stringify(mockUser));
      return { error: null };
    }

    // For non-demo users, return error
    return { error: 'Invalid credentials. Please use demo accounts.' };
  };

  const signOut = async () => {
    // Update user's online status to false before signing out
    if (user?.id) {
      try {
        const { error: updateError } = await supabase
          .from('users')
          .update({ 
            is_online: false, 
            last_seen: new Date().toISOString() 
          })
          .eq('id', user.id);
        
        if (updateError) {
          console.error('Error updating user offline status:', updateError);
        }
      } catch (error) {
        console.error('Error updating offline status:', error);
      }
    }
    
    // Clear demo user from localStorage
    localStorage.removeItem('demoUser');
    setUser(null);
    
    // Also sign out from Supabase if there's a session
    await supabase.auth.signOut();
  };

  const updateUser = (userData: Partial<User>) => {
    if (!user) return;
    
    const updatedUser = {
      ...user,
      ...userData,
      user_metadata: {
        ...user.user_metadata,
        ...userData.user_metadata
      }
    };
    
    setUser(updatedUser);
    localStorage.setItem('demoUser', JSON.stringify(updatedUser));
  };

  const value = {
    user,
    loading,
    signIn,
    signOut,
    updateUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}