package com.nocorre.app;

import android.os.Bundle;
import android.util.Log;

import com.getcapacitor.BridgeActivity;
import com.nocorre.app.gps.NativeGpsPlugin;
import com.nocorre.app.plugin.OverlayPermissionPlugin;
import com.nocorre.app.plugin.UberAccessibilityPlugin;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {

        Log.d("NOCORRE_TEST", "ANTES REGISTER");

        registerPlugin(NativeGpsPlugin.class);
        registerPlugin(UberAccessibilityPlugin.class);
        registerPlugin(OverlayPermissionPlugin.class);

        Log.d("NOCORRE_TEST", "DEPOIS REGISTER");

        super.onCreate(savedInstanceState);

        Log.d("NOCORRE_TEST", "DEPOIS SUPER");
    }
}