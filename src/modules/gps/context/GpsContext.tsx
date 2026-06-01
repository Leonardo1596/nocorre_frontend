"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";

import { registerPlugin } from "@capacitor/core";

type Position = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
};

interface NativeGpsPlugin {
  start(): Promise<void>;
  stop(): Promise<void>;
  addListener(
    eventName: "gpsUpdate",
    callback: (data: Position) => void
  ): Promise<{ remove: () => void }>;
}

const NativeGps = registerPlugin<NativeGpsPlugin>("NativeGps");

interface GpsContextData {
  position: Position | null;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
}

const GpsContext = createContext<GpsContextData>({} as GpsContextData);

export function GpsProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [isTracking, setIsTracking] = useState(false);

  const listenerRef = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    NativeGps.start()
      .then(() => console.log("GPS nativo iniciado"))
      .catch((e) => console.error(e));
  }, []);

  async function startTracking() {
    if (isTracking) return;

    try {
      await NativeGps.start();

      const listener = await NativeGps.addListener(
        "gpsUpdate",
        (data: Position) => {
          setPosition(data);
        }
      );

      listenerRef.current = listener;

      setIsTracking(true);
    } catch (err) {
      console.error("Erro ao iniciar GPS nativo:", err);
    }
  }

  async function stopTracking() {
    try {
      await NativeGps.stop();

      if (listenerRef.current) {
        listenerRef.current.remove();
        listenerRef.current = null;
      }

      setIsTracking(false);
      setPosition(null);
    } catch (err) {
      console.error("Erro ao parar GPS nativo:", err);
    }
  }

  useEffect(() => {
    return () => {
      if (listenerRef.current) {
        listenerRef.current.remove();
      }
    };
  }, []);

  return (
    <GpsContext.Provider
      value={{
        position,
        isTracking,
        startTracking,
        stopTracking,
      }}
    >
      {children}
    </GpsContext.Provider>
  );
}

export function useGps() {
  return useContext(GpsContext);
}