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


public class UberOverlayService extends Service {


    private static final String TAG =
            "UberOverlayService";


    private WindowManager windowManager;

    private View overlayView;

    private TextView speedText;


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
                    "Tempo expirado. Removendo overlay Uber"
            );


            stopSelf();

        }
    };




    @Override
    public void onCreate() {

        super.onCreate();


        try {


            windowManager =
                    (WindowManager) getSystemService(
                            WINDOW_SERVICE
                    );



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
                                    |
                            WindowManager.LayoutParams.FLAG_NOT_TOUCHABLE
                                    |
                            WindowManager.LayoutParams.FLAG_LAYOUT_IN_SCREEN,

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
                    "Overlay Uber iniciado"
            );



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro criando overlay Uber",
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



                handler.removeCallbacks(
                        hideRunnable
                );



                handler.postDelayed(
                        hideRunnable,
                        20000
                );



            } catch(Exception e) {


                Log.e(
                        TAG,
                        "Erro lendo corrida Uber",
                        e
                );

            }

        }



        return START_NOT_STICKY;

    }







    private void updateUberTrip(
            JSONObject trip
    ) {


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



                int totalMinutes =
                        extractMinutes(
                                pickupTime
                        )
                        +
                        extractMinutes(
                                tripTime
                        );



                double totalKm =
                        pickupKm + tripKm;



                double ganhoKm = 0;


                if(totalKm > 0) {

                    ganhoKm =
                            fare / totalKm;

                }



                double ganhoHora = 0;


                if(totalMinutes > 0) {

                    ganhoHora =
                            fare /
                            (totalMinutes / 60.0);

                }




                String text =

                        "💰 R$ "
                        +
                        String.format(
                                "%.2f",
                                fare
                        )

                        +

                        "\n🚗 R$ "
                        +
                        String.format(
                                "%.2f",
                                ganhoKm
                        )
                        +
                        "/km"

                        +

                        "\n⏱ R$ "
                        +
                        String.format(
                                "%.2f",
                                ganhoHora
                        )
                        +
                        "/h";



                speedText.setText(
                        text
                );



            } catch(Exception e) {


                Log.e(
                        TAG,
                        "Erro calculando corrida",
                        e
                );

            }


        });

    }






    private int extractMinutes(
            String time
    ) {


        try {


            if(
                    time == null
                    ||
                    time.isEmpty()
            ) {

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



            return Integer.parseInt(
                    numbers
            );



        } catch(Exception e) {


            return 0;

        }

    }







    @Override
    public void onDestroy() {


        Log.d(
                TAG,
                "Destruindo UberOverlayService"
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

            }


        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro removendo overlay Uber",
                    e
            );

        }



        overlayView = null;

        speedText = null;

        windowManager = null;



        super.onDestroy();

    }






    @Override
    public IBinder onBind(
            Intent intent
    ) {

        return null;

    }

}