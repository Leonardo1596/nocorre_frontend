"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { NativeGps } from "@/lib/gps";

// Helper function to calculate distance between two lat/lon points
const haversineDistance = (
  coords1: { latitude: number; longitude: number },
  coords2: { latitude: number; longitude: number }
) => {
  const toRad = (x: number) => (x * Math.PI) / 180;

  const R = 6371; // Earth's radius in kilometers
  const dLat = toRad(coords2.latitude - coords1.latitude);
  const dLon = toRad(coords2.longitude - coords1.longitude);
  const lat1 = toRad(coords1.latitude);
  const lat2 = toRad(coords2.latitude);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;

  return d;
};

interface GpsContextType {
  location: any;
  startGps: () => void;
  stopGps: () => void;
  isGpsActive: boolean;
  accumulatedDistance: number;
  resetAccumulatedDistance: () => void;
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
  const [accumulatedDistance, setAccumulatedDistance] = useState(0);
  const lastLocationRef = useRef<any>(null);

  useEffect(() => {
    const checkGpsStatus = async () => {
      try {
        const { isRunning } = await NativeGps.isGpsRunning();
        setIsGpsActive(isRunning);
      } catch (e) {
        console.error("Error checking GPS status", e);
      }
    };

    checkGpsStatus();
  }, []);

  const handleLocationUpdate = useCallback((locationData: any) => {
    setLocation(locationData);
    if (lastLocationRef.current) {
      const distance = haversineDistance(
        {
          latitude: lastLocationRef.current.latitude,
          longitude: lastLocationRef.current.longitude,
        },
        {
          latitude: locationData.latitude,
          longitude: locationData.longitude,
        }
      );
      setAccumulatedDistance((prev) => prev + distance);
    }
    lastLocationRef.current = locationData;
  }, []);

  const resetAccumulatedDistance = () => {
    setAccumulatedDistance(0);
    lastLocationRef.current = null;
  };

  useEffect(() => {
    const listener = NativeGps.addListener("locationUpdate", handleLocationUpdate);
    return () => {
      listener.then(l => l.remove());
    };
  }, [handleLocationUpdate]);

  const startGps = async () => {
    try {
      await NativeGps.startGps();
      setIsGpsActive(true);
      console.log("GPS service started via context");
    } catch (e) {
      console.error("Error starting GPS service via context", e);
      setIsGpsActive(false);
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
    accumulatedDistance,
    resetAccumulatedDistance,
  };

  return <GpsContext.Provider value={value}>{children}</GpsContext.Provider>;
};
