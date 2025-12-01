
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface User {
  id: string;
  email: string;
  name: string;
  farmName?: string;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signUp: (name: string, farmName: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEYS = {
  USER: '@farm_user',
  USERS_DB: '@farm_users_db',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    try {
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        setUser(JSON.parse(userData));
      }
    } catch (error) {
      console.log('Error loading user:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('SignIn: Getting users database...');
      // Get users database
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('SignIn: Found users:', users.length);

      // Find user
      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        console.log('SignIn: No user found with email:', email);
        return { success: false, error: 'No account found with this email' };
      }

      if (foundUser.password !== password) {
        console.log('SignIn: Incorrect password');
        return { success: false, error: 'Incorrect password' };
      }

      // Create user object without password
      const userToStore: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        farmName: foundUser.farmName,
        createdAt: foundUser.createdAt,
      };

      // Save current user
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
      setUser(userToStore);
      console.log('SignIn: Success!');

      return { success: true };
    } catch (error) {
      console.log('Error signing in:', error);
      return { success: false, error: 'An error occurred during sign in' };
    }
  };

  const signUp = async (
    name: string,
    farmName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('SignUp: Starting with:', { name, farmName, email });
      
      // Validate inputs
      if (!email || !password || !name) {
        console.log('SignUp: Missing required fields');
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        console.log('SignUp: Password too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('SignUp: Invalid email format');
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Get users database
      console.log('SignUp: Getting users database...');
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('SignUp: Current users count:', users.length);

      // Check if user already exists
      const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        console.log('SignUp: User already exists');
        return { success: false, error: 'An account with this email already exists' };
      }

      // Create new user
      const newUser = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        password, // In production, this should be hashed
        name,
        farmName: farmName || '',
        createdAt: new Date().toISOString(),
      };

      console.log('SignUp: Creating new user:', { ...newUser, password: '***' });

      // Save to users database
      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      console.log('SignUp: Saved to users database');

      // Create user object without password
      const userToStore: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        farmName: newUser.farmName,
        createdAt: newUser.createdAt,
      };

      // Save current user
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
      setUser(userToStore);
      console.log('SignUp: Success! User logged in');

      return { success: true };
    } catch (error) {
      console.log('Error signing up:', error);
      return { success: false, error: 'An error occurred during sign up' };
    }
  };

  const signOut = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      console.log('SignOut: Success');
    } catch (error) {
      console.log('Error signing out:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, signIn, signUp, signOut }}>
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
