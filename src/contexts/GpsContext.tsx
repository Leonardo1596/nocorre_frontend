"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  useRef,
} from "react";
import { App } from "@capacitor/app";
import { NativeGps } from "@/lib/gps";

const DESIRED_GPS_KEY = "nocorre_gps_desired_active";
const STALE_LOCATION_THRESHOLD_MS = 25000; // 25 segundos sem atualização quando ativo

interface Location {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}

interface GpsContextType {
  location: Location | null;
  speed: number;
  startGps: () => Promise<void>;
  stopGps: () => Promise<void>;
  isGpsActive: boolean;
  accumulatedDistance: number;
  resetAccumulatedDistance: () => Promise<void>;
  isReactivating: boolean;
  autoReactivate: boolean;
  setAutoReactivate: (enabled: boolean) => void;
  reactivateGps: () => Promise<void>;
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
  const [speed, setSpeed] = useState(0);
  const [isGpsActive, setIsGpsActive] = useState(false);
  const [accumulatedDistance, setAccumulatedDistance] = useState(0);
  const [isReactivating, setIsReactivating] = useState(false);
  const [autoReactivate, setAutoReactivate] = useState(true);

  // Ref indicando se o GPS DEVE estar ativo (desejado pelo motorista/turno)
  const desiredGpsActive = useRef(false);
  const lastLocationTime = useRef<number>(Date.now());
  const isReactivatingRef = useRef(false);

  const normalizeSpeed = (speedMs: number) => {
    let kmh = speedMs * 3.6;
    if (kmh < 5) {
      kmh = 0;
    }
    return Math.round(kmh);
  };

  /**
   * Reativação automática do GPS quando o status estiver inativo
   */
  const reactivateGps = useCallback(async () => {
    if (isReactivatingRef.current) return;
    isReactivatingRef.current = true;
    setIsReactivating(true);

    try {
      console.warn("[GPS Auto-Reactivate] Status inativo detectado com turno em curso. Reativando GPS...");
      await NativeGps.startGps();
      setIsGpsActive(true);
      lastLocationTime.current = Date.now();
      console.log("[GPS Auto-Reactivate] GPS reativado com sucesso!");
    } catch (error) {
      console.error("[GPS Auto-Reactivate] Erro ao tentar reativar GPS:", error);
    } finally {
      isReactivatingRef.current = false;
      setIsReactivating(false);
    }
  }, []);

  /**
   * Restaura estado salvo pelo Android / Storage inicial (executa apenas uma vez no mount)
   */
  useEffect(() => {
    let isMounted = true;

    const restore = async () => {
      try {
        const distance = await NativeGps.getDistance();
        if (isMounted) setAccumulatedDistance(distance.kilometers);

        const { isRunning } = await NativeGps.isGpsRunning();
        if (isMounted) setIsGpsActive(isRunning);

        // Se o storage indica que o GPS deveria estar rodando (turno ativo)
        if (typeof window !== "undefined") {
          const storedDesired = localStorage.getItem(DESIRED_GPS_KEY) === "true";
          if (storedDesired) {
            desiredGpsActive.current = true;
            if (!isRunning) {
              reactivateGps();
            }
          } else {
            // Nenhum turno ativo! Se o serviço nativo estava rodando, encerra imediatamente.
            desiredGpsActive.current = false;
            if (isRunning) {
              console.log("[GPS] Serviço nativo estava rodando sem turno ativo. Parando...");
              await NativeGps.stopGps();
              if (isMounted) setIsGpsActive(false);
            }
          }
        }
      } catch (e) {
        console.error("Error restoring GPS state", e);
      }
    };

    restore();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Recebe localização e velocidade.
   */
  const handleLocationUpdate = useCallback(
    async (locationData: Location) => {
      if (!locationData) return;

      lastLocationTime.current = Date.now();
      setLocation(locationData);
      setSpeed(normalizeSpeed(locationData.speed));

      try {
        const distance = await NativeGps.getDistance();
        setAccumulatedDistance(distance.kilometers);
      } catch (e) {
        console.error("Erro buscando distância", e);
      }
    },
    []
  );

  /**
   * Reset distância
   */
  const resetAccumulatedDistance = useCallback(async () => {
    try {
      await NativeGps.resetDistance();
      setAccumulatedDistance(0);
    } catch (e) {
      console.error("Erro resetando distância", e);
    }
  }, []);

  /**
   * Inscrição aos eventos do NativeGps
   */
  useEffect(() => {
    let removeListener: (() => void) | null = null;
    let isCancelled = false;

    NativeGps.addListener("locationUpdate", handleLocationUpdate)
      .then((handle: any) => {
        if (isCancelled) {
          handle?.remove?.();
        } else {
          removeListener = () => handle?.remove?.();
        }
      })
      .catch((err: any) => {
        console.warn("Failed to add location listener:", err);
      });

    return () => {
      isCancelled = true;
      if (removeListener) {
        removeListener();
      }
    };
  }, [handleLocationUpdate]);

  /**
   * Iniciar GPS explicitamente
   */
  const startGps = useCallback(async () => {
    desiredGpsActive.current = true;
    if (typeof window !== "undefined") {
      localStorage.setItem(DESIRED_GPS_KEY, "true");
    }

    try {
      await NativeGps.startGps();
      setIsGpsActive(true);
      lastLocationTime.current = Date.now();
      console.log("GPS service started via context");
    } catch (e) {
      console.error("Error starting GPS service via context", e);
      setIsGpsActive(false);
    }
  }, []);

  /**
   * Parar GPS explicitamente (quando o motorista encerra o turno)
   */
  const stopGps = useCallback(async () => {
    desiredGpsActive.current = false;
    if (typeof window !== "undefined") {
      localStorage.removeItem(DESIRED_GPS_KEY);
    }

    try {
      await NativeGps.stopGps();
      setIsGpsActive(false);
      setIsReactivating(false);
      console.log("GPS service stopped via context");
    } catch (e) {
      console.error("Error stopping GPS service via context", e);
    }
  }, []);

  /**
   * WATCHDOG: Monitoramento contínuo para reativar caso fique inativo durante turno
   */
  useEffect(() => {
    if (!autoReactivate) return;

    const watchdog = setInterval(async () => {
      if (!desiredGpsActive.current) return;

      try {
        const { isRunning } = await NativeGps.isGpsRunning();

        // Se o serviço nativo parou inesperadamente
        if (!isRunning) {
          console.warn("[GPS Watchdog] Serviço nativo inativo durante turno. Acionando reativação...");
          await reactivateGps();
          return;
        }

        // Se está ativo mas sem dados há muito tempo (stale watchdog)
        const timeSinceLastUpdate = Date.now() - lastLocationTime.current;
        if (timeSinceLastUpdate > STALE_LOCATION_THRESHOLD_MS) {
          console.warn(
            `[GPS Watchdog] GPS silencioso há ${Math.round(
              timeSinceLastUpdate / 1000
            )}s. Reativando serviço...`
          );
          await reactivateGps();
        }
      } catch (err) {
        console.warn("[GPS Watchdog] Erro checando status do GPS:", err);
      }
    }, 4000);

    return () => clearInterval(watchdog);
  }, [autoReactivate, reactivateGps]);

  /**
   * LIFECYCLE RECONNECT: Reativar quando o app volta ao primeiro plano ou recupera conexão
   */
  useEffect(() => {
    if (!autoReactivate) return;

    const checkAndRecover = async () => {
      if (!desiredGpsActive.current) return;
      try {
        const { isRunning } = await NativeGps.isGpsRunning();
        if (!isRunning) {
          console.log("[GPS Lifecycle] App reaberto/visível com GPS inativo. Reativando...");
          await reactivateGps();
        }
      } catch (e) {
        console.warn("[GPS Lifecycle] Erro ao verificar GPS no retorno:", e);
      }
    };

    // 1. Visibilidade do navegador/PWA
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        checkAndRecover();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);

    // 2. Retorno de conectividade
    window.addEventListener("online", checkAndRecover);

    // 3. Capacitor App State Change (Mobile Android/iOS)
    let appStateHandle: any = null;
    App.addListener("appStateChange", (state) => {
      if (state.isActive) {
        checkAndRecover();
      }
    })
      .then((handle) => {
        appStateHandle = handle;
      })
      .catch(() => {});

    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("online", checkAndRecover);
      if (appStateHandle?.remove) {
        appStateHandle.remove();
      }
    };
  }, [autoReactivate, reactivateGps]);

  const value: GpsContextType = {
    location,
    speed,
    startGps,
    stopGps,
    isGpsActive,
    accumulatedDistance,
    resetAccumulatedDistance,
    isReactivating,
    autoReactivate,
    setAutoReactivate,
    reactivateGps,
  };

  return <GpsContext.Provider value={value}>{children}</GpsContext.Provider>;
};
