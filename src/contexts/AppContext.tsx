"use client"

import React, { createContext, useContext, useState, useEffect } from 'react';

interface VehicleConfig {
  fuelPrice: number;
  kmPerLiter: number;
  oilCostPerKm: number;
  tiresCostPerKm: number;
  maintCostPerKm: number;
}

interface ShiftState {
  id: string | null;
  startTime: string | null;
  isActive: boolean;
}

interface SessionState {
  id: string | null;
  startTime: string | null;
  isActive: boolean;
}

interface AppContextType {
  vehicle: VehicleConfig;
  updateVehicle: (config: VehicleConfig) => void;
  currentShift: ShiftState;
  setCurrentShift: (shift: ShiftState) => void;
  currentSession: SessionState;
  setCurrentSession: (session: SessionState) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [vehicle, setVehicle] = useState<VehicleConfig>({
    fuelPrice: 5.50,
    kmPerLiter: 12,
    oilCostPerKm: 0.05,
    tiresCostPerKm: 0.03,
    maintCostPerKm: 0.04,
  });

  const [currentShift, setCurrentShift] = useState<ShiftState>({
    id: null,
    startTime: null,
    isActive: false,
  });

  const [currentSession, setCurrentSession] = useState<SessionState>({
    id: null,
    startTime: null,
    isActive: false,
  });

  useEffect(() => {
    const savedVehicle = localStorage.getItem('nocorre_vehicle');
    if (savedVehicle) setVehicle(JSON.parse(savedVehicle));
    
    const savedShift = localStorage.getItem('nocorre_shift');
    if (savedShift) setCurrentShift(JSON.parse(savedShift));

    const savedSession = localStorage.getItem('nocorre_session');
    if (savedSession) setCurrentSession(JSON.parse(savedSession));
  }, []);

  const updateVehicle = (config: VehicleConfig) => {
    setVehicle(config);
    localStorage.setItem('nocorre_vehicle', JSON.stringify(config));
  };

  useEffect(() => {
    localStorage.setItem('nocorre_shift', JSON.stringify(currentShift));
  }, [currentShift]);

  useEffect(() => {
    localStorage.setItem('nocorre_session', JSON.stringify(currentSession));
  }, [currentSession]);

  return (
    <AppContext.Provider value={{ 
      vehicle, 
      updateVehicle, 
      currentShift, 
      setCurrentShift, 
      currentSession, 
      setCurrentSession 
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}