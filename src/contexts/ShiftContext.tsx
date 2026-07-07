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
import { OverlayPermission } from "@/plugins/uber-accessibility";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();

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
        if (storedState) {
          setIsShiftActive(storedState.isShiftActive);
          setIsPaused(storedState.isPaused);
          setShiftDistance(storedState.shiftDistance);
          setProductiveDistance(storedState.productiveDistance);
          setTotalPausedKm(storedState.totalPausedKm);
          setKmAtPauseStart(storedState.kmAtPauseStart);
        }
      } catch (e) {
        console.error("Error restoring shift state", e);
      }
    };
    restoreState();
  }, []);

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
    const { hasPermission } = await OverlayPermission.check();
    if (!hasPermission) {
      toast({
        title: "Permissão necessária",
        description: "Para exibir as informações de corrida, você precisa permitir que o app sobreponha outros aplicativos.",
      });
      await OverlayPermission.request();
      return;
    }

    try {
      await NativeGps.clearGpsLog();
      await NativeGps.clearShiftState();
    } catch (e) {
      console.error("Error clearing GPS log", e);
    }
    resetAccumulatedDistance();
    startGps();
    setIsShiftActive(true);
    setIsPaused(false);
    setTotalPausedKm(0);
    setKmAtPauseStart(0);
    setProductiveDistance(0);
  }, [startGps, resetAccumulatedDistance, toast]);

  const stopShift = useCallback(async () => {
    stopGps();
    resetAccumulatedDistance();
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
    if (isGpsActive) {
      setIsShiftActive(true);
    }
  }, [isGpsActive]);

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
