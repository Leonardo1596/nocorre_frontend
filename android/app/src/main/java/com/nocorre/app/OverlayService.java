package com.nocorre.app;

import android.app.Service;
import android.content.Intent;
import android.graphics.PixelFormat;
import android.os.Handler;
import android.os.IBinder;
import android.os.Looper;
import android.util.Log;
import android.view.Gravity;
import android.view.LayoutInflater;
import android.view.View;
import android.view.WindowManager;
import android.widget.TextView;

import org.json.JSONObject;


public class OverlayService extends Service {


    private static final String TAG =
            "OverlayService";


    private static OverlayService instance;


    private WindowManager windowManager;

    private View overlayView;

    private TextView speedText;


    private String overlayType = "speed";



    private Handler handler =
            new Handler(
                    Looper.getMainLooper()
            );



    private Runnable hideRunnable =
            new Runnable() {

        @Override
        public void run() {

            Log.d(
                    TAG,
                    "Tempo expirado. Removendo overlay"
            );


            stopSelf();

        }
    };




    public static OverlayService getInstance() {

        return instance;

    }





    @Override
    public void onCreate() {

        super.onCreate();


        instance = this;



        try {


            windowManager =
                    (WindowManager) getSystemService(
                            WINDOW_SERVICE
                    );



            if(overlayView == null) {


                overlayView =
                        LayoutInflater.from(this)
                                .inflate(
                                        R.layout.overlay_layout,
                                        null
                                );



                speedText =
                        overlayView.findViewById(
                                R.id.speedText
                        );



                WindowManager.LayoutParams params =
                        new WindowManager.LayoutParams(

                                WindowManager.LayoutParams.WRAP_CONTENT,

                                WindowManager.LayoutParams.WRAP_CONTENT,

                                WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,

                                WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE
                                        | WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                                        | WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,

                                PixelFormat.TRANSLUCENT
                        );



                params.gravity =
                        Gravity.TOP | Gravity.END;


                params.x = 20;

                params.y = 200;



                windowManager.addView(
                        overlayView,
                        params
                );


                Log.d(
                        TAG,
                        "Overlay iniciado"
                );

            }



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro ao criar overlay",
                    e
            );


            stopSelf();

        }

    }







    @Override
    public int onStartCommand(
            Intent intent,
            int flags,
            int startId
    ) {



        if(intent == null) {

            return START_NOT_STICKY;

        }



        handler.removeCallbacks(
                hideRunnable
        );



        String action =
                intent.getAction();



        if(
                "HIDE_OVERLAY".equals(action)
        ) {


            Log.d(
                    TAG,
                    "Recebido comando para remover overlay"
            );


            stopSelf();


            return START_NOT_STICKY;

        }





        String type =
                intent.getStringExtra(
                        "overlay_type"
                );



        Log.d(
                TAG,
                "Recebi comando overlay: "
                +
                type
        );



        if(type != null) {

            overlayType = type;

        }





        if(
                "uber_trip".equals(
                        overlayType
                )
        ) {


            String tripJson =
                    intent.getStringExtra(
                            "trip"
                    );



            if(tripJson != null) {


                try {


                    JSONObject trip =
                            new JSONObject(
                                    tripJson
                            );


                    updateUberTrip(
                            trip
                    );


                    handler.postDelayed(
                            hideRunnable,
                            20000
                    );


                    Log.d(
                            TAG,
                            "Overlay Uber programado para fechar em 20 segundos"
                    );


                } catch(Exception e) {


                    Log.e(
                            TAG,
                            "Erro lendo corrida Uber",
                            e
                    );

                }

            }

        }



        return START_NOT_STICKY;

    }







    public void updateSpeed(
            final float speedMetersPerSecond
    ) {


        if(speedText == null) {

            return;

        }



        speedText.post(() -> {


            int kmh =
                    Math.round(
                            speedMetersPerSecond * 3.6f
                    );



            if(kmh < 5) {

                kmh = 0;

            }



            speedText.setText(
                    String.valueOf(kmh)
            );


        });

    }







    private void updateUberTrip(
        JSONObject trip
) {

    Log.d(
            TAG,
            "Calculando dados Uber"
    );


    if(speedText == null) {
        return;
    }



    speedText.post(() -> {

        try {


            double fare =
                    trip.optDouble(
                            "fare",
                            0
                    );



            double pickupKm =
                    trip.optDouble(
                            "pickupDistanceKm",
                            0
                    );



            double tripKm =
                    trip.optDouble(
                            "tripDistanceKm",
                            0
                    );



            String pickupTime =
                    trip.optString(
                            "pickupTime",
                            "0"
                    );



            String tripTime =
                    trip.optString(
                            "tripTime",
                            "0"
                    );



            int pickupMinutes =
                    extractMinutes(
                            pickupTime
                    );



            int tripMinutes =
                    extractMinutes(
                            tripTime
                    );



            int totalMinutes =
                    pickupMinutes + tripMinutes;



            double totalKm =
                    pickupKm + tripKm;



            double gainKm =
                    0;



            if(totalKm > 0) {

                gainKm =
                        fare / totalKm;

            }



            double gainHour =
                    0;



            if(totalMinutes > 0) {

                gainHour =
                        fare /
                        (totalMinutes / 60.0);

            }




            String text =


                    "🚗 UBER\n\n" +


                    "💰 R$ "
                    +
                    String.format(
                            "%.2f",
                            fare
                    )

                    +

                    "\n\n📊 RESULTADO\n\n"

                    +

                    "💵 Ganho/KM\nR$ "
                    +
                    String.format(
                            "%.2f",
                            gainKm
                    )

                    +

                    "\n\n⏰ Ganho/HORA\nR$ "
                    +
                    String.format(
                            "%.2f",
                            gainHour
                    )

                    +

                    "\n\n📏 KM total: "
                    +
                    String.format(
                            "%.1f",
                            totalKm
                    )

                    +

                    "\n⏱ Tempo total: "
                    +
                    totalMinutes
                    +
                    " min";



            speedText.setText(
                    text
            );



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro calculando Uber",
                    e
            );

        }

    });

}



private int extractMinutes(String time) {

    try {

        if(time == null || time.isEmpty()) {

            return 0;

        }


        String numbers =
                time.replaceAll(
                        "[^0-9]",
                        ""
                );


        if(numbers.isEmpty()) {

            return 0;

        }


        return Integer.parseInt(numbers);



    } catch(Exception e) {


        Log.e(
                TAG,
                "Erro convertendo tempo: " + time,
                e
        );


        return 0;

    }

}



    @Override
    public void onDestroy() {


        Log.d(
                TAG,
                "Destruindo overlay"
        );



        handler.removeCallbacks(
                hideRunnable
        );



        try {


            if(
                    overlayView != null
                    &&
                    windowManager != null
            ) {


                windowManager.removeView(
                        overlayView
                );


                overlayView = null;

            }



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro ao remover overlay",
                    e
            );

        }



        speedText = null;

        windowManager = null;


        instance = null;



        super.onDestroy();

    }







    @Override
    public IBinder onBind(
            Intent intent
    ) {

        return null;

    }

}