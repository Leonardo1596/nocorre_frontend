"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";
import { useGps } from "./GpsContext";
import { NativeGps, LocationPoint } from "@/lib/gps";

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

// Define keys for localStorage to persist shift state
const SHIFT_DISTANCE_KEY = "shift_accumulated_distance";
const SHIFT_LAST_LOCATION_KEY = "shift_last_location";

interface ShiftContextType {
  accumulatedDistance: number;
  isShiftActive: boolean;
  startShift: () => void;
  stopShift: () => void;
  shiftHistory: LocationPoint[];
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

  const [accumulatedDistance, setAccumulatedDistance] = useState<number>(() => {
    if (typeof window === 'undefined') return 0;
    const savedDistance = window.localStorage.getItem(SHIFT_DISTANCE_KEY);
    return savedDistance ? parseFloat(savedDistance) : 0;
  });

  const [lastLocation, setLastLocation] = useState<LocationPoint | null>(() => {
    if (typeof window === 'undefined') return null;
    const savedLocation = window.localStorage.getItem(SHIFT_LAST_LOCATION_KEY);
    return savedLocation ? JSON.parse(savedLocation) : null;
  });

  const [isShiftActive, setIsShiftActive] = useState(false);
  const [shiftHistory, setShiftHistory] = useState<LocationPoint[]>([]);

  useEffect(() => {
    setIsShiftActive(isGpsActive);
  }, [isGpsActive]);

  useEffect(() => {
    const syncOfflineData = async () => {
      if (isGpsActive) {
        const { locations: pendingLocations } = await NativeGps.getPendingLocations();

        if (pendingLocations && pendingLocations.length > 0) {
          console.log(`Processing ${pendingLocations.length} pending locations.`);
          
          let totalOfflineDistance = 0;
          let previousPoint = lastLocation; 

          for (const currentPoint of pendingLocations) {
            if (previousPoint) {
              totalOfflineDistance += haversineDistance(previousPoint, currentPoint);
            }
            previousPoint = currentPoint;
          }

          if (totalOfflineDistance > 0) {
            setAccumulatedDistance(prev => prev + totalOfflineDistance);
          }
          
          const latestPoint = pendingLocations[pendingLocations.length - 1];
          setLastLocation(latestPoint);
        }
      }
    };

    syncOfflineData();
  }, [isGpsActive]);

  useEffect(() => {
    if (isGpsActive && location) {
      if (lastLocation) {
        const distance = haversineDistance(lastLocation, location);
        setAccumulatedDistance(prev => prev + distance);
      }
      setLastLocation(location);
      setShiftHistory((prev) => [...prev, location]);
    }
  }, [location, isGpsActive]);

  useEffect(() => {
    if (typeof window !== 'undefined' && isShiftActive) {
        window.localStorage.setItem(SHIFT_DISTANCE_KEY, accumulatedDistance.toString());
        if (lastLocation) {
            window.localStorage.setItem(SHIFT_LAST_LOCATION_KEY, JSON.stringify(lastLocation));
        }
    }
  }, [accumulatedDistance, lastLocation, isShiftActive]);

  const startShift = () => {
    window.localStorage.removeItem(SHIFT_DISTANCE_KEY);
    window.localStorage.removeItem(SHIFT_LAST_LOCATION_KEY);
    setAccumulatedDistance(0);
    setLastLocation(null);
    setShiftHistory([]);
    
    startGps();
  };

  const stopShift = () => {
    stopGps();
  };

  const value = {
    accumulatedDistance,
    isShiftActive,
    startShift,
    stopShift,
    shiftHistory,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};