package com.nocorre.app.plugin;

import android.content.Intent;
import android.provider.Settings;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "UberAccessibility")
public class UberAccessibilityPlugin extends Plugin {

    @PluginMethod
    public void checkStatus(PluginCall call) {
        // Implementation to check if the service is enabled
        call.resolve();
    }

    @PluginMethod
    public void requestActivation(PluginCall call) {
        Intent intent = new Intent(Settings.ACTION_ACCESSIBILITY_SETTINGS);
        getContext().startActivity(intent);
        call.resolve();
    }
}
