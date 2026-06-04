"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { NativeGps } from "@/lib/gps"; // Assumindo que seu wrapper está aqui

interface GpsContextType {
  location: any;
  startGps: () => void;
  stopGps: () => void;
  isGpsActive: boolean;
}

const GpsContext = createContext<GpsContextType | undefined>(undefined);

export const useGps = () => {
  const context = useContext(GpsContext);
  if (!context) {
    throw new Error("useGps must be used within a GpsProvider");
  }
  return context;
};

export const GpsProvider = ({ children }: { children: React.ReactNode }) => {
  const [location, setLocation] = useState(null);
  const [isGpsActive, setIsGpsActive] = useState(false);

  const handleLocationUpdate = useCallback((locationData: any) => {
    setLocation(locationData);
  }, []);

  useEffect(() => {
    const listener = NativeGps.addListener("locationUpdate", handleLocationUpdate);
    return () => {
      listener.remove();
    };
  }, [handleLocationUpdate]);

  const startGps = async () => {
    try {
      await NativeGps.startGps();
      setIsGpsActive(true);
      console.log("GPS service started via context");
    } catch (e) {
      console.error("Error starting GPS service via context", e);
    }
  };

  const stopGps = async () => {
    try {
      await NativeGps.stopGps();
      setIsGpsActive(false);
      console.log("GPS service stopped via context");
    } catch (e) {
      console.error("Error stopping GPS service via context", e);
    }
  };

  const value = {
    location,
    startGps,
    stopGps,
    isGpsActive,
  };

  return <GpsContext.Provider value={value}>{children}</GpsContext.Provider>;
};