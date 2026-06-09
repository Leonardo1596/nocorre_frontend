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
  // A lógica de localização e distância é gerenciada pelo GpsContext.
  const {
    isGpsActive,
    startGps,
    stopGps,
    accumulatedDistance,
  } = useGps();

  // O estado do turno (ativo/inativo) é um reflexo do estado do GPS.
  const isShiftActive = isGpsActive;

  const startShift = () => {
    // Apenas inicia o GPS. Não reseta mais a distância aqui.
    startGps();
  };

  const stopShift = () => {
    stopGps();
    // A distância é preservada no GpsContext até que um novo turno comece
    // (ou seja, quando o app for reiniciado e o GPS for reativado).
  };

  const value = {
    isShiftActive,
    startShift,
    stopShift,
    // Garante que a distância seja sempre um número para evitar erros na interface.
    accumulatedDistance: accumulatedDistance || 0,
  };

  return <ShiftContext.Provider value={value}>{children}</ShiftContext.Provider>;
};
