package com.nocorre.app.gps;

import android.Manifest;
import android.content.Intent;
import android.location.Location;

import androidx.lifecycle.Observer;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

@CapacitorPlugin(
    name = "NativeGps",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                Manifest.permission.ACCESS_COARSE_LOCATION,
                Manifest.permission.ACCESS_FINE_LOCATION
            }
        )
    }
)
public class NativeGpsPlugin extends Plugin {

    private LocationRepository locationRepository;
    private Observer<Location> locationObserver;

    @Override
    public void load() {
        super.load();

        locationRepository = LocationRepository.getInstance();

        locationObserver = location -> {
            if (location != null) {

                JSObject ret = new JSObject();

                ret.put("latitude", location.getLatitude());
                ret.put("longitude", location.getLongitude());
                ret.put("speed", location.getSpeed()); // Speed in meters/second
                ret.put("accuracy", location.getAccuracy()); // Horizontal accuracy in meters

                notifyListeners("locationUpdate", ret, true);
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

        if (getPermissionState("location") != PermissionState.GRANTED) {
            requestPermissionForAlias("location", call, "locationPermissionCallback");
            return;
        }

        startGpsService(call);
    }

    @PermissionCallback
    private void locationPermissionCallback(PluginCall call) {
        if (getPermissionState("location") == PermissionState.GRANTED) {
            startGpsService(call);
        } else {
            call.reject("Location permission was denied.");
        }
    }

    private void startGpsService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        getContext().startService(serviceIntent);
        call.resolve();
    }

    @PluginMethod
    public void stopGps(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }

    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (locationRepository != null && locationObserver != null) {
            getActivity().runOnUiThread(() ->
                locationRepository
                    .getLocationData()
                    .removeObserver(locationObserver)
            );
        }
    }
}
