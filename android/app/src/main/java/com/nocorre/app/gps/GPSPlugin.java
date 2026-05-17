package com.nocorre.app.gps;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;

@CapacitorPlugin(
    name = "MyGPS",
    permissions = {
        @Permission(
            alias = "location",
            strings = {
                android.Manifest.permission.ACCESS_COARSE_LOCATION,
                android.Manifest.permission.ACCESS_FINE_LOCATION
            }
        )
    }
)
public class GPSPlugin extends Plugin {

    private GPSManager implementation;

    @Override
    public void load() {
        implementation = new GPSManager(getContext(), this::onLocationUpdate, this::onGpsStatusChange);
    }

    @PluginMethod
    public void startLocationUpdates(PluginCall call) {
        if (!getPermissionState("location").equals("granted")) {
            requestPermissionForAlias("location", call, "locationPermsCallback");
        } else {
            implementation.startLocationUpdates();
            call.resolve();
        }
    }

    @PluginMethod
    public void stopLocationUpdates(PluginCall call) {
        implementation.stopLocationUpdates();
        call.resolve();
    }

    @PluginMethod
    public void getGpsStatus(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("status", implementation.getGpsStatus());
        call.resolve(ret);
    }

    @PluginMethod
    public void getLastLocation(PluginCall call) {
        android.location.Location location = implementation.getLastLocation();
        if (location != null) {
            JSObject ret = new JSObject();
            ret.put("latitude", location.getLatitude());
            ret.put("longitude", location.getLongitude());
            call.resolve(ret);
        } else {
            call.reject("No location available.");
        }
    }

    private void onLocationUpdate(android.location.Location location) {
        JSObject ret = new JSObject();
        ret.put("latitude", location.getLatitude());
        ret.put("longitude", location.getLongitude());
        notifyListeners("locationUpdate", ret);
    }

    private void onGpsStatusChange(String status) {
        JSObject ret = new JSObject();
        ret.put("status", status);
        notifyListeners("gpsStatusChange", ret);
    }
}
