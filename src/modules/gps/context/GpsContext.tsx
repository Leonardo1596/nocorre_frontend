"use client";

import {
  createContext,
  useContext,
  useRef,
  useState,
  ReactNode,
  useEffect,
} from "react";
import { Capacitor } from '@capacitor/core'; // Import Capacitor

type Position = {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp?: number;
};

// Interface for the native GPS functionality exposed to JS via Capacitor Bridge
interface NativeGpsBridge {
  // Method to call native code to start location updates
  startLocationUpdates: () => Promise<void>;
  // Method to call native code to stop location updates
  stopLocationUpdates: () => Promise<void>;
  // Method to register a listener for location updates from native
  addLocationUpdateListener: (
    eventName: string,
    callback: (data: Position) => void
  ) => Promise<{ remove: () => void }>;
}

// --- Actual Bridge Implementation ---
// This uses Capacitor's bridge to communicate with your native Android plugin.
// The 'NativeGps' plugin ID must match the @CapacitorPlugin annotation in your Java code.
const NativeGpsBridge: NativeGpsBridge = {
  startLocationUpdates: async () => {
    console.log("JS: Calling native to start location updates...");
    try {
      await Capacitor.nativeBridge.invoke({
        pluginId: 'NativeGps', // Matches @CapacitorPlugin(name = "NativeGps") in Java
        method: 'startLocationUpdates',
      });
      console.log("JS: Native location updates start command sent.");
    } catch (error) {
      console.error("JS: Failed to invoke native startLocationUpdates:", error);
      throw error;
    }
  },
  stopLocationUpdates: async () => {
    console.log("JS: Calling native to stop location updates...");
    try {
      await Capacitor.nativeBridge.invoke({
        pluginId: 'NativeGps', // Matches @CapacitorPlugin(name = "NativeGps") in Java
        method: 'stopLocationUpdates',
      });
      console.log("JS: Native location updates stop command sent.");
    } catch (error) {
      console.error("JS: Failed to invoke native stopLocationUpdates:", error);
      throw error;
    }
  },
  addLocationUpdateListener: async (eventName, callback) => {
    console.log(`JS: Adding native listener for event: ${eventName}`);
    // Register a listener for events emitted by the native plugin.
    // The native code must call `notifyListeners(eventName, data)` for this to work.
    const listener = await Capacitor.nativeBridge.addListener(eventName, (data: { value: Position }) => {
        // Capacitor often wraps the emitted data in a 'value' property.
        // If your native code sends just the object, you might need to adjust here.
        console.log(`JS: Received native event '${eventName}':`, data.value);
        if (data.value) {
            callback(data.value);
        } else {
            console.warn("JS: Received event data is null or undefined.");
        }
    });
    return listener; // Returns { remove: () => void }
  },
};
// --- End Actual Bridge Implementation ---


interface GpsContextData {
  position: Position | null;
  isTracking: boolean;
  totalKm: number;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  resetTracking: () => void;
}

const GpsContext = createContext<GpsContextData | undefined>(undefined);

export function GpsProvider({ children }: { children: ReactNode }) {
  const [position, setPosition] = useState<Position | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [totalKm, setTotalKm] = useState<number>(0);
  const [previousPosition, setPreviousPosition] = useState<Position | null>(null);

  const locationUpdateListenerRef = useRef<{ remove: () => void } | null>(null);

  // Haversine formula to calculate distance between two lat/lng points in kilometers
  const calculateDistance = (pos1: Position, pos2: Position): number => {
    const R = 6371e3; // metres
    const φ1 = pos1.latitude * Math.PI / 180;
    const φ2 = pos2.latitude * Math.PI / 180;
    const Δφ = (pos2.latitude - pos1.latitude) * Math.PI / 180;
    const Δλ = (pos2.longitude - pos1.longitude) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c; // distance in metres
    return d / 1000; // distance in kilometers
  };

  async function startTracking() {
    if (isTracking) {
        console.log("JS: Tracking is already active.");
        return;
    }

    try {
      await NativeGpsBridge.startLocationUpdates();
      console.log("JS: Native GPS: Initiating tracking.");

      // Register the listener for 'gpsUpdate' events from native.
      // The event name 'gpsUpdate' must match what your native code emits.
      const listener = await NativeGpsBridge.addLocationUpdateListener('gpsUpdate', (newPosition: Position) => {
        console.log("JS received new GPS position:", newPosition);
        setPosition(newPosition);

        // Calculate distance if we have a previous position and the new one is valid
        if (previousPosition && newPosition.latitude && newPosition.longitude) {
          const distance = calculateDistance(previousPosition, newPosition);
          // Ensure distance is a valid number before adding
          if (!isNaN(distance)) {
            setTotalKm(prevKm => prevKm + distance);
          } else {
            console.warn("JS: Calculated distance is NaN.");
          }
        }
        // Update previous position for the next calculation if the new position is valid
        if (newPosition.latitude && newPosition.longitude) {
          setPreviousPosition(newPosition);
        }
      });
      locationUpdateListenerRef.current = listener;

      setIsTracking(true);
      setTotalKm(0); // Reset total Km when starting tracking
      setPreviousPosition(null); // Reset previous position
      console.log("JS: GPS tracking started, listener attached.");

    } catch (error) {
      console.error("JS: Failed to start native GPS tracking:", error);
      // Potentially show a toast to the user about the failure
      // e.g., toast({ variant: "destructive", title: "GPS Error", description: "Could not start tracking." });
    }
  }

  async function stopTracking() {
    if (!isTracking) {
        console.log("JS: Tracking is not active, nothing to stop.");
        return;
    }

    try {
      await NativeGpsBridge.stopLocationUpdates();
      console.log("JS: Native GPS: Stopping tracking.");

      if (locationUpdateListenerRef.current) {
        locationUpdateListenerRef.current.remove();
        locationUpdateListenerRef.current = null;
      }

      setIsTracking(false);
      // Optionally clear position and previousPosition on stop
      // setPosition(null);
      // setPreviousPosition(null);
      console.log("JS: GPS tracking stopped, listener removed.");

    } catch (error) {
      console.error("JS: Failed to stop native GPS tracking:", error);
      // Potentially show a toast to the user about the failure
    }
  }

  const resetTracking = () => {
    console.log("JS: Resetting GPS tracking state.");
    // Stop tracking first to ensure cleanup
    stopTracking().then(() => {
      setPosition(null);
      setPreviousPosition(null);
      setTotalKm(0); // Reset total kilometers
      setIsTracking(false); // Ensure tracking state is false
      console.log("JS: GPS tracking state fully reset.");
    }).catch(error => {
        console.error("JS: Error during resetTracking cleanup:", error);
        // Even if stopTracking has an error, try to reset state
        setPosition(null);
        setPreviousPosition(null);
        setTotalKm(0);
        setIsTracking(false);
    });
  };

  // Effect to clean up listener on unmount
  useEffect(() => {
    return () => {
      console.log("JS: GpsProvider unmounting, cleaning up listener.");
      if (locationUpdateListenerRef.current) {
        locationUpdateListenerRef.current.remove();
        locationUpdateListenerRef.current = null;
      }
    };
  }, []); // Empty dependency array ensures this runs only on mount/unmount

  const contextValue = {
    position,
    isTracking,
    totalKm,
    startTracking,
    stopTracking,
    resetTracking,
  };

  return (
    <GpsContext.Provider value={contextValue}>
      {children}
    </GpsContext.Provider>
  );
}

export function useGps() {
  const context = useContext(GpsContext);
  if (context === undefined) {
    throw new Error("useGps must be used within a GpsProvider");
  }
  return context;
}