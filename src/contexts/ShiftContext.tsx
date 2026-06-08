"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState
} from "react";
import { useGps } from "./GpsContext";
import { LocationPoint } from "@/lib/gps";


interface ShiftContextType {
  isShiftActive: boolean;
  startShift: () => void;
  stopShift: () => void;
  // shiftHistory is now managed by GpsContext if needed, 
  // or could be built by consuming location updates.
  // For now, we get the core data from GpsContext.
  accumulatedDistance: number;
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
  // All location and distance logic is now handled by GpsContext.
  const {
    isGpsActive,
    startGps,
    stopGps,
    accumulatedDistance,
    resetAccumulatedDistance,
  } = useGps();

  // isShiftActive is now just a reflection of isGpsActive.
  const isShiftActive = isGpsActive;

  const startShift = () => {
    // Reset the distance in the GPS context before starting.
    resetAccumulatedDistance();
    startGps();
  };

  const stopShift = () => {
    stopGps();
    // The distance is preserved in GpsContext until a new shift starts.
  };

  const value = {
    isShiftActive,
    startShift,
    stopShift,
    accumulatedDistance, // Directly from GpsContext
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
