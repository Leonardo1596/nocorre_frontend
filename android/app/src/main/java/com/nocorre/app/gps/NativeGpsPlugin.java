package com.nocorre.app.gps;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import androidx.localbroadcastmanager.content.LocalBroadcastManager;
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

    private LocationReceiver locationReceiver;

    @Override
    public void load() {
        super.load();
        locationReceiver = new LocationReceiver();
        LocalBroadcastManager.getInstance(getContext()).registerReceiver(
            locationReceiver,
            new IntentFilter(NativeGpsService.ACTION_LOCATION_BROADCAST)
        );
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
    
    @Override
    protected void handleOnDestroy() {
        super.handleOnDestroy();
        if (locationReceiver != null) {
            LocalBroadcastManager.getInstance(getContext()).unregisterReceiver(locationReceiver);
        }
    }

    private class LocationReceiver extends BroadcastReceiver {
        @Override
        public void onReceive(Context context, Intent intent) {
            if (intent != null && NativeGpsService.ACTION_LOCATION_BROADCAST.equals(intent.getAction())) {
                double latitude = intent.getDoubleExtra(NativeGpsService.EXTRA_LATITUDE, 0);
                double longitude = intent.getDoubleExtra(NativeGpsService.EXTRA_LONGITUDE, 0);

                JSObject ret = new JSObject();
                ret.put("latitude", latitude);
                ret.put("longitude", longitude);
                notifyListeners("locationUpdate", ret, true);
            }
        }
    }
}
