package com.nocorre.app;

import android.content.ComponentName;
import android.content.Context;
import android.content.Intent;
import android.provider.Settings;
import android.text.TextUtils;
import android.util.Log;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.nocorre.app.accessibility.UberAccessibilityService;

@CapacitorPlugin(name = "Gps")
public class GpsPlugin extends Plugin {
    private static final String LOG_TAG = "GpsPlugin";

    @PluginMethod
    public void start(PluginCall call) {
        // Your start logic here
        call.resolve();
    }

    @PluginMethod
    public void stop(PluginCall call) {
        // Your stop logic here
        call.resolve();
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
        Log.d(LOG_TAG, "Checking for service: " + expectedComponentName.flattenToString());

        String enabledServicesSetting = Settings.Secure.getString(context.getContentResolver(), Settings.Secure.ENABLED_ACCESSIBILITY_SERVICES);
        Log.d(LOG_TAG, "Enabled services setting: " + enabledServicesSetting);

        if (enabledServicesSetting == null) {
            Log.d(LOG_TAG, "Enabled services setting is null. Service is disabled.");
            return false;
        }

        TextUtils.SimpleStringSplitter colonSplitter = new TextUtils.SimpleStringSplitter(':');
        colonSplitter.setString(enabledServicesSetting);

        while (colonSplitter.hasNext()) {
            String componentNameString = colonSplitter.next();
            Log.d(LOG_TAG, "Found enabled service component: " + componentNameString);
            ComponentName enabledComponentName = ComponentName.unflattenFromString(componentNameString);

            if (enabledComponentName != null && enabledComponentName.equals(expectedComponentName)) {
                Log.d(LOG_TAG, "Service is enabled!");
                return true;
            }
        }

        Log.d(LOG_TAG, "Service is disabled.");
        return false;
    }
}
