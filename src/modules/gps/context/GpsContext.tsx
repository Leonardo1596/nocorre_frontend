"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode
} from "react";

import { Position } from "@capacitor/geolocation";

import {
  startGpsTracking,
  stopGpsTracking,
  requestGpsPermission
} from "../services/gps.service";

import {
  startForegroundService,
  stopForegroundService
} from "../services/foreground.service";

import { calculateDistance } from "../utils/haversine";

import {
  requestNotificationPermission
} from "../services/notification.service";

interface Coordinates {
  lat: number;
  lng: number;
  timestamp: number;
}

interface GpsContextData {
  currentPosition: Coordinates | null;
  totalKm: number;
  isTracking: boolean;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  resetTracking: () => void;
}

const GpsContext =
  createContext<GpsContextData | null>(null);

interface Props {
  children: ReactNode;
}

export function GpsProvider({
  children
}: Props) {

  const [
    currentPosition,
    setCurrentPosition
  ] = useState<Coordinates | null>(null);

  const [totalKm, setTotalKm] =
    useState(0);

  const [isTracking, setIsTracking] =
    useState(false);

  const watchIdRef =
    useRef<string | null>(null);

  const lastPositionRef =
    useRef<Coordinates | null>(null);

  /**
   * START GPS TRACKING
   */
  async function startTracking() {

    try {

      console.log(
        "Solicitando permissão GPS..."
      );

      const permission =
        await requestGpsPermission();

      console.log(
        "Permissão:",
        permission
      );

      if (
        permission.location !==
        "granted"
      ) {

        throw new Error(
          "A permissão de localização é necessária para iniciar o turno. Por favor, ative nas configurações do seu dispositivo."
        );
      }

      /**
       * REQUEST NOTIFICATION PERMISSION
       */
      await requestNotificationPermission();

      /**
       * SMALL DELAY FOR SAMSUNG/ANDROID 14+
       */
      await new Promise(resolve =>
        setTimeout(resolve, 300)
      );

      /**
       * START FOREGROUND SERVICE
       */
      await startForegroundService();

      /**
       * START GPS WATCH
       */
      const watchId =
        await startGpsTracking(
          (position: Position) => {

            console.log(
              "Nova posição:",
              position
            );

            if (!position?.coords) {
              return;
            }

            const accuracy =
              position.coords.accuracy;

            /**
             * IGNORE LOW ACCURACY
             */
            if (
              accuracy &&
              accuracy > 20
            ) {

              console.log(
                "GPS ignorado por baixa precisão:",
                accuracy
              );

              return;
            }

            const lat =
              position.coords.latitude;

            const lng =
              position.coords.longitude;

            const timestamp =
              position.timestamp;

            const newPosition: Coordinates = {
              lat,
              lng,
              timestamp
            };

            /**
             * UPDATE CURRENT POSITION
             */
            setCurrentPosition(
              newPosition
            );

            /**
             * FIRST POSITION
             */
            if (
              !lastPositionRef.current
            ) {

              lastPositionRef.current =
                newPosition;

              return;
            }

            /**
             * CALCULATE DISTANCE
             */
            const distance =
              calculateDistance(
                lastPositionRef.current.lat,
                lastPositionRef.current.lng,
                newPosition.lat,
                newPosition.lng
              );

            /**
             * IGNORE VERY SMALL MOVEMENTS
             */
            if (distance < 0.001) {

              lastPositionRef.current =
                newPosition;

              return;
            }

            /**
             * UPDATE TOTAL KM
             */
            setTotalKm(prev =>
              Number(
                (
                  prev + distance
                ).toFixed(3)
              )
            );

            /**
             * UPDATE LAST POSITION
             */
            lastPositionRef.current =
              newPosition;
          }
        );

      console.log(
        "WATCH ID:",
        watchId
      );

      watchIdRef.current =
        watchId;

      setIsTracking(true);

      console.log(
        "Tracking ATIVO"
      );

    } catch (error) {

      console.error(
        "ERRO GPS:",
        error
      );

      setIsTracking(false);

      throw error;
    }
  }

  /**
   * STOP GPS TRACKING
   */
  async function stopTracking() {

    try {

      /**
       * STOP GPS WATCH
       */
      if (watchIdRef.current) {

        await stopGpsTracking(
          watchIdRef.current
        );

        watchIdRef.current =
          null;
      }

      /**
       * STOP FOREGROUND SERVICE
       */
      await stopForegroundService();

      setIsTracking(false);

      console.log(
        "GPS tracking stopped"
      );

    } catch (error) {

      console.error(
        "Error stopping GPS:",
        error
      );
    }
  }

  /**
   * RESET TRACKING DATA
   */
  function resetTracking() {

    setTotalKm(0);

    setCurrentPosition(null);

    lastPositionRef.current =
      null;
  }

  /**
   * CLEANUP
   */
  useEffect(() => {

    return () => {

      if (watchIdRef.current) {

        stopGpsTracking(
          watchIdRef.current
        );
      }
    };

  }, []);

  return (
    <GpsContext.Provider
      value={{
        currentPosition,
        totalKm,
        isTracking,
        startTracking,
        stopTracking,
        resetTracking
      }}
    >
      {children}
    </GpsContext.Provider>
  );
}

export function useGps() {

  const context =
    useContext(GpsContext);

  if (!context) {

    throw new Error(
      "useGps must be used inside GpsProvider"
    );
  }

  return context;
}