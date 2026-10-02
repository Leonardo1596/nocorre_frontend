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
  isPaused: boolean;
  startShift: () => void;
  stopShift: () => void;
  pauseShift: () => void;
  resumeShift: () => void;
  shiftDistance: number;
  productiveDistance: number;
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
  const [isPaused, setIsPaused] = useState(false);
  const [shiftDistance, setShiftDistance] = useState(0);
  const [productiveDistance, setProductiveDistance] = useState(0);
  const [totalPausedKm, setTotalPausedKm] = useState(0);
  const [kmAtPauseStart, setKmAtPauseStart] = useState(0);

  const {
    startGps,
    stopGps,
    accumulatedDistance,
    isGpsActive,
    resetAccumulatedDistance,
  } = useGps();

  useEffect(() => {
    const restoreState = async () => {
      try {
        const storedState = await NativeGps.getShiftState();
        if (storedState && storedState.isShiftActive) {
          setIsShiftActive(true);
          setIsPaused(storedState.isPaused || false);
          setShiftDistance(storedState.shiftDistance || 0);
          setProductiveDistance(storedState.productiveDistance || 0);
          setTotalPausedKm(storedState.totalPausedKm || 0);
          setKmAtPauseStart(storedState.kmAtPauseStart || 0);
        } else {
          setIsShiftActive(false);
          await stopGps();
        }
      } catch (e) {
        console.error("Error restoring shift state", e);
        setIsShiftActive(false);
        await stopGps();
      }
    };
    restoreState();
  }, [stopGps]);

  useEffect(() => {
    const saveState = async () => {
      try {
        await NativeGps.setShiftState({
          isShiftActive,
          isPaused,
          shiftDistance,
          productiveDistance,
          totalPausedKm,
          kmAtPauseStart,
        });
      } catch (e) {
        console.error("Error saving shift state", e);
      }
    };
    saveState();
  }, [
    isShiftActive,
    isPaused,
    shiftDistance,
    productiveDistance,
    totalPausedKm,
    kmAtPauseStart,
  ]);

  useEffect(() => {
    setShiftDistance(accumulatedDistance);
  }, [accumulatedDistance]);

  useEffect(() => {
    if (!isPaused) {
      setProductiveDistance(shiftDistance - totalPausedKm);
    }
  }, [shiftDistance, totalPausedKm, isPaused]);

  const startShift = useCallback(async () => {
    try {
      await NativeGps.clearGpsLog();
      await NativeGps.clearShiftState();
    } catch (e) {
      console.error("Error clearing GPS log", e);
    }
    await resetAccumulatedDistance();
    await startGps();
    setIsShiftActive(true);
    setIsPaused(false);
    setTotalPausedKm(0);
    setKmAtPauseStart(0);
    setProductiveDistance(0);
  }, [startGps, resetAccumulatedDistance]);

  const stopShift = useCallback(async () => {
    setIsShiftActive(false);
    setIsPaused(false);
    setShiftDistance(0);
    setProductiveDistance(0);
    setTotalPausedKm(0);
    setKmAtPauseStart(0);
    try {
      await NativeGps.clearGpsLog();
      await NativeGps.clearShiftState();
    } catch (e) {
      console.error("Error clearing GPS log", e);
    }
    await stopGps();
    await resetAccumulatedDistance();
  }, [stopGps, resetAccumulatedDistance]);

  const pauseShift = useCallback(() => {
    setIsPaused(true);
    setKmAtPauseStart(shiftDistance);
  }, [shiftDistance]);

  const resumeShift = useCallback(() => {
    const pausedKm = shiftDistance - kmAtPauseStart;
    setTotalPausedKm((prev) => prev + pausedKm);
    setIsPaused(false);
  }, [shiftDistance, kmAtPauseStart]);

  useEffect(() => {
    if (isShiftActive && !isGpsActive) {
      console.warn("[ShiftContext] Turno ativo com GPS inativo. Solicitando reativação...");
      startGps();
    } else if (!isShiftActive && isGpsActive) {
      console.log("[ShiftContext] Turno inativo com GPS rodando. Encerrando GPS...");
      stopGps();
    }
  }, [isGpsActive, isShiftActive, startGps, stopGps]);

  const value = {
    isShiftActive,
    isPaused,
    startShift,
    stopShift,
    pauseShift,
    resumeShift,
    shiftDistance,
    productiveDistance,
  };

  return (
    <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>
  );
};
