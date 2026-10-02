package com.nocorre.app;

import android.accessibilityservice.AccessibilityService;
import android.content.Intent;
import android.util.Log;
import android.view.accessibility.AccessibilityEvent;
import android.view.accessibility.AccessibilityNodeInfo;

import java.util.ArrayList;
import java.util.List;

public class UberAccessibilityService extends AccessibilityService {

    private static final String TAG = "UberAccessibility";
    private static final String UBER_PACKAGE = "com.ubercab.driver";

    // Evita repetir a mesma corrida várias vezes
    private String lastOfferHash = "";


    @Override
    public void onServiceConnected() {

        super.onServiceConnected();

        Log.d(
                TAG,
                "Accessibility Service conectado"
        );
    }



    @Override
    public void onAccessibilityEvent(
            AccessibilityEvent event
    ) {


        if(event == null) {
            return;
        }



        CharSequence packageName =
                event.getPackageName();



        if(packageName == null) {
            return;
        }



        if(!UBER_PACKAGE.contentEquals(packageName)) {
            return;
        }


if (
        event.getEventType() != AccessibilityEvent.TYPE_WINDOW_CONTENT_CHANGED
        &&
        event.getEventType() != AccessibilityEvent.TYPE_WINDOW_STATE_CHANGED
) {
    return;
}


        AccessibilityNodeInfo root =
                getRootInActiveWindow();



        if(root == null) {
            return;
        }



        List<String> texts =
                new ArrayList<>();



        collectTexts(
                root,
                texts
        );



        //-----------------------------------------
        // Verifica se realmente é tela de oferta
        //-----------------------------------------

        boolean hasActionButton = false;
        boolean hasDistance = false;
        boolean hasMoney = false;



        for(String text : texts) {



            Log.d(
                    TAG,
                    "Texto encontrado: " + text
            );



            // Corrida normal = Accept
            // Radar = Match
            String normalized =
        text.trim().toLowerCase();

if(
        normalized.equals("accept")
        ||
        normalized.equals("match")
        ||
        normalized.equals("aceitar")
        ||
        normalized.equals("selecionar")
) {

    hasActionButton = true;

}



            if(
                    text.contains("km")
                    &&
                    text.contains("(")
            ) {

                hasDistance = true;

            }



            if(
                    text.contains("R$")
            ) {

                hasMoney = true;

            }

        }



        Log.d(
                TAG,
                "Oferta detectada -> Botão:"
                        + hasActionButton
                        +
                        " Distância:"
                        + hasDistance
                        +
                        " Valor:"
                        + hasMoney
        );



        if(
                !hasActionButton
                ||
                !hasDistance
                ||
                !hasMoney
        ) {

            lastOfferHash = "";

            return;

        }




        //-----------------------------------------
        // Faz o parse da corrida
        //-----------------------------------------

        UberTrip trip =
                UberTripParser.parse(
                        texts
                );



        if(!trip.isOffer) {

            return;

        }





        //-----------------------------------------
        // Evita eventos duplicados
        //-----------------------------------------

        String hash =

                trip.fare
                +
                "|"
                +
                trip.pickupDistanceKm
                +
                "|"
                +
                trip.tripDistanceKm
                +
                "|"
                +
                trip.origin
                +
                "|"
                +
                trip.destination;



        if(
                hash.equals(lastOfferHash)
        ) {

            return;

        }



        lastOfferHash = hash;




        //-----------------------------------------
        // Log
        //-----------------------------------------

        Log.d(
                TAG,
                "======================================"
        );


        Log.d(
                TAG,
                "🚕 NOVA CORRIDA"
        );


        Log.d(
                TAG,
                "Valor: R$ "
                        +
                        trip.fare
        );


        Log.d(
                TAG,
                "Embarque: "
                        +
                        trip.pickupDistanceKm
                        +
                        " km | "
                        +
                        trip.pickupTime
        );


        Log.d(
                TAG,
                "Viagem: "
                        +
                        trip.tripDistanceKm
                        +
                        " km | "
                        +
                        trip.tripTime
        );


        Log.d(
                TAG,
                "Origem: "
                        +
                        trip.origin
        );


        Log.d(
                TAG,
                "Destino: "
                        +
                        trip.destination
        );


        Log.d(
                TAG,
                "======================================"
        );





        //-----------------------------------------
        // Envia para o restante do app
        //-----------------------------------------

        Intent intent =
        new Intent("UBER_NEW_TRIP");

intent.setPackage(
        getPackageName()
);

intent.putExtra(
        "fare",
        trip.fare
);

intent.putExtra(
        "pickupDistanceKm",
        trip.pickupDistanceKm
);

intent.putExtra(
        "pickupTime",
        trip.pickupTime
);

intent.putExtra(
        "tripDistanceKm",
        trip.tripDistanceKm
);

intent.putExtra(
        "tripTime",
        trip.tripTime
);

intent.putExtra(
        "origin",
        trip.origin
);

intent.putExtra(
        "destination",
        trip.destination
);

sendBroadcast(intent);

    }





    @Override
    public void onInterrupt() {

        Log.d(
                TAG,
                "Accessibility interrompido"
        );

    }






    /**
     * Percorre toda a árvore coletando textos.
     */
    private void collectTexts(
            AccessibilityNodeInfo node,
            List<String> texts
    ) {


        if(node == null) {
            return;
        }



        if(node.getText() != null) {


            String value =
                    node.getText()
                            .toString()
                            .trim();



            if(!value.isEmpty()) {

                texts.add(value);

            }

        }



        if(node.getContentDescription() != null) {


            String value =
                    node.getContentDescription()
                            .toString()
                            .trim();



            if(!value.isEmpty()) {

                texts.add(value);

            }

        }




        for(int i = 0; i < node.getChildCount(); i++) {


            AccessibilityNodeInfo child =
                    node.getChild(i);



            if(child != null) {


                collectTexts(
                        child,
                        texts
                );

            }

        }

    }

}