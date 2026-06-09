"use client";

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
} from "react";
import { useGps } from "./GpsContext";
import { NativeGps } from "@/lib/gps";

interface ShiftContextType {
  isShiftActive: boolean;
  startShift: () => void;
  stopShift: () => void;
  shiftDistance: number;
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
  const [isShiftActive, setIsShiftActive] = useState(false);
  const { startGps, stopGps, accumulatedDistance, resetAccumulatedDistance, isGpsActive } = useGps();

  const startShift = useCallback(() => {
    startGps();
    setIsShiftActive(true);
  }, [startGps]);

  const stopShift = useCallback(async () => {
    stopGps();
    setIsShiftActive(false);
    resetAccumulatedDistance();
    try {
      await NativeGps.clearGpsLog();
    } catch (e) {
      console.error("Error clearing GPS log", e);
    }
  }, [stopGps, resetAccumulatedDistance]);

  useEffect(() => {
    if (isGpsActive) {
      setIsShiftActive(true);
    }
  }, [isGpsActive]);

  const value = {
    isShiftActive,
    startShift,
    stopShift,
    shiftDistance: accumulatedDistance,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};
