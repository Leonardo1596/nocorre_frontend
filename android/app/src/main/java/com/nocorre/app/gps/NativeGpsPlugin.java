package com.nocorre.app.gps;

import android.content.Intent;
import android.Manifest;
import android.content.pm.PackageManager;
import androidx.core.content.ContextCompat;
import androidx.core.app.ActivityCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;


@CapacitorPlugin(
    name = "NativeGps",
    permissions = {
        @Permission(
            alias = "location",
            strings = { Manifest.permission.ACCESS_COARSE_LOCATION, Manifest.permission.ACCESS_FINE_LOCATION }
        )
    }
)
public class NativeGpsPlugin extends Plugin {

    public static Plugin plugin;

    @Override
    public void load() {
        plugin = this;
    }

    @PluginMethod
    public void startGps(PluginCall call) {
        if (ContextCompat.checkSelfPermission(getContext(), Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            ActivityCompat.requestPermissions(getActivity(), new String[]{Manifest.permission.ACCESS_FINE_LOCATION}, 1);
            call.reject("Location permission not granted.");
            return;
        }

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

    public static void onLocationUpdate(double latitude, double longitude) {
        if (plugin != null) {
            JSObject ret = new JSObject();
            ret.put("latitude", latitude);
            ret.put("longitude", longitude);
            plugin.notifyListeners("locationUpdate", ret, true);
        }
    }
}
