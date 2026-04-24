import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

export type UserRole = 'seller' | 'buyer';

export interface User {
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string, role: UserRole) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'solarix_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  const login = async (email: string, _password: string): Promise<boolean> => {
    // Mock login — accepts any credentials
    // In a real app this would call your backend API
    await new Promise(r => setTimeout(r, 600)); // simulate network delay

    // Try to retrieve previously-stored signup data for this email
    const storedUsers = JSON.parse(localStorage.getItem('solarix_users') || '{}');
    const existing = storedUsers[email];

    if (existing) {
      setUser({ name: existing.name, email, role: existing.role });
    } else {
      // Default to buyer if no signup record exists
      setUser({ name: email.split('@')[0], email, role: 'buyer' });
    }
    return true;
  };

  const signup = async (name: string, email: string, _password: string, role: UserRole): Promise<boolean> => {
    await new Promise(r => setTimeout(r, 600));

    // Persist user data for future logins
    const storedUsers = JSON.parse(localStorage.getItem('solarix_users') || '{}');
    storedUsers[email] = { name, role };
    localStorage.setItem('solarix_users', JSON.stringify(storedUsers));

    setUser({ name, email, role });
    return true;
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
