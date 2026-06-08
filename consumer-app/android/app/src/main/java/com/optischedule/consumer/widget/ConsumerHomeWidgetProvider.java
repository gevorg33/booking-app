package com.optischedule.consumer.widget;

import android.app.PendingIntent;
import android.appwidget.AppWidgetManager;
import android.appwidget.AppWidgetProvider;
import android.content.Context;
import android.content.Intent;
import android.net.Uri;
import android.view.View;
import android.widget.RemoteViews;
import com.optischedule.consumer.MainActivity;
import com.optischedule.consumer.R;
import org.json.JSONObject;

/** Home-screen widget — next appointment + quick rebook (adopt-4.7). */
public class ConsumerHomeWidgetProvider extends AppWidgetProvider {
    @Override
    public void onUpdate(Context context, AppWidgetManager manager, int[] appWidgetIds) {
        String raw = WidgetSharedStore.loadSnapshotJson(context);
        for (int widgetId : appWidgetIds) {
            manager.updateAppWidget(widgetId, buildRemoteViews(context, raw));
        }
    }

    static RemoteViews buildRemoteViews(Context context, String rawJson) {
        RemoteViews views = new RemoteViews(context.getPackageName(), R.layout.widget_consumer_home);

        try {
            if (rawJson == null || rawJson.trim().isEmpty()) {
                bindEmpty(views, context, "optischedule://book");
                return views;
            }

            JSONObject snapshot = new JSONObject(rawJson);
            String businessName = snapshot.optString("businessName", "OptiSchedule");
            views.setTextViewText(R.id.widget_business_name, businessName);

            boolean authed = snapshot.optBoolean("authed", false);
            if (!authed) {
                JSONObject signedOut = snapshot.optJSONObject("signedOut");
                if (signedOut != null) {
                    views.setViewVisibility(R.id.widget_next_block, View.VISIBLE);
                    views.setTextViewText(R.id.widget_next_title, signedOut.optString("title", ""));
                    views.setTextViewText(R.id.widget_next_service, signedOut.optString("subtitle", ""));
                    views.setTextViewText(R.id.widget_next_subtitle, "");
                    bindTap(context, views, R.id.widget_next_block, signedOut.optString("deepLinkUrl", "optischedule://book"));
                } else {
                    bindEmpty(views, context, "optischedule://book");
                }
                views.setViewVisibility(R.id.widget_rebook_block, View.GONE);
                return views;
            }

            JSONObject next = snapshot.optJSONObject("nextAppointment");
            if (next != null) {
                views.setViewVisibility(R.id.widget_next_block, View.VISIBLE);
                views.setTextViewText(R.id.widget_next_title, next.optString("title", ""));
                views.setTextViewText(R.id.widget_next_service, next.optString("serviceName", ""));
                views.setTextViewText(R.id.widget_next_subtitle, next.optString("subtitle", ""));
                bindTap(context, views, R.id.widget_next_block, next.optString("deepLinkUrl", "optischedule://book"));
            } else {
                views.setViewVisibility(R.id.widget_next_block, View.GONE);
            }

            JSONObject rebook = snapshot.optJSONObject("quickRebook");
            if (rebook != null) {
                views.setViewVisibility(R.id.widget_rebook_block, View.VISIBLE);
                views.setTextViewText(R.id.widget_rebook_title, rebook.optString("title", ""));
                views.setTextViewText(R.id.widget_rebook_service, rebook.optString("serviceName", ""));
                views.setTextViewText(R.id.widget_rebook_subtitle, rebook.optString("subtitle", ""));
                bindTap(context, views, R.id.widget_rebook_block, rebook.optString("deepLinkUrl", "optischedule://book"));
            } else {
                views.setViewVisibility(R.id.widget_rebook_block, View.GONE);
            }

            if (next == null && rebook == null) {
                views.setViewVisibility(R.id.widget_next_block, View.VISIBLE);
                views.setTextViewText(R.id.widget_next_title, "No upcoming visits");
                views.setTextViewText(R.id.widget_next_service, "");
                views.setTextViewText(R.id.widget_next_subtitle, "");
                String slug = snapshot.optString("slug", "");
                bindTap(context, views, R.id.widget_next_block, slug.isEmpty() ? "optischedule://book" : "optischedule://book/" + slug);
            }
        } catch (Exception ignored) {
            bindEmpty(views, context, "optischedule://book");
        }

        return views;
    }

    private static void bindEmpty(RemoteViews views, Context context, String url) {
        views.setTextViewText(R.id.widget_business_name, "OptiSchedule");
        views.setViewVisibility(R.id.widget_next_block, View.VISIBLE);
        views.setTextViewText(R.id.widget_next_title, "Open OptiSchedule");
        views.setTextViewText(R.id.widget_next_service, "Sign in to see appointments");
        views.setTextViewText(R.id.widget_next_subtitle, "");
        views.setViewVisibility(R.id.widget_rebook_block, View.GONE);
        bindTap(context, views, R.id.widget_next_block, url);
    }

    private static void bindTap(Context context, RemoteViews views, int viewId, String url) {
        Intent intent = new Intent(context, MainActivity.class);
        intent.setData(Uri.parse(url));
        intent.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        PendingIntent pending = PendingIntent.getActivity(
                context,
                viewId,
                intent,
                PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE
        );
        views.setOnClickPendingIntent(viewId, pending);
    }
}
