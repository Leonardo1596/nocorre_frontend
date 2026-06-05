"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useGps } from "./GpsContext";

interface ShiftContextType {
  accumulatedDistance: number;
  isShiftActive: boolean;
  startShift: () => void;
  stopShift: () => void;
  shiftHistory: any[];
}

const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

export const useShift = () => {
  const context = useContext(ShiftContext);
  if (!context) {
    throw new Error("useShift must be used within a ShiftProvider");
  }
  return context;
};

export const ShiftProvider = ({ children }: { children: React.ReactNode }) => {
  const { location, startGps, stopGps, isGpsActive } = useGps();
  const [isShiftActive, setIsShiftActive] = useState(false);
  const [accumulatedDistance, setAccumulatedDistance] = useState(0);
  const [shiftHistory, setShiftHistory] = useState<any[]>([]);
  const [lastLocation, setLastLocation] = useState<any>(null);

  const haversineDistance = (
    coords1: { latitude: number; longitude: number },
    coords2: { latitude: number; longitude: number }
  ) => {
    const toRad = (x: number) => (x * Math.PI) / 180;

    const lat1 = coords1.latitude;
    const lon1 = coords1.longitude;
    const lat2 = coords2.latitude;
    const lon2 = coords2.longitude;

    const R = 6371; // Earth radius in kilometers
    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(toRad(lat1)) *
        Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return d;
  };

  useEffect(() => {
    if (isGpsActive && location && location.coords) {
      if (lastLocation && lastLocation.coords) {
        const distance = haversineDistance(
          {
            latitude: lastLocation.coords.latitude,
            longitude: lastLocation.coords.longitude,
          },
          {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          }
        );
        setAccumulatedDistance((prev) => prev + distance);
      }
      setLastLocation(location);
      setShiftHistory((prev) => [...prev, location]);
    }
  }, [location, isGpsActive, lastLocation]);

  const startShift = () => {
    startGps();
    setIsShiftActive(true);
    setAccumulatedDistance(0);
    setShiftHistory([]);
    setLastLocation(null);
  };

  const stopShift = () => {
    stopGps();
    setIsShiftActive(false);
  };

  const value = {
    accumulatedDistance,
    isShiftActive,
    startShift,
    stopShift,
    shiftHistory,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};
