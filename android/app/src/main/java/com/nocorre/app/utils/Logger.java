package com.nocorre.app.utils;

import android.util.Log;

public class Logger {

    public static void d(String tag, String message) {
        Log.d(tag, message);
    }

    public static void e(String tag, String message) {
        Log.e(tag, message);
    }

    public static void e(String tag, String message, Throwable tr) {
        Log.e(tag, message, tr);
    }

    public static void i(String tag, String message) {
        Log.i(tag, message);
    }

    public static void v(String tag, String message) {
        Log.v(tag, message);
    }

    public static void w(String tag, String message) {
        Log.w(tag, message);
    }
}
