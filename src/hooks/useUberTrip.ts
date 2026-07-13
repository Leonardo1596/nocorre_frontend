"use client"

import { useEffect, useState } from "react";
import { NativeGps, UberTrip } from "@/lib/gps";


export function useUberTrip() {

  const [trip, setTrip] = useState<UberTrip | null>(null);


  useEffect(() => {

    let listener: any;


    const init = async () => {

      listener = await NativeGps.addListener(
        "uberTrip",
        (newTrip) => {

          console.log(
            "Nova corrida recebida:",
            newTrip
          );

          setTrip(newTrip);

        }
      );

    };


    init();


    return () => {

      if (listener) {

        listener.remove();

      }

    };


  }, []);


  return trip;

}