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

// Helper function to calculate distance between two lat/lon points using the Haversine formula
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    0.5 -
    Math.cos(dLat) / 2 +
    (Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      (1 - Math.cos(dLon))) / 2;

  return R * 2 * Math.asin(Math.sqrt(a)); // Distance in km
}

interface Location {
    latitude: number;
    longitude: number;
}

interface GpsContextType {
  location: Location | null;
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
  const [location, setLocation] = useState<Location | null>(null);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [accumulatedDistance, setAccumulatedDistance] = useState(0);
  const lastLocationRef = useRef<Location | null>(null);

  useEffect(() => {
    const restore = async () => {
      try {
        const { accumulatedDistance: restoredDistance } = await NativeGps.restoreState();
        if (restoredDistance > 0) {
          setAccumulatedDistance(restoredDistance);
        }
        const { isRunning } = await NativeGps.isGpsRunning();
        setIsGpsActive(isRunning);
      } catch (e) {
        console.error("Error restoring GPS state", e);
      }
    };

    restore();
  }, []);

  const handleLocationUpdate = useCallback((locationData: Location) => {
    if (locationData) {
      setLocation(locationData);
      if (lastLocationRef.current) {
        const newDistance = getDistance(
          lastLocationRef.current.latitude,
          lastLocationRef.current.longitude,
          locationData.latitude,
          locationData.longitude
        );
        setAccumulatedDistance((prevDistance) => prevDistance + newDistance);
      }
      lastLocationRef.current = locationData;
    }
  }, []);

  const resetAccumulatedDistance = useCallback(() => {
    setAccumulatedDistance(0);
    lastLocationRef.current = null;
  }, []);

  useEffect(() => {
    const setupListener = async () => {
        const listener = await NativeGps.addListener("locationUpdate", handleLocationUpdate);
        return () => {
            listener.remove();
        };
    }
    const removeListener = setupListener();

    return () => {
      removeListener.then(r => r());
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
