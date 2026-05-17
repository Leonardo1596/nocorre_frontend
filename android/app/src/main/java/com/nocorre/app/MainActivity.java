package com.nocorre.app;

import com.getcapacitor.BridgeActivity;
import android.os.Bundle;
import com.nocorre.app.gps.GPSPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the GPSPlugin
        registerPlugin(GPSPlugin.class);
    }
}
