package com.nocorre.app.gps;

import android.Manifest;
import android.content.Context;
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
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

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
    public void restoreState(PluginCall call) {
        Context context = getContext();
        List<Location> locations = new ArrayList<>();
        try (
            FileInputStream fis = context.openFileInput(PENDING_LOCATIONS_FILE);
            InputStreamReader inputStreamReader = new InputStreamReader(fis);
            BufferedReader bufferedReader = new BufferedReader(inputStreamReader)
        ) {
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                String[] parts = line.split(",");
                if (parts.length >= 5) { // Ensure at least 5 parts
                    try {
                        Location location = new Location("fused");
                        location.setTime(Long.parseLong(parts[0]));
                        location.setLatitude(Double.parseDouble(parts[1]));
                        location.setLongitude(Double.parseDouble(parts[2]));
                        location.setSpeed(Float.parseFloat(parts[3]));
                        location.setAccuracy(Float.parseFloat(parts[4]));
                        locations.add(location);
                    } catch (NumberFormatException e) {
                        Log.e(TAG, "Error parsing location line: " + line, e);
                    }
                }
            }
        } catch (IOException e) {
            Log.d(TAG, "No pending locations to read or error reading file.", e);
        }

        float totalDistance = 0;
        if (locations.size() > 1) {
            for (int i = 0; i < locations.size() - 1; i++) {
                totalDistance += locations.get(i).distanceTo(locations.get(i + 1));
            }
        }

        JSObject ret = new JSObject();
        ret.put("accumulatedDistance", totalDistance / 1000.0);

        if (!locations.isEmpty()) {
            Location lastLocation = locations.get(locations.size() - 1);
            JSObject locationObj = new JSObject();
            locationObj.put("latitude", lastLocation.getLatitude());
            locationObj.put("longitude", lastLocation.getLongitude());
            locationObj.put("speed", lastLocation.getSpeed());
            locationObj.put("accuracy", lastLocation.getAccuracy());
            locationObj.put("time", lastLocation.getTime());
            ret.put("lastLocation", locationObj);
        }

        // Clear the file after processing
        try (FileOutputStream fos = context.openFileOutput(PENDING_LOCATIONS_FILE, Context.MODE_PRIVATE)) {
            // Overwriting with an empty string clears the file.
        } catch (IOException e) {
            Log.e(TAG, "Error clearing pending locations file", e);
        }
        
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
