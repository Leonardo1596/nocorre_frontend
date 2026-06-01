package com.nocorre.app.gps;

import android.annotation.SuppressLint;
import android.content.Context;
import android.location.Location;
import android.os.Looper;
import android.util.Log;

import com.google.android.gms.location.FusedLocationProviderClient;
import com.google.android.gms.location.LocationCallback;
import com.google.android.gms.location.LocationRequest;
import com.google.android.gms.location.LocationResult;
import com.google.android.gms.location.LocationServices;
import com.google.android.gms.location.Priority;

public class FusedLocationManager {

    private final FusedLocationProviderClient fusedClient;

    private LocationCallback locationCallback;

    private Location lastLocation;

    public interface LocationListener {
        void onLocation(Location location);
    }

    public FusedLocationManager(Context context) {

        Log.d(
                "FUSED_GPS",
                "CONSTRUTOR EXECUTADO"
        );

        fusedClient =
                LocationServices.getFusedLocationProviderClient(context);
    }

    @SuppressLint("MissingPermission")
    public void start(LocationListener listener) {

        Log.d(
                "FUSED_GPS",
                "START EXECUTADO"
        );

        LocationRequest locationRequest =
                new LocationRequest.Builder(
                        Priority.PRIORITY_HIGH_ACCURACY,
                        1000
                )
                        .setMinUpdateIntervalMillis(1000)
                        .setMinUpdateDistanceMeters(3)
                        .setWaitForAccurateLocation(true)
                        .build();

        locationCallback =
                new LocationCallback() {

                    @Override
                    public void onLocationResult(
                            LocationResult result
                    ) {

                        if (result == null) {
                            return;
                        }

                        for (Location location :
                                result.getLocations()) {

                            float accuracy =
                                    location.getAccuracy();

                            Log.d(
                                    "FUSED_GPS",
                                    "LAT="
                                            + location.getLatitude()
                                            + " LNG="
                                            + location.getLongitude()
                                            + " ACC="
                                            + accuracy
                                            + " SPEED="
                                            + location.getSpeed()
                            );

                            // Ignora leituras muito ruins
                            if (accuracy > 30f) {

                                Log.d(
                                        "FUSED_GPS",
                                        "IGNORADA - ACCURACY RUIM: "
                                                + accuracy
                                );

                                continue;
                            }

                            // Primeira leitura válida
                            if (lastLocation == null) {

                                lastLocation = location;

                                Log.d(
                                        "FUSED_GPS",
                                        "PRIMEIRA LOCALIZACAO"
                                );

                                listener.onLocation(location);

                                continue;
                            }

                            float distance =
                                    lastLocation.distanceTo(location);

                            Log.d(
                                    "FUSED_GPS",
                                    "DISTANCIA = "
                                            + distance
                            );

                            // Ignora apenas pequenos ruídos
                            if (distance < 3f) {

                                Log.d(
                                        "FUSED_GPS",
                                        "IGNORADA - MOVIMENTO PEQUENO"
                                );

                                continue;
                            }

                            lastLocation = location;

                            Log.d(
                                    "FUSED_GPS",
                                    "LOCALIZACAO ACEITA"
                            );

                            listener.onLocation(location);
                        }
                    }
                };

        fusedClient.requestLocationUpdates(
                locationRequest,
                locationCallback,
                Looper.getMainLooper()
        );

        Log.d(
                "FUSED_GPS",
                "REQUEST ENVIADO"
        );
    }

    public void stop() {

        Log.d(
                "FUSED_GPS",
                "STOP EXECUTADO"
        );

        if (locationCallback != null) {

            fusedClient.removeLocationUpdates(
                    locationCallback
            );

            Log.d(
                    "FUSED_GPS",
                    "LOCATION UPDATES REMOVIDOS"
            );
        }
    }
}