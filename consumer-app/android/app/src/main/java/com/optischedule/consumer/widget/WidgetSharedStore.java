package com.optischedule.consumer.widget;

import android.content.Context;
import android.content.SharedPreferences;

/** Shared JSON snapshot written by the Capacitor plugin (adopt-4.7). */
public final class WidgetSharedStore {
    public static final String PREFS_NAME = "com.optischedule.consumer.widget";
    public static final String SNAPSHOT_KEY = "home_screen_widget_snapshot";

    private WidgetSharedStore() {}

    public static SharedPreferences prefs(Context context) {
        return context.getApplicationContext()
                .getSharedPreferences(PREFS_NAME, Context.MODE_PRIVATE);
    }

    public static void saveSnapshotJson(Context context, String json) {
        prefs(context).edit().putString(SNAPSHOT_KEY, json).apply();
    }

    public static String loadSnapshotJson(Context context) {
        return prefs(context).getString(SNAPSHOT_KEY, null);
    }
}
