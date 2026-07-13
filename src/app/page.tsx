"use client"

import React, { useEffect, useState } from 'react';
import DashboardLayout from './(dashboard)/layout';
import Dashboard from './(dashboard)/page';
import { NativeGps, UberTrip } from '@/lib/gps';


export default function Home() {


  const [trip, setTrip] = useState<UberTrip | null>(null);



  useEffect(() => {

    let listener: any;


    const setupUberListener = async () => {

      console.log(
        "🔊 Registrando listener Uber..."
      );


      listener = await NativeGps.addListener(
        "uberTrip",
        async (newTrip) => {


          console.log(
            "🚗 NOVA CORRIDA UBER:",
            newTrip
          );



          setTrip(
            newTrip
          );



          try {


            console.log(
              "📲 Chamando overlay nativo..."
            );


            await NativeGps.showUberOverlay(
              newTrip
            );



            console.log(
              "✅ Overlay chamado com sucesso"
            );



          } catch(error) {


            console.error(
              "❌ Erro ao abrir overlay Uber:",
              error
            );

          }

        }
      );



      console.log(
            "✅ Listener Uber ativo"
      );

    };



    setupUberListener();



    return () => {


      if(listener) {


        console.log(
          "🗑 Removendo listener Uber"
        );


        listener.remove();

      }

    };


  }, []);




  return (
    <DashboardLayout>

      <Dashboard />


      {
        trip && (

          <div>

            <h2>
              Nova corrida Uber
            </h2>


            <p>
              Valor: R$ {trip.fare}
            </p>


            <p>
              Buscar passageiro:
              {trip.pickupDistanceKm} km
            </p>


            <p>
              Tempo até passageiro:
              {trip.pickupTime}
            </p>


            <p>
              Distância da viagem:
              {trip.tripDistanceKm} km
            </p>


            <p>
              Tempo da viagem:
              {trip.tripTime}
            </p>


            <p>
              Origem:
              {trip.origin}
            </p>


            <p>
              Destino:
              {trip.destination}
            </p>


          </div>

        )
      }


    </DashboardLayout>
  );
}