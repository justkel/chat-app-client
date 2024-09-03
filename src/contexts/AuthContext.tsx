import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';
import { Spin } from 'antd';

interface AuthContextType {
  user: { token: string } | null;
  login: (token: string) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

interface AuthProviderProps {
  children: ReactNode;
}

interface JwtPayload {
  exp: number;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<{ token: string; } | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setUser(null);
  }, []);

  const setLogoutTimer = useCallback((milliseconds: number) => {
    setTimeout(() => {
      logout();
    }, milliseconds);
  }, [logout]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    if (token) {
      try {
        const decoded: JwtPayload = jwtDecode(token);
        const expiresAt = decoded.exp * 1000;
        
        if (new Date().getTime() < expiresAt) {
          setUser({ token });
          setLogoutTimer(expiresAt - new Date().getTime());
        } else {
          logout();
        }
      } catch (error) {
        console.error("Failed to decode token", error);
        logout();
      }
    }
    setLoading(false);
  }, [logout, setLogoutTimer]);

  const login = (token: string) => {
    try {
      const decoded: JwtPayload = jwtDecode(token);
      const expiresAt = decoded.exp * 1000;

      localStorage.setItem('token', token);
      setUser({ token });
      setLogoutTimer(expiresAt - new Date().getTime());
    } catch (error) {
      console.error("Failed to decode token", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {loading ? <Spin size="small" style={{ display: 'block', margin: '0 auto', marginTop: '50vh' }} /> : children}
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
