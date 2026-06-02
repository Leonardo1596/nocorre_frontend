package com.nocorre.app;

import android.os.Bundle;

import com.getcapacitor.BridgeActivity;
import com.nocorre.app.gps.NativeGpsPlugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        registerPlugins(new ArrayList<Class<? extends com.getcapacitor.Plugin>>() {{ 
            add(NativeGpsPlugin.class);
        }});
    }
}
