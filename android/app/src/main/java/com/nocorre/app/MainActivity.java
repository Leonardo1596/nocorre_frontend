package com.nocorre.app;

import android.os.Bundle;
import android.webkit.WebSettings;

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Register the custom ForegroundServicePlugin
        registerPlugin(ForegroundServicePlugin.class);

        // This ensures the WebView does not scale with the system's font size.
        // It is the definitive fix for the UI scaling issue.
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebSettings webSettings = getBridge().getWebView().getSettings();
            webSettings.setTextZoom(100);
            webSettings.setBuiltInZoomControls(false);
            webSettings.setDisplayZoomControls(false);
            webSettings.setSupportZoom(false);
        }
    }
}
