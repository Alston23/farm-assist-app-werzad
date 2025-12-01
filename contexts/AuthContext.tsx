
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
      console.log('AuthContext: Loading user from storage...');
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('AuthContext: User loaded:', parsedUser.email);
        setUser(parsedUser);
      } else {
        console.log('AuthContext: No user found in storage');
      }
    } catch (error) {
      console.error('AuthContext: Error loading user:', error);
    } finally {
      console.log('AuthContext: Setting isLoading to false');
      setIsLoading(false);
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('AuthContext: SignIn starting for email:', email);
      
      // Get users database
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      console.log('AuthContext: Raw users data:', usersData);
      
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('AuthContext: Found', users.length, 'users in database');

      // Find user
      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        console.log('AuthContext: No user found with email:', email);
        return { success: false, error: 'No account found with this email. Please sign up first.' };
      }

      console.log('AuthContext: User found, checking password...');
      if (foundUser.password !== password) {
        console.log('AuthContext: Incorrect password');
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      // Create user object without password
      const userToStore: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        farmName: foundUser.farmName,
        createdAt: foundUser.createdAt,
      };

      console.log('AuthContext: Saving user to storage...');
      // Save current user
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
      
      console.log('AuthContext: Setting user state...');
      setUser(userToStore);
      
      console.log('AuthContext: SignIn SUCCESS! User logged in:', userToStore.email);
      return { success: true };
    } catch (error) {
      console.error('AuthContext: Error signing in:', error);
      return { success: false, error: 'An error occurred during sign in. Please try again.' };
    }
  };

  const signUp = async (
    name: string,
    farmName: string,
    email: string,
    password: string
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('AuthContext: SignUp starting with:', { name, farmName, email });
      
      // Validate inputs
      if (!email || !password || !name) {
        console.log('AuthContext: Missing required fields');
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        console.log('AuthContext: Password too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('AuthContext: Invalid email format');
        return { success: false, error: 'Please enter a valid email address' };
      }

      // Get users database
      console.log('AuthContext: Getting users database...');
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('AuthContext: Current users count:', users.length);

      // Check if user already exists
      const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        console.log('AuthContext: User already exists');
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
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

      console.log('AuthContext: Creating new user:', { ...newUser, password: '***' });

      // Save to users database
      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      console.log('AuthContext: Saved to users database, total users:', users.length);

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
      console.log('AuthContext: SignUp SUCCESS! User logged in:', userToStore.email);

      return { success: true };
    } catch (error) {
      console.error('AuthContext: Error signing up:', error);
      return { success: false, error: 'An error occurred during sign up. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      console.log('AuthContext: SignOut starting...');
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      console.log('AuthContext: SignOut SUCCESS');
    } catch (error) {
      console.error('AuthContext: Error signing out:', error);
    }
  };

  console.log('AuthContext: Rendering with user:', user ? user.email : 'null', 'isLoading:', isLoading);

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
