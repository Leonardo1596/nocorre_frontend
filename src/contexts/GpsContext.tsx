"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

import { NativeGps } from "@/lib/gps";


interface Location {
  latitude: number;
  longitude: number;
  speed: number;
  accuracy: number;
}


interface GpsContextType {

  location: Location | null;

  speed: number;

  startGps: () => void;

  stopGps: () => void;

  isGpsActive: boolean;

  accumulatedDistance: number;

  resetAccumulatedDistance: () => Promise<void>;
}



const GpsContext =
  createContext<GpsContextType | undefined>(undefined);



export const useGps = () => {

  const context =
    useContext(GpsContext);


  if (!context) {

    throw new Error(
      "useGps must be used within a GpsProvider"
    );

  }


  return context;
};




export const GpsProvider = ({
  children,
}: {
  children: React.ReactNode;
}) => {


  const [location, setLocation] =
    useState<Location | null>(null);


  const [speed, setSpeed] =
    useState(0);


  const [isGpsActive, setIsGpsActive] =
    useState(false);


  const [accumulatedDistance, setAccumulatedDistance] =
    useState(0);




  const normalizeSpeed = (
    speedMs: number
  ) => {

    let kmh =
      speedMs * 3.6;


    if (kmh < 5) {

      kmh = 0;

    }


    return Math.round(kmh);
  };





  /**
   * Restaura estado salvo pelo Android
   */
  useEffect(() => {


    const restore = async () => {


      try {


        const distance =
          await NativeGps.getDistance();



        setAccumulatedDistance(
          distance.kilometers
        );



        const {
          isRunning
        } =
          await NativeGps.isGpsRunning();



        setIsGpsActive(
          isRunning
        );



      } catch(e) {


        console.error(
          "Error restoring GPS state",
          e
        );

      }

    };



    restore();


  }, []);







  /**
   * Recebe somente localização e velocidade.
   * A distância vem do serviço nativo.
   */
  const handleLocationUpdate =
    useCallback(
      async (
        locationData: Location
      ) => {


        if (!locationData) {

          return;

        }



        setLocation(
          locationData
        );



        setSpeed(
          normalizeSpeed(
            locationData.speed
          )
        );



        try {


          const distance =
            await NativeGps.getDistance();



          setAccumulatedDistance(
            distance.kilometers
          );


        } catch(e) {


          console.error(
            "Erro buscando distância",
            e
          );

        }


      },
      []
    );








  /**
   * Agora o reset acontece no Android
   */
  const resetAccumulatedDistance =
    useCallback(
      async () => {


        try {


          await NativeGps.resetDistance();


          setAccumulatedDistance(
            0
          );


        } catch(e) {


          console.error(
            "Erro resetando distância",
            e
          );

        }


      },
      []
    );








  useEffect(() => {


    const setupListener =
      async () => {


        const listener =
          await NativeGps.addListener(
            "locationUpdate",
            handleLocationUpdate
          );


        return () => {

          listener.remove();

        };

      };



    const removeListener =
      setupListener();



    return () => {


      removeListener.then(
        (remove) => remove()
      );


    };


  }, [handleLocationUpdate]);









  const startGps =
    async () => {


      try {


        await NativeGps.startGps();


        setIsGpsActive(
          true
        );


        console.log(
          "GPS service started via context"
        );



      } catch(e) {


        console.error(
          "Error starting GPS service via context",
          e
        );


        setIsGpsActive(
          false
        );

      }

    };







  const stopGps =
    async () => {


      try {


        await NativeGps.stopGps();


        setIsGpsActive(
          false
        );



        console.log(
          "GPS service stopped via context"
        );



      } catch(e) {


        console.error(
          "Error stopping GPS service via context",
          e
        );

      }

    };









  const value: GpsContextType = {


    location,


    speed,


    startGps,


    stopGps,


    isGpsActive,


    accumulatedDistance,


    resetAccumulatedDistance,


  };





  return (

    <GpsContext.Provider value={value}>

      {children}

    </GpsContext.Provider>

  );

};