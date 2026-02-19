import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, type User } from 'firebase/auth';
import { getAuth } from 'firebase/auth';
// We need to import the app we initialized in firebase.ts
import { db } from '../firebase'; 

// Initialize Auth
const auth = getAuth(db.app);

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
}


const AuthContext = createContext<AuthContextType>({ user: null, loading: true, logout: async () => {} });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const logout = () => signOut(auth);

  const value = { user, loading, logout };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};