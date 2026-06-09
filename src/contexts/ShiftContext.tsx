"use client";
import React, { createContext, useContext, useState, useEffect } from "react";
import { useGps } from "./GpsContext"; // Assuming GpsContext is in the same directory

// Define the shape of the context data
interface ShiftContextType {
  isShiftActive: boolean;
  startShift: () => void;
  stopShift: () => void;
  accumulatedDistance: number;
}

// Create the context with a default value
const ShiftContext = createContext<ShiftContextType | undefined>(undefined);

// Custom hook to use the shift context
export const useShift = () => {
  const context = useContext(ShiftContext);
  if (context === undefined) {
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
    // No need to reset distance here, it can be done before the next shift starts.
  };

  // The value provided by the context
  const value = {
    isShiftActive,
    startShift,
    stopShift,
    accumulatedDistance,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
