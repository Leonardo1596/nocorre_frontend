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

    private View speedOverlayView;
private View uberOverlayView;

private TextView speedText;
private TextView uberText;


    private String overlayType = "speed";


    private boolean speedOverlayActive = false;



    private Handler handler =
            new Handler(
                    Looper.getMainLooper()
            );


private void removeUberOverlay(){

    if(
            uberOverlayView != null
            &&
            windowManager != null
    ){

        windowManager.removeView(
                uberOverlayView
        );

        uberOverlayView = null;
        uberText = null;
    }

}


    private Runnable hideRunnable =
        new Runnable() {

    @Override
    public void run() {

        removeUberOverlay();

    }
};




    public static OverlayService getInstance() {

        return instance;

    }





    public boolean isSpeedOverlayActive() {

        return speedOverlayActive;

    }




    public void enableSpeedOverlay() {


        speedOverlayActive = true;


        overlayType = "speed";


        if(speedText != null) {


            speedText.post(() -> {

                speedText.setText("0");

            });

        }


    }




    public void disableSpeedOverlay() {


        speedOverlayActive = false;

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


        createSpeedOverlay();


        Log.d(
                TAG,
                "Overlay velocímetro iniciado"
        );


    } catch(Exception e) {


        Log.e(
                TAG,
                "Erro criando overlay",
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


            stopSelf();


            return START_NOT_STICKY;

        }





        String type =
                intent.getStringExtra(
                        "overlay_type"
                );



        if(type != null) {

            overlayType = type;

        }




        if(
    "uber_trip".equals(
        overlayType
    )
)
{

    createUberOverlay();



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
                            10000
                    );



                } catch(Exception e) {


                    Log.e(
                            TAG,
                            "Erro lendo corrida",
                            e
                    );

                }

            }


        } else {


            enableSpeedOverlay();

        }



        return START_NOT_STICKY;

    }







    public void updateSpeed(
            final float speedMetersPerSecond
    ) {



        if(
                speedText == null
                ||
                !speedOverlayActive
        ) {

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


    if(uberText == null) {

        return;

    }


    uberText.post(() -> {


            try {


                double fare =
                        trip.optDouble(
                                "fare",
                                0
                        );



                double totalKm =

                        trip.optDouble(
                                "pickupDistanceKm",
                                0
                        )
                        +
                        trip.optDouble(
                                "tripDistanceKm",
                                0
                        );



                int totalMinutes =

                        extractMinutes(
                                trip.optString(
                                        "pickupTime",
                                        "0"
                                )
                        )

                        +

                        extractMinutes(
                                trip.optString(
                                        "tripTime",
                                        "0"
                                )
                        );



                double gainKm = 0;


                if(totalKm > 0) {

                    gainKm =
                            fare / totalKm;

                }



                double gainHour = 0;


                if(totalMinutes > 0) {


                    gainHour =
                            fare /
                            (totalMinutes / 60.0);


                }




                uberText.setText(

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
                                gainKm
                        )
                        +
                        "/km"

                        +

                        "\n⏱ R$ "
                        +
                        String.format(
                                "%.2f",
                                gainHour
                        )
                        +
                        "/h"

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




    private void createSpeedOverlay(){

    speedOverlayView =
            LayoutInflater.from(this)
                    .inflate(
                            R.layout.overlay_speed,
                            null
                    );


    speedText =
            speedOverlayView.findViewById(
                    R.id.speedText
            );


    WindowManager.LayoutParams params =
            new WindowManager.LayoutParams(

                    100,
                    100,

                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,

                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,

                    PixelFormat.TRANSLUCENT
            );


    params.gravity =
        Gravity.TOP | Gravity.START;


params.x = 20;

params.y = 200;


    windowManager.addView(
            speedOverlayView,
            params
    );

}


private void createUberOverlay(){

    if(uberOverlayView != null){
        return;
    }


    uberOverlayView =
            LayoutInflater.from(this)
                    .inflate(
                            R.layout.overlay_layout,
                            null
                    );


    uberText =
            uberOverlayView.findViewById(
                    R.id.speedText
            );


    WindowManager.LayoutParams params =
            new WindowManager.LayoutParams(

                    280,

                    WindowManager.LayoutParams.WRAP_CONTENT,

                    WindowManager.LayoutParams.TYPE_APPLICATION_OVERLAY,

                    WindowManager.LayoutParams.FLAG_NOT_FOCUSABLE,

                    PixelFormat.TRANSLUCENT
            );


    params.gravity =
            Gravity.BOTTOM | Gravity.END;


    params.x = 20;

    params.y = 300;


    windowManager.addView(
            uberOverlayView,
            params
    );

}






    @Override
    public void onDestroy() {


        handler.removeCallbacks(
                hideRunnable
        );



        try {

    if(
            speedOverlayView != null
            &&
            windowManager != null
    ){

        windowManager.removeView(
                speedOverlayView
        );

    }


    if(
            uberOverlayView != null
            &&
            windowManager != null
    ){

        windowManager.removeView(
                uberOverlayView
        );

    }


} catch(Exception ignored){

}



        speedOverlayView = null;
uberOverlayView = null;

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