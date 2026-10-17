package com.harira.app;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;

import org.json.JSONArray;
import org.json.JSONObject;

// تذكيرات المي والوجبات والوزن والنصيحة اليومية: بتنجدول على الموبايل وبتشتغل حتى لو التطبيق مسكّر
public class Reminders extends BroadcastReceiver {
    static final String PREFS = "harira_reminders";
    static final String CHANNEL = "reminders";

    static PendingIntent pending(Context c, String id, String title, String body) {
        Intent i = new Intent(c, Reminders.class);
        i.setAction("com.harira.app.REMIND");
        i.putExtra("id", id);
        i.putExtra("title", title);
        i.putExtra("body", body);
        return PendingIntent.getBroadcast(c, id.hashCode(), i, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
    }

    // بيستبدل كل التذكيرات القديمة بالقائمة الجديدة
    static void setAll(Context c, String json) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        try {
            JSONArray old = new JSONArray(sp.getString("list", "[]"));
            for (int k = 0; k < old.length(); k++) am.cancel(pending(c, old.getJSONObject(k).getString("id"), "", ""));
        } catch (Exception ignored) {}
        sp.edit().putString("list", json == null ? "[]" : json).apply();
        scheduleSaved(c);
    }

    static void scheduleSaved(Context c) {
        AlarmManager am = (AlarmManager) c.getSystemService(Context.ALARM_SERVICE);
        SharedPreferences sp = c.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
        long now = System.currentTimeMillis();
        try {
            JSONArray arr = new JSONArray(sp.getString("list", "[]"));
            for (int k = 0; k < arr.length(); k++) {
                JSONObject o = arr.getJSONObject(k);
                long at = o.getLong("at");
                if (at <= now) continue;
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, at, pending(c, o.getString("id"), o.optString("title"), o.optString("body")));
            }
        } catch (Exception ignored) {}
    }

    @Override
    public void onReceive(Context c, Intent intent) {
        String a = intent.getAction();
        if (Intent.ACTION_BOOT_COMPLETED.equals(a) || "android.intent.action.MY_PACKAGE_REPLACED".equals(a)) { scheduleSaved(c); return; }
        show(c, intent.getStringExtra("id"), intent.getStringExtra("title"), intent.getStringExtra("body"));
    }

    static void show(Context c, String id, String title, String body) {
        NotificationManager nm = (NotificationManager) c.getSystemService(Context.NOTIFICATION_SERVICE);
        if (Build.VERSION.SDK_INT >= 26 && nm.getNotificationChannel(CHANNEL) == null) {
            nm.createNotificationChannel(new NotificationChannel(CHANNEL, "تذكيرات حريره", NotificationManager.IMPORTANCE_DEFAULT));
        }
        Intent open = new Intent(c, MainActivity.class);
        open.setFlags(Intent.FLAG_ACTIVITY_NEW_TASK | Intent.FLAG_ACTIVITY_CLEAR_TOP | Intent.FLAG_ACTIVITY_SINGLE_TOP);
        PendingIntent pi = PendingIntent.getActivity(c, id == null ? 0 : id.hashCode(), open, PendingIntent.FLAG_UPDATE_CURRENT | PendingIntent.FLAG_IMMUTABLE);
        Notification.Builder nb = Build.VERSION.SDK_INT >= 26 ? new Notification.Builder(c, CHANNEL) : new Notification.Builder(c);
        nb.setSmallIcon(R.drawable.ic_stat).setColor(0xFF2F5D3A).setContentTitle(title).setContentText(body)
          .setStyle(new Notification.BigTextStyle().bigText(body)).setAutoCancel(true).setContentIntent(pi);
        try { nm.notify(id == null ? 1 : id.hashCode(), nb.build()); } catch (SecurityException ignored) {}
    }
}
