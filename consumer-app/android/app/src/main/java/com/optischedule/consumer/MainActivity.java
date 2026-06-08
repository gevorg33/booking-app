package com.optischedule.consumer;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
import com.optischedule.consumer.widget.HomeScreenWidgetPlugin;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(HomeScreenWidgetPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
