
"use client"

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import { NativeGps } from '@/lib/gps';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (token: string, userData: User) => void;
  logout: () => void;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const syncVehicleCost = useCallback(async (tokenToUse: string) => {
    try {
      const res = await api.get('/maintenance-settings', {
        headers: { Authorization: `Bearer ${tokenToUse}` }
      });
      if (res.data) {
        const data = res.data;
        const fuelCost = data.fuel?.kmPerLiter > 0 ? (Number(data.fuel?.fuelPrice || 0) / Number(data.fuel?.kmPerLiter)) : 0;
        const oilCost = data.maintenance?.oil?.lifespanKm > 0 ? (Number(data.maintenance?.oil?.price || 0) / Number(data.maintenance?.oil?.lifespanKm)) : 0;
        const frontTireCost = data.maintenance?.frontTire?.lifespanKm > 0 ? (Number(data.maintenance?.frontTire?.price || 0) / Number(data.maintenance?.frontTire?.lifespanKm)) : 0;
        const rearTireCost = data.maintenance?.rearTire?.lifespanKm > 0 ? (Number(data.maintenance?.rearTire?.price || 0) / Number(data.maintenance?.rearTire?.lifespanKm)) : 0;
        const chainCost = data.maintenance?.chain?.lifespanKm > 0 ? (Number(data.maintenance?.chain?.price || 0) / Number(data.maintenance?.chain?.lifespanKm)) : 0;
        const costPerKm = fuelCost + oilCost + frontTireCost + rearTireCost + chainCost;
        
        await NativeGps.setCostPerKm({ costPerKm, token: tokenToUse });
      }
    } catch {
      NativeGps.setCostPerKm({ costPerKm: 0, token: tokenToUse }).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const savedToken = localStorage.getItem('nocorre_token');
    const savedUser = localStorage.getItem('nocorre_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      syncVehicleCost(savedToken);
    }
    setLoading(false);
  }, [syncVehicleCost]);

  const login = (newToken: string, userData: User) => {
    localStorage.setItem('nocorre_token', newToken);
    localStorage.setItem('nocorre_user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    syncVehicleCost(newToken);
    router.push('/');
  };

  const logout = () => {
    localStorage.removeItem('nocorre_token');
    localStorage.removeItem('nocorre_user');
    setToken(null);
    setUser(null);
    // Redirection handled by layout effect to avoid hook mismatches
  };

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!token, login, logout, loading }}>
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
