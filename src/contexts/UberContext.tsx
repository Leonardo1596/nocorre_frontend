"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { PluginListenerHandle } from "@capacitor/core";
import { UberAccessibility } from "@/plugins/uber-accessibility";
import { RideInfo } from "@/plugins/uber-accessibility/definitions";
import { useToast } from "@/hooks/use-toast";

interface UberContextType {
  rideInfo: RideInfo | null;
}

const UberContext = createContext<UberContextType | undefined>(undefined);

export const UberProvider = ({ children }: { children: ReactNode }) => {
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    let listenerHandle: PluginListenerHandle;

    const addListener = async () => {
        listenerHandle = await UberAccessibility.addListener(
            "rideReceived",
            (info: RideInfo) => {
                setRideInfo(info);
                toast({
                    title: `Nova corrida: ${info.category}`,
                    description: (
                        <div className="text-sm">
                            <p><strong>Preço:</strong> {info.price}</p>
                            <p><strong>Distância:</strong> {info.distance}</p>
                            <p><strong>Tempo:</strong> {info.eta}</p>
                        </div>
                    ),
                    duration: 15000,
                });
            }
        );
    }
    addListener();

    return () => {
      if(listenerHandle) {
        listenerHandle.remove();
      }
    };
  }, [toast]);

  return (
    <UberContext.Provider value={{ rideInfo }}>{children}</UberContext.Provider>
  );
};

export const useUber = (): UberContextType => {
  const context = useContext(UberContext);
  if (context === undefined) {
    throw new Error("useUber must be used within a UberProvider");
  }
  return context;
};
