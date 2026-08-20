/**
 * =========================================================================
 * AuthContext.tsx - Global Authentication State Context
 * =========================================================================
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { IAuthUser, ISessionData } from '../types.ts';
import { AuthService } from '../services/authService.ts';
import { ApiClient } from '../services/apiClient.ts';

interface AuthContextType {
  user: IAuthUser | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  isLoading: boolean;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<IAuthUser | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const isSuperAdmin = Boolean(
    user?.role === 'admin' &&
    (user?.adminRole === 'superadmin' ||
     user?.isSuperAdmin === true ||
     user?.USERNAME?.toLowerCase() === 'innedzaky')
  );

  useEffect(() => {
    // Inisialisasi sesi dari storage
    const initialUser = AuthService.init();
    setUser(initialUser);
    setIsLoading(false);
  }, []);

  const login = async (username: string, password: string, rememberMe = true) => {
    setIsLoading(true);
    try {
      const res = await AuthService.login(username, password, rememberMe);
      if (res.success && res.data) {
        setUser(res.data.user);
        return { success: true, message: res.message || 'Login berhasil' };
      }
      return { success: false, message: res.message || res.error || 'Login gagal' };
    } catch (e: any) {
      return { success: false, message: e.message || 'Terjadi kesalahan sistem' };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    await AuthService.logout();
    setUser(null);
    setIsLoading(false);
  };

  const checkSession = async () => {
    const token = AuthService.getToken();
    if (!token) {
      setUser(null);
      return;
    }

    try {
      const res = await ApiClient.checkSession(token);
      if (res.success && res.data?.user) {
        setUser(res.data.user);
      } else {
        await logout();
      }
    } catch (e) {
      console.warn('Check session failed:', e);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isAdmin: user?.role === 'admin',
        isSuperAdmin,
        isLoading,
        login,
        logout,
        checkSession
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
