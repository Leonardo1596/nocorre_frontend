package com.nocorre.app.gps;

import android.Manifest;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.util.Log;

import androidx.lifecycle.Observer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONException;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;

import android.net.Uri;
import android.provider.Settings;

import android.content.BroadcastReceiver;
import android.content.IntentFilter;

import org.json.JSONObject;

import com.nocorre.app.UberOverlayService;
import com.nocorre.app.OverlayService;

@CapacitorPlugin(
    name = "NativeGps",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION
            }
        ),
        @Permission(
            alias = "notifications",
            strings = {
                Manifest.permission.POST_NOTIFICATIONS
            }
        )
    }
)
public class NativeGpsPlugin extends Plugin {


    private static final String PENDING_LOCATIONS_FILE =
            "gps_pending_locations.log";

    private static final String SHIFT_STATE_FILE =
            "shift_state.json";

    private static final String TAG =
            "NativeGpsPlugin";


    private LocationRepository locationRepository;
    private Observer<Location> locationObserver;
    

        private BroadcastReceiver uberTripReceiver;

    @Override
    public void load() {

        super.load();

        locationRepository =
                LocationRepository.getInstance();

        uberTripReceiver = new BroadcastReceiver() {

    @Override
    public void onReceive(Context context, Intent intent) {

        JSObject trip = new JSObject();

        trip.put(
                "fare",
                intent.getDoubleExtra("fare", 0)
        );

        trip.put(
                "pickupDistanceKm",
                intent.getDoubleExtra("pickupDistanceKm", 0)
        );

        trip.put(
                "pickupTime",
                intent.getStringExtra("pickupTime")
        );

        trip.put(
                "tripDistanceKm",
                intent.getDoubleExtra("tripDistanceKm", 0)
        );

        trip.put(
                "tripTime",
                intent.getStringExtra("tripTime")
        );

        trip.put(
                "origin",
                intent.getStringExtra("origin")
        );

        trip.put(
                "destination",
                intent.getStringExtra("destination")
        );

        notifyListeners(
                "uberTrip",
                trip,
                true
        );

        try {

    Intent overlayIntent =
        new Intent(
                getContext(),
                UberOverlayService.class
        );


    overlayIntent.putExtra(
            "trip",
            trip.toString()
    );


    getContext()
            .startService(
                    overlayIntent
            );


    Log.d(
            TAG,
            "Overlay Uber iniciado pelo Android"
    );


} catch(Exception e) {

    Log.e(
            TAG,
            "Erro iniciando overlay automaticamente",
            e
    );

}
    }
};

IntentFilter filter =
        new IntentFilter("UBER_NEW_TRIP");

getContext().registerReceiver(
        uberTripReceiver,
        filter
);

        locationObserver = location -> {

            if (location != null) {

                JSObject ret = new JSObject();

                ret.put(
                        "latitude",
                        location.getLatitude()
                );

                ret.put(
                        "longitude",
                        location.getLongitude()
                );

                ret.put(
                        "speed",
                        location.getSpeed()
                );

                ret.put(
                        "accuracy",
                        location.getAccuracy()
                );


                notifyListeners(
                        "locationUpdate",
                        ret,
                        true
                );
            }
        };


        getActivity().runOnUiThread(() ->
            locationRepository
                .getLocationData()
                .observeForever(locationObserver)
        );
    }



    @PluginMethod
    public void startGps(PluginCall call) {

        if (
            getPermissionState("location")
            != PermissionState.GRANTED
        ) {

            requestPermissionForAlias(
                    "location",
                    call,
                    "permissionCallback"
            );

        } else {

            permissionCallback(call);
        }
    }



    @PermissionCallback
    private void permissionCallback(
            PluginCall call
    ) {

        if (
            getPermissionState("location")
            != PermissionState.GRANTED
        ) {

            call.reject(
                    "Location permission is required to start GPS."
            );

            return;
        }


        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU
            &&
            getPermissionState("notifications")
            != PermissionState.GRANTED
        ) {

            requestPermissionForAlias(
                    "notifications",
                    call,
                    "permissionCallback"
            );

            return;
        }


        startGpsService(call);
    }



    private void startGpsService(
            PluginCall call
    ) {

        Intent serviceIntent =
                new Intent(
                        getContext(),
                        NativeGpsService.class
                );


        if (
            Build.VERSION.SDK_INT >= Build.VERSION_CODES.O
        ) {

            getContext()
                .startForegroundService(serviceIntent);

        } else {

            getContext()
                .startService(serviceIntent);
        }


        call.resolve();
    }




    @PluginMethod
public void stopGps(
        PluginCall call
) {

    try {


        Intent gpsIntent =
                new Intent(
                        getContext(),
                        NativeGpsService.class
                );


        getContext()
                .stopService(
                        gpsIntent
                );



        Intent overlayIntent =
                new Intent(
                        getContext(),
                        OverlayService.class
                );


        overlayIntent.setAction(
                "HIDE_OVERLAY"
        );

        Intent uberIntent =
        new Intent(
                getContext(),
                UberOverlayService.class
        );

getContext()
        .stopService(
                uberIntent
        );


        getContext()
                .startService(
                        overlayIntent
                );



        call.resolve();



    } catch(Exception e) {


        Log.e(
                TAG,
                "Erro ao parar GPS",
                e
        );


        call.reject(
                "Erro ao finalizar turno: "
                +
                e.getMessage()
        );

    }
}




    @PluginMethod
    public void isGpsRunning(
            PluginCall call
    ) {

        JSObject ret =
                new JSObject();


        ret.put(
                "isRunning",
                NativeGpsService.isRunning
        );


        call.resolve(ret);
    }





    /**
     * Retorna distância calculada pelo serviço nativo
     */
    @PluginMethod
    public void getDistance(
            PluginCall call
    ) {

        try {

            float distanceMeters = 0f;


            NativeGpsService service =
                    NativeGpsService.getInstance();



            if(service != null) {

                distanceMeters =
                        service.getAccumulatedDistanceMeters();


            } else {


                android.content.SharedPreferences prefs =
                        getContext()
                        .getSharedPreferences(
                                "gps_state",
                                Context.MODE_PRIVATE
                        );


                distanceMeters =
                        prefs.getFloat(
                                "distance",
                                0f
                        );
            }



            JSObject ret =
                    new JSObject();


            ret.put(
                    "meters",
                    distanceMeters
            );


            ret.put(
                    "kilometers",
                    distanceMeters / 1000f
            );


            call.resolve(ret);



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro buscando distância",
                    e
            );


            call.reject(
                    "Erro buscando distância"
            );
        }
    }





    @PluginMethod
    public void resetDistance(
            PluginCall call
    ) {

        try {


            NativeGpsService service =
                    NativeGpsService.getInstance();



            if(service != null) {


                service.resetDistance();


            } else {


                getContext()
                .getSharedPreferences(
                        "gps_state",
                        Context.MODE_PRIVATE
                )
                .edit()
                .remove("distance")
                .commit();

            }


            call.resolve();



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro resetando distância",
                    e
            );


            call.reject(
                    "Erro resetando distância"
            );
        }
    }




    @PluginMethod
    public void restoreState(
            PluginCall call
    ) {


        JSObject ret =
                new JSObject();


        try {


            NativeGpsService service =
                    NativeGpsService.getInstance();


            float distanceMeters = 0f;



            if(service != null) {


                distanceMeters =
                        service.getAccumulatedDistanceMeters();


            } else {


                android.content.SharedPreferences prefs =
                        getContext()
                        .getSharedPreferences(
                                "gps_state",
                                Context.MODE_PRIVATE
                        );


                distanceMeters =
                        prefs.getFloat(
                                "distance",
                                0f
                        );
            }



            ret.put(
                    "accumulatedDistance",
                    distanceMeters / 1000f
            );



            call.resolve(ret);



        } catch(Exception e) {


            Log.e(
                    TAG,
                    "Erro restaurando estado",
                    e
            );


            call.reject(
                    "Erro restaurando estado"
            );
        }
    }
        @PluginMethod
    public void getShiftState(
            PluginCall call
    ) {

        Context context =
                getContext();


        try (
            FileInputStream fis =
                    context.openFileInput(SHIFT_STATE_FILE);

            InputStreamReader inputStreamReader =
                    new InputStreamReader(fis);

            BufferedReader bufferedReader =
                    new BufferedReader(inputStreamReader)
        ) {


            StringBuilder stringBuilder =
                    new StringBuilder();


            String line;


            while (
                (line = bufferedReader.readLine())
                != null
            ) {

                stringBuilder.append(line);

            }


            JSObject json =
                    new JSObject(
                            stringBuilder.toString()
                    );


            call.resolve(json);



        } catch (
                IOException |
                JSONException e
        ) {


            call.resolve(null);

        }
    }




    @PluginMethod
    public void setShiftState(
            PluginCall call
    ) {

        Context context =
                getContext();


        try (
            FileOutputStream fos =
                    context.openFileOutput(
                            SHIFT_STATE_FILE,
                            Context.MODE_PRIVATE
                    )
        ) {


            fos.write(
                    call.getData()
                    .toString()
                    .getBytes()
            );


            call.resolve();



        } catch(IOException e) {


            call.reject(
                    "Error saving shift state",
                    e
            );

        }
    }




    @PluginMethod
    public void clearShiftState(
            PluginCall call
    ) {

        Context context =
                getContext();



        if(
            context.deleteFile(
                    SHIFT_STATE_FILE
            )
        ) {


            call.resolve();


        } else {


            File file =
                    new File(
                            context.getFilesDir(),
                            SHIFT_STATE_FILE
                    );


            if(!file.exists()) {


                call.resolve();


            } else {


                call.reject(
                        "Error deleting shift state file"
                );

            }
        }
    }




    @PluginMethod
    public void clearGpsLog(
            PluginCall call
    ) {


        Context context =
                getContext();



        if(
            context.deleteFile(
                    PENDING_LOCATIONS_FILE
            )
        ) {


            call.resolve();



        } else {


            File file =
                    new File(
                            context.getFilesDir(),
                            PENDING_LOCATIONS_FILE
                    );



            if(!file.exists()) {


                call.resolve();



            } else {


                call.reject(
                        "Error clearing GPS log"
                );

            }
        }
    }






    @PluginMethod
    public void canDrawOverlays(
            PluginCall call
    ) {


        JSObject ret =
                new JSObject();


        ret.put(
                "granted",
                Settings.canDrawOverlays(
                        getContext()
                )
        );


        call.resolve(ret);

    }





    @PluginMethod
    public void requestOverlayPermission(
            PluginCall call
    ) {


        if(
            Settings.canDrawOverlays(
                    getContext()
            )
        ) {


            JSObject ret =
                    new JSObject();


            ret.put(
                    "granted",
                    true
            );


            call.resolve(ret);


            return;
        }



        Intent intent =
                new Intent(
                        Settings.ACTION_MANAGE_OVERLAY_PERMISSION,
                        Uri.parse(
                                "package:"
                                +
                                getContext()
                                .getPackageName()
                        )
                );



        intent.addFlags(
                Intent.FLAG_ACTIVITY_NEW_TASK
        );


        getContext()
                .startActivity(intent);



        JSObject ret =
                new JSObject();


        ret.put(
                "granted",
                false
        );


        call.resolve(ret);

    }



@PluginMethod
public void showUberOverlay(
        PluginCall call
) {

    try {


        if(
            !Settings.canDrawOverlays(
                    getContext()
            )
        ) {

            call.reject(
                    "Permissão de overlay não concedida"
            );

            return;
        }



        JSObject trip =
                call.getData();



        if(trip == null) {

            call.reject(
                    "Dados da corrida não recebidos"
            );

            return;
        }



        Intent intent =
        new Intent(
                getContext(),
                UberOverlayService.class
        );



        intent.putExtra(
                "trip",
                trip.toString()
        );



        getContext()
                .startService(
                        intent
                );



        Log.d(
                TAG,
                "Solicitado overlay Uber"
        );



        call.resolve();



    } catch(Exception e) {


        Log.e(
                TAG,
                "Erro iniciando overlay Uber",
                e
        );


        call.reject(
                "Erro iniciando overlay Uber: "
                +
                e.getMessage()
        );

    }
}



@PluginMethod
public void hideUberOverlay(
        PluginCall call
) {

    try {


        Intent intent =
        new Intent(
                getContext(),
                UberOverlayService.class
        );


        intent.setAction(
                "HIDE_OVERLAY"
        );



        getContext()
                .startService(
                        intent
                );



        call.resolve();



    } catch(Exception e) {


        Log.e(
                TAG,
                "Erro removendo overlay Uber",
                e
        );


        call.reject(
                "Erro removendo overlay Uber"
        );

    }
}



    @PluginMethod
    public void showOverlay(
            PluginCall call
    ) {


        try {


            if(
                !Settings.canDrawOverlays(
                        getContext()
                )
            ) {


                call.reject(
                        "Permissão de overlay não concedida"
                );


                return;
            }



            Intent intent =
                    new Intent(
                            getContext(),
                            OverlayService.class
                    );



            getContext()
                    .stopService(intent);



            getContext()
                    .startService(intent);



            call.resolve();



        } catch(Exception e) {


            Log.e(
                    "OVERLAY_ERROR",
                    "Erro ao iniciar overlay",
                    e
            );


            call.reject(
                    "Erro: "
                    +
                    e.getMessage()
            );
        }
    }





    @PluginMethod
    public void hideOverlay(
            PluginCall call
    ) {


        try {


            Intent intent =
                    new Intent(
                            getContext(),
                            OverlayService.class
                    );


            getContext()
                    .stopService(intent);



            call.resolve();



        } catch(Exception e) {


            Log.e(
                    "OVERLAY_ERROR",
                    "Erro ao parar overlay",
                    e
            );


            call.reject(
                    "Erro: "
                    +
                    e.getMessage()
            );
        }
    }





    @Override
    protected void handleOnDestroy() {

        if (uberTripReceiver != null) {

    try {

        getContext().unregisterReceiver(
                uberTripReceiver
        );

    } catch (Exception ignored) {
    }
}

        super.handleOnDestroy();



        if(
            locationRepository != null
            &&
            locationObserver != null
        ) {


            getActivity()
            .runOnUiThread(() ->

                locationRepository
                .getLocationData()
                .removeObserver(
                        locationObserver
                )

            );

        }
    }
}