package com.nocorre.app.gps;

import android.Manifest;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.util.Log;

import androidx.lifecycle.Observer;

import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;

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

    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";
    private static final String TAG = "NativeGpsPlugin";

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
        } else {
            permissionCallback(call);
        }
    }

    @PermissionCallback
    private void permissionCallback(PluginCall call) {
        if (getPermissionState("location") != PermissionState.GRANTED) {
            call.reject("Location permission is required to start GPS.");
            return;
        }

        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU && getPermissionState("notifications") != PermissionState.GRANTED) {
            requestPermissionForAlias("notifications", call, "permissionCallback");
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

     @PluginMethod
    public void getPendingLocations(PluginCall call) {
        try {
            File file = new File(getContext().getFilesDir(), PENDING_LOCATIONS_FILE);
            if (!file.exists()) {
                call.resolve(new JSObject().put("locations", new JSArray()));
                return;
            }

            FileInputStream fis = getContext().openFileInput(PENDING_LOCATIONS_FILE);
            InputStreamReader inputStreamReader = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader);
            JSArray locations = new JSArray();
            String line;

            while ((line = bufferedReader.readLine()) != null) {
                try {
                    String[] parts = line.split(",");
                    if (parts.length == 5) {
                        JSObject loc = new JSObject();
                        loc.put("time", Long.parseLong(parts[0]));
                        loc.put("latitude", Double.parseDouble(parts[1]));
                        loc.put("longitude", Double.parseDouble(parts[2]));
                        loc.put("speed", Float.parseFloat(parts[3]));
                        loc.put("accuracy", Float.parseFloat(parts[4]));
                        locations.put(loc);
                    }
                } catch (Exception e) {
                    Log.w(TAG, "Could not parse a line from the locations file", e);
                }
            }
            bufferedReader.close();

            // Clear the file after reading
            FileOutputStream fos = getContext().openFileOutput(PENDING_LOCATIONS_FILE, 0); // 0 = MODE_PRIVATE (overwrite)
            fos.close();

            JSObject ret = new JSObject();
            ret.put("locations", locations);
            call.resolve(ret);

        } catch (Exception e) {
            call.reject("Could not read pending locations", e);
            Log.e(TAG, "Could not read pending locations", e);
        }
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
