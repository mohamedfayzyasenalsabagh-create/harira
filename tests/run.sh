#!/bin/bash
# تجربة التطبيق على جوال افتراضي: تنزيل APK من الرابط العام، تثبيته، فتحه، وتصوير الشاشات
set -u
OUT=.results; mkdir -p $OUT; R=$OUT/result.txt; : > $R
ok(){ echo "PASS | $1" | tee -a $R; }; bad(){ echo "FAIL | $1" | tee -a $R; }
shot(){ adb exec-out screencap -p > $OUT/$1.png; }
curl -sSL -o harira.apk https://github.com/mohamedfayzyasenalsabagh-create/harira/releases/latest/download/harira.apk && ok "تنزيل من الرابط العام ($(stat -c%s harira.apk) بايت)" || bad "تنزيل من الرابط العام"
curl -sS -o /dev/null -w "%{http_code}" https://mohamedfayzyasenalsabagh-create.github.io/harira/ > $OUT/site.txt; echo "الموقع: $(cat $OUT/site.txt)" | tee -a $R
adb install -r harira.apk > $OUT/install.txt 2>&1 && ok "تثبيت التطبيق" || bad "تثبيت التطبيق: $(cat $OUT/install.txt)"
echo "شبكة الجوال الافتراضي:" >> $R; adb shell ping -c 2 -W 3 8.8.8.8 >> $R 2>&1; adb shell ping -c 1 -W 3 github.io >> $R 2>&1
adb logcat -c
adb shell am start -n com.harira.app/.MainActivity >/dev/null; sleep 20; shot 1a-home-20s; sleep 40; shot 1-home-60s
adb shell dumpsys activity activities | grep -q "com.harira.app/.MainActivity" && ok "فتح التطبيق" || bad "فتح التطبيق"
# تجربة الكاميرا مع خيار "لا تحتفظ بالأنشطة" (متل موبايل ذاكرته قليلة بيسكّر التطبيق بالخلفية)
adb shell settings put global always_finish_activities 1
adb shell am force-stop com.harira.app; adb shell am start -n com.harira.app/.MainActivity >/dev/null; sleep 25
W0=$(adb shell wm size | grep -o '[0-9]*x[0-9]*' | tail -1); X0=${W0%x*}; Y0=${W0#*x}
adb shell input tap $((X0/6)) $((Y0-Y0/20)); sleep 3; shot c1-photo-tab
adb shell input tap $((X0*70/100)) $((Y0*31/100)); sleep 6; shot c2-camera
adb shell input keyevent 27; sleep 5; shot c3-after-shutter
adb shell uiautomator dump /sdcard/ui.xml >/dev/null 2>&1; adb pull /sdcard/ui.xml $OUT/ui-camera.xml >/dev/null 2>&1
# زر التأكيد بتطبيق الكاميرا: منلاقيه من شجرة الواجهة
B=$(grep -o 'resource-id="[^"]*\(done\|confirm\|ok\|shutter\)[^"]*"[^>]*bounds="\[[0-9]*,[0-9]*\]\[[0-9]*,[0-9]*\]"' $OUT/ui-camera.xml | grep -iv shutter | head -1 | grep -o 'bounds="[^"]*"' | grep -o '[0-9]*' | tr '\n' ' ')
echo "confirm bounds: $B" >> $R
if [ -n "$B" ]; then set -- $B; adb shell input tap $((($1+$3)/2)) $((($2+$4)/2)); fi
sleep 25; shot c4-back-in-app
adb shell settings put global always_finish_activities 0
# تبويب أضف أكلة (الوسط تقريباً بأسفل الشاشة)
W=$(adb shell wm size | grep -o '[0-9]*x[0-9]*' | tail -1); X=${W%x*}; Y=${W#*x}
adb shell input tap $((X/2)) $((Y-Y/20)); sleep 4; shot 2-add
adb shell input tap $((X/2)) $((Y*3/10)); sleep 3; shot 3-sheet
adb logcat -d | grep -iE "chromium|cr_|harira|AndroidRuntime|WebView|Console" | grep -v -i cronet | tail -80 > $OUT/logcat.txt || true
grep -q "FATAL EXCEPTION" $OUT/logcat.txt && bad "لا انهيار" || ok "لا انهيار"
