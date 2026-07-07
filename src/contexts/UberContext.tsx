"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import { UberAccessibilityPlugin } from "src/plugins/uber-accessibility/definitions";
import { useToast } from "@/hooks/use-toast";

export interface RideInfo {
  category: string;
  price: string;
  distance: string;
  eta: string;
}

interface UberContextType {
  rideInfo: RideInfo | null;
}

const UberContext = createContext<UberContextType | undefined>(undefined);

export const UberProvider = ({ children }: { children: ReactNode }) => {
  const [rideInfo, setRideInfo] = useState<RideInfo | null>(null);
  const { toast } = useToast();

  React.useEffect(() => {
    const listener = UberAccessibilityPlugin.addListener(
      "rideReceived",
      (info: RideInfo) => {
        setRideInfo(info);
        toast({
          title: info.category,
          description: (
            <div>
              <p>Preço: {info.price}</p>
              <p>Distância: {info.distance}</p>
              <p>ETA: {info.eta}</p>
            </div>
          ),
        });
      }
    );

    return () => {
      listener.remove();
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
