package com.harira.app;

import android.app.Activity;
import android.content.ActivityNotFoundException;
import android.content.ContentValues;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.MediaStore;
import android.view.Gravity;
import android.view.View;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.FrameLayout;
import android.widget.ImageView;
import android.widget.LinearLayout;
import android.widget.TextView;
import android.widget.Toast;

// تطبيق حريره: غلاف يفتح الموقع، فأي تحديث على الموقع بيوصل للتطبيق مباشرة
public class MainActivity extends Activity {
    static final String HOME = "https://mohamedfayzyasenalsabagh-create.github.io/harira/";
    static final String HOST = "mohamedfayzyasenalsabagh-create.github.io";
    static final int FILE_REQ = 7;
    WebView web;
    ValueCallback<Uri[]> fileCb;
    Uri cameraUri;
    View splash;

    @Override
    protected void onCreate(Bundle b) {
        super.onCreate(b);
        web = new WebView(this);
        FrameLayout root = new FrameLayout(this);
        root.addView(web);
        splash = buildSplash();
        root.addView(splash);
        setContentView(root);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setAllowFileAccess(false);
        s.setCacheMode(WebSettings.LOAD_DEFAULT);
        s.setUserAgentString(s.getUserAgentString() + " HariraApp/1");

        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView v, WebResourceRequest r) {
                Uri u = r.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); }
                catch (ActivityNotFoundException e) { Toast.makeText(MainActivity.this, "ما في تطبيق يفتح هالرابط", Toast.LENGTH_SHORT).show(); }
                return true;
            }
            @Override
            public void onPageFinished(WebView v, String url) { hideSplash(); }
            @Override
            public void onReceivedError(WebView v, WebResourceRequest r, WebResourceError e) {
                // أول فتح بدون إنترنت وبدون نسخة محفوظة
                if (r.isForMainFrame()) {
                    hideSplash();
                    v.loadData("<html dir='rtl'><body style='font-family:sans-serif;text-align:center;padding:48px 24px;color:#1E2A20;background:#F4F5EF'>"
                        + "<h2 style='color:#2F5D3A'>ما في إنترنت</h2><p>أول مرة بيحتاج التطبيق إنترنت ليتحمّل، وبعدها بيشتغل بدونه.</p>"
                        + "<button style='padding:12px 24px;border-radius:14px;border:0;background:#2F5D3A;color:#fff;font-size:16px' onclick=\"location.href='" + HOME + "'\">جرّب مرة تانية</button></body></html>",
                        "text/html; charset=utf-8", "UTF-8");
                }
            }
        });

        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams p) {
                if (fileCb != null) fileCb.onReceiveValue(null);
                fileCb = cb;
                cameraUri = null;
                Intent camera = p.isCaptureEnabled() ? cameraIntent() : null;
                Intent i;
                if (camera != null) {
                    i = camera; // زر "صوّر"
                } else {
                    i = p.createIntent(); // زر "اختار من المعرض"
                    i.setType("image/*");
                }
                try {
                    startActivityForResult(i, FILE_REQ);
                } catch (ActivityNotFoundException e) {
                    try { startActivityForResult(p.createIntent(), FILE_REQ); }
                    catch (ActivityNotFoundException e2) { fileCb = null; return false; }
                }
                return true;
            }
        });

        if (b != null) web.restoreState(b); else web.loadUrl(HOME);
        web.postDelayed(this::hideSplash, 8000);
    }

    // الكاميرا تحفظ الصورة بكامل دقتها بالمعرض (أندرويد 10 وأحدث لا يحتاج أذونات)
    Intent cameraIntent() {
        if (Build.VERSION.SDK_INT < 29) return null;
        Intent c = new Intent(MediaStore.ACTION_IMAGE_CAPTURE);
        if (c.resolveActivity(getPackageManager()) == null) return null;
        try {
            ContentValues cv = new ContentValues();
            cv.put(MediaStore.Images.Media.DISPLAY_NAME, "harira_" + System.currentTimeMillis() + ".jpg");
            cv.put(MediaStore.Images.Media.MIME_TYPE, "image/jpeg");
            cv.put(MediaStore.Images.Media.RELATIVE_PATH, "Pictures/Harira");
            cameraUri = getContentResolver().insert(MediaStore.Images.Media.EXTERNAL_CONTENT_URI, cv);
        } catch (Exception e) { cameraUri = null; }
        if (cameraUri == null) return null;
        c.putExtra(MediaStore.EXTRA_OUTPUT, cameraUri);
        c.addFlags(Intent.FLAG_GRANT_WRITE_URI_PERMISSION | Intent.FLAG_GRANT_READ_URI_PERMISSION);
        return c;
    }

    @Override
    protected void onActivityResult(int req, int res, Intent data) {
        if (req == FILE_REQ && fileCb != null) {
            Uri[] out = null;
            if (res == RESULT_OK) {
                if (data != null && data.getData() != null) out = new Uri[]{data.getData()};
                else if (data != null && data.getClipData() != null) out = new Uri[]{data.getClipData().getItemAt(0).getUri()};
                else if (cameraUri != null) out = new Uri[]{cameraUri};
            }
            if (out == null && cameraUri != null) {
                try { getContentResolver().delete(cameraUri, null, null); } catch (Exception ignored) {}
            }
            fileCb.onReceiveValue(out);
            fileCb = null;
            cameraUri = null;
            return;
        }
        super.onActivityResult(req, res, data);
    }

    View buildSplash() {
        LinearLayout l = new LinearLayout(this);
        l.setOrientation(LinearLayout.VERTICAL);
        l.setGravity(Gravity.CENTER);
        l.setBackgroundColor(Color.parseColor("#2F5D3A"));
        ImageView ic = new ImageView(this);
        ic.setImageResource(R.mipmap.ic_launcher);
        int px = (int) (110 * getResources().getDisplayMetrics().density);
        l.addView(ic, new LinearLayout.LayoutParams(px, px));
        TextView t = new TextView(this);
        t.setText("حريره");
        t.setTextColor(Color.WHITE);
        t.setTextSize(30);
        t.setTypeface(Typeface.DEFAULT_BOLD);
        t.setGravity(Gravity.CENTER);
        t.setPadding(0, 24, 0, 0);
        l.addView(t);
        return l;
    }

    void hideSplash() {
        if (splash != null && splash.getVisibility() == View.VISIBLE) {
            splash.animate().alpha(0f).setDuration(250).withEndAction(() -> splash.setVisibility(View.GONE));
        }
    }

    @Override
    protected void onSaveInstanceState(Bundle o) { super.onSaveInstanceState(o); web.saveState(o); }

    @Override
    public void onBackPressed() {
        if (web.canGoBack()) web.goBack(); else super.onBackPressed();
    }
}
