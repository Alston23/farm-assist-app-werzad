
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
      console.log('=== AuthContext: Loading user from storage ===');
      const userData = await AsyncStorage.getItem(STORAGE_KEYS.USER);
      console.log('Raw user data from storage:', userData);
      
      if (userData) {
        const parsedUser = JSON.parse(userData);
        console.log('Parsed user:', parsedUser);
        setUser(parsedUser);
      } else {
        console.log('No user found in storage');
        setUser(null);
      }
    } catch (error) {
      console.error('Error loading user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
      console.log('=== AuthContext: Finished loading user ===');
    }
  };

  const signIn = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      console.log('=== SIGN IN STARTED ===');
      console.log('Email:', email);
      
      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      console.log('Users DB raw data:', usersData);
      
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('Total users in DB:', users.length);
      console.log('All users:', users.map((u: any) => ({ email: u.email, name: u.name })));

      const foundUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());

      if (!foundUser) {
        console.log('USER NOT FOUND');
        return { success: false, error: 'No account found with this email. Please sign up first.' };
      }

      console.log('User found:', foundUser.email);
      console.log('Checking password...');

      if (foundUser.password !== password) {
        console.log('PASSWORD INCORRECT');
        return { success: false, error: 'Incorrect password. Please try again.' };
      }

      console.log('PASSWORD CORRECT');

      const userToStore: User = {
        id: foundUser.id,
        email: foundUser.email,
        name: foundUser.name,
        farmName: foundUser.farmName,
        createdAt: foundUser.createdAt,
      };

      console.log('Storing user:', userToStore);
      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
      
      console.log('Setting user state...');
      setUser(userToStore);
      
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('=== SIGN IN SUCCESS ===');
      return { success: true };
    } catch (error) {
      console.error('=== SIGN IN ERROR ===', error);
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
      console.log('=== SIGN UP STARTED ===');
      console.log('Name:', name);
      console.log('Farm Name:', farmName);
      console.log('Email:', email);
      
      if (!email || !password || !name) {
        console.log('Missing required fields');
        return { success: false, error: 'Please fill in all required fields' };
      }

      if (password.length < 6) {
        console.log('Password too short');
        return { success: false, error: 'Password must be at least 6 characters' };
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        console.log('Invalid email format');
        return { success: false, error: 'Please enter a valid email address' };
      }

      const usersData = await AsyncStorage.getItem(STORAGE_KEYS.USERS_DB);
      const users = usersData ? JSON.parse(usersData) : [];
      console.log('Current users count:', users.length);

      const existingUser = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
      if (existingUser) {
        console.log('User already exists');
        return { success: false, error: 'An account with this email already exists. Please sign in instead.' };
      }

      const newUser = {
        id: Date.now().toString(),
        email: email.toLowerCase(),
        password,
        name,
        farmName: farmName || '',
        createdAt: new Date().toISOString(),
      };

      console.log('Creating new user:', { ...newUser, password: '***' });

      users.push(newUser);
      await AsyncStorage.setItem(STORAGE_KEYS.USERS_DB, JSON.stringify(users));
      console.log('Saved to users database, total users:', users.length);

      const userToStore: User = {
        id: newUser.id,
        email: newUser.email,
        name: newUser.name,
        farmName: newUser.farmName,
        createdAt: newUser.createdAt,
      };

      await AsyncStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userToStore));
      setUser(userToStore);
      
      // Wait a bit to ensure state is updated
      await new Promise(resolve => setTimeout(resolve, 100));
      
      console.log('=== SIGN UP SUCCESS ===');
      return { success: true };
    } catch (error) {
      console.error('=== SIGN UP ERROR ===', error);
      return { success: false, error: 'An error occurred during sign up. Please try again.' };
    }
  };

  const signOut = async () => {
    try {
      console.log('=== SIGN OUT STARTED ===');
      await AsyncStorage.removeItem(STORAGE_KEYS.USER);
      setUser(null);
      console.log('=== SIGN OUT SUCCESS ===');
    } catch (error) {
      console.error('Sign out error:', error);
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
