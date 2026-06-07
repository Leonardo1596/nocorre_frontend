package com.nocorre.app.gps;

import android.Manifest;
import android.content.Intent;
import android.location.Location;
import android.os.Build;

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
        ),
        @Permission(
            alias = "notifications",
            strings = { Manifest.permission.POST_NOTIFICATIONS }
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
                ret.put("speed", location.getSpeed());
                ret.put("accuracy", location.getAccuracy());
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
            requestPermissionForAlias("location", call, "permissionCallback");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permissionCallback");
            return;
        }

        startGpsService(call);
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission was denied.");
            return;
        }
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getPermissionState("notifications") != PermissionState.GRANTED) {
            call.reject("Notification permission is required for background GPS.");
            return;
        }
        startGpsService(call);
    }

    private void startGpsService(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            getContext().startForegroundService(serviceIntent);
        } else {
            getContext().startService(serviceIntent);
        }
        call.resolve();
    }

    @PluginMethod
    public void stopGps(PluginCall call) {
        Intent serviceIntent = new Intent(getContext(), NativeGpsService.class);
        getContext().stopService(serviceIntent);
        call.resolve();
    }

    @PluginMethod
    public void isGpsRunning(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("isRunning", NativeGpsService.isRunning);
        call.resolve(ret);
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
