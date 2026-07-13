package com.nocorre.app.gps;

import android.Manifest;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import androidx.activity.result.ActivityResult;
import androidx.core.content.ContextCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.ActivityCallback;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "Gps",
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
public class GpsPlugin extends Plugin {

    private static final String PREFS_NAME = "gps_state";
    private static final String KEY_DISTANCE = "distance";

    @PluginMethod
    public void start(PluginCall call) {

        if (!hasRequiredPermissions()) {

            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
                requestPermissionForAlias(
                        "notifications",
                        call,
                        "onNotificationPermissionResult"
                );
            } else {
                requestPermissionForAlias(
                        "location",
                        call,
                        "onLocationPermissionResult"
                );
            }

        } else {
            startService(call);
        }
    }

    @ActivityCallback
    private void onLocationPermissionResult(
            PluginCall call,
            ActivityResult result
    ) {

        if (call != null && hasRequiredPermissions()) {
            startService(call);
        } else if (call != null) {
            call.reject("Location permission was not granted.");
        }
    }

    @ActivityCallback
    private void onNotificationPermissionResult(
            PluginCall call,
            ActivityResult result
    ) {

        if (call != null && hasRequiredPermissions()) {
            startService(call);
        } else if (call != null) {
            call.reject("Notification permission was not granted.");
        }
    }

    @PluginMethod
    public void stop(PluginCall call) {

        Intent serviceIntent =
                new Intent(getContext(), NativeGpsService.class);

        getContext().stopService(serviceIntent);

        call.resolve();
    }

    @PluginMethod
    public void isGpsRunning(PluginCall call) {

        JSObject ret = new JSObject();
        ret.put("isRunning", NativeGpsService.isRunning);

        call.resolve(ret);
    }

    @PluginMethod
    public void clearDistance(PluginCall call) {

        SharedPreferences prefs =
                getContext().getSharedPreferences(
                        PREFS_NAME,
                        getContext().MODE_PRIVATE
                );

        prefs.edit()
                .remove(KEY_DISTANCE)
                .apply();

        NativeGpsService service = NativeGpsService.getInstance();

        if (service != null) {
            service.resetDistance();
        }

        call.resolve();
    }

    private void startService(PluginCall call) {

        Intent serviceIntent =
                new Intent(getContext(), NativeGpsService.class);

        ContextCompat.startForegroundService(
                getContext(),
                serviceIntent
        );

        call.resolve();
    }
}