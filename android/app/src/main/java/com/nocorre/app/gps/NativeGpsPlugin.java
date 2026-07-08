package com.nocorre.app.gps;

import android.Manifest;
import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.location.Location;
import android.os.Build;
import android.provider.Settings;
import android.text.TextUtils;
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
import com.nocorre.app.accessibility.UberAccessibilityService;

import org.json.JSONException;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.io.InputStreamReader;
import java.util.ArrayList;
import java.util.List;

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
            strings = { Manifest.permission.POST_NOTIFICATIONS }
        )
    }
)
public class NativeGpsPlugin extends Plugin {

    private static final String PENDING_LOCATIONS_FILE = "gps_pending_locations.log";
    private static final String SHIFT_STATE_FILE = "shift_state.json";
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
        
        call.resolve(ret);
    }

    @PluginMethod
    public void getShiftState(PluginCall call) {
        Context context = getContext();
        try (FileInputStream fis = context.openFileInput(SHIFT_STATE_FILE); InputStreamReader inputStreamReader = new InputStreamReader(fis); BufferedReader bufferedReader = new BufferedReader(inputStreamReader)) {
            StringBuilder stringBuilder = new StringBuilder();
            String line;
            while ((line = bufferedReader.readLine()) != null) {
                stringBuilder.append(line);
            }
            JSObject json = new JSObject(stringBuilder.toString());
            call.resolve(json);
        } catch (IOException | JSONException e) {
            call.resolve(null);
        }
    }

    @PluginMethod
    public void setShiftState(PluginCall call) {
        Context context = getContext();
        try (FileOutputStream fos = context.openFileOutput(SHIFT_STATE_FILE, Context.MODE_PRIVATE)) {
            fos.write(call.getData().toString().getBytes());
            call.resolve();
        } catch (IOException e) {
            call.reject("Error saving shift state", e);
        }
    }

    @PluginMethod
    public void clearShiftState(PluginCall call) {
        Context context = getContext();
        if (context.deleteFile(SHIFT_STATE_FILE)) {
            call.resolve();
        } else {
            File file = new File(context.getFilesDir(), SHIFT_STATE_FILE);
            if (!file.exists()) {
                call.resolve();
            } else {
                call.reject("Error deleting shift state file");
            }
        }
    }

    @PluginMethod
    public void clearGpsLog(PluginCall call) {
        Context context = getContext();
        if (context.deleteFile(PENDING_LOCATIONS_FILE)) {
            call.resolve();
        } else {
            File file = new File(context.getFilesDir(), PENDING_LOCATIONS_FILE);
            if (!file.exists()) {
                call.resolve();
            } else {
                call.reject("Error clearing GPS log");
            }
        }
    }

    @PluginMethod
    public void isAccessibilityServiceEnabled(PluginCall call) {
        JSObject ret = new JSObject();
        boolean isEnabled = isAccessibilityServiceEnabled(getContext(), UberAccessibilityService.class);
        ret.put("isEnabled", isEnabled);
        call.resolve(ret);
    }

    @PluginMethod
    public void openAccessibilitySettings(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        getContext().startActivity(intent);
        call.resolve();
    }

    private boolean isAccessibilityServiceEnabled(Context context, Class<?> accessibilityService) {
        ComponentName expectedComponentName = new ComponentName(context, accessibilityService);
        Log.d(TAG, "Checking for service: " + expectedComponentName.flattenToString());

        String enabledServicesSetting = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        Log.d(TAG, "Enabled services setting: " + enabledServicesSetting);

        if (enabledServicesSetting == null) {
            Log.d(TAG, "Enabled services setting is null. Service is disabled.");
            return false;
        }

        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);

        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            Log.d(TAG, "Found enabled service component: " + componentNameString);
            ComponentName enabledComponentName = ComponentName.unflattenFromString(componentNameString);

            if (enabledComponentName != null && enabledComponentName.equals(expectedComponentName)) {
                Log.d(TAG, "Service is enabled!");
                return true;
            }
        }

        Log.d(TAG, "Service is disabled.");
        return false;
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
