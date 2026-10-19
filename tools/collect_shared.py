# يجمع التصحيحات اللي بعتها المستخدمين (ntfy) ويضيفها لـ web/ml/shared.json بعد التحقق منها
import base64, json, os, urllib.request
topic = os.environ.get("TOPIC") or open("tools/ntfy_topic.txt").read().strip()
since_f = os.environ.get("SINCE_FILE", "tools/ntfy_since.txt")
shared_f = os.environ.get("SHARED_FILE", "web/ml/shared.json")
since = open(since_f).read().strip() if os.path.exists(since_f) else "12h"
url = f"https://ntfy.sh/{topic}/json?poll=1&since={since}"
lines = urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent": "harira-collector"}), timeout=60).read().decode().splitlines()
shared = json.load(open(shared_f, encoding="utf-8"))
seen = {x["e"] for x in shared}
num = lambda v, lo, hi: isinstance(v, (int, float)) and lo <= v <= hi
added, last = 0, None
for line in lines:
    try: m = json.loads(line)
    except Exception: continue
    if m.get("event") != "message": continue
    last = m["id"]
    try:
        d = json.loads(m.get("message", ""))
        e = d["e"]
        if len(base64.b64decode(e)) != 1024 or e in seen: continue
        items = []
        for it in d["items"][:6]:
            n = str(it["n"]).strip()[:60]
            if not n or not num(it["k"], 0, 900) or not num(it["g"], 1, 2000) or not num(it.get("ug", 100), 1, 2000): raise ValueError
            items.append({"f": {k: it.get(k) for k in ("n", "c", "k", "p", "cb", "f", "u", "ug", "gen", "type")} | {"n": n}, "g": it["g"]})
        if not items: continue
        shared.append({"e": e, "items": items}); seen.add(e); added += 1
    except Exception:
        continue
shared = shared[-3000:]
json.dump(shared, open(shared_f, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
if last: open(since_f, "w").write(last)
print(f"messages={len(lines)} added={added} total={len(shared)}")

# ===== التفعيلات: منجمعها بـ web/subs.json (لكل حساب آخر تفعيل موقّع) =====
from cryptography.hazmat.primitives.asymmetric import ec, utils
from cryptography.hazmat.primitives import hashes
import re as _re
sub_js = open("web/sub.js", encoding="utf-8").read()
sp = _re.search(r'signPub: \{ x: "([^"]+)", y: "([^"]+)" \}', sub_js)
acts = _re.search(r'actsTopic: "([^"]+)"', sub_js).group(1)
d64 = lambda s: base64.urlsafe_b64decode(s + "=" * (-len(s) % 4))
sx, sy = os.environ.get("SIGN_X") or sp.group(1), os.environ.get("SIGN_Y") or sp.group(2)
acts = os.environ.get("ACTS_TOPIC") or acts
pub = ec.EllipticCurvePublicNumbers(int.from_bytes(d64(sx), "big"), int.from_bytes(d64(sy), "big"), ec.SECP256R1()).public_key()
subs_f = os.environ.get("SUBS_FILE", "web/subs.json")
subs = json.load(open(subs_f)) if os.path.exists(subs_f) else {}
alines = urllib.request.urlopen(urllib.request.Request(f"https://ntfy.sh/{acts}/json?poll=1&since=all", headers={"User-Agent": "harira-collector"}), timeout=60).read().decode().splitlines()
na = 0
for line in alines:
    try:
        m = json.loads(line); tok = m["message"].strip(); p_, s_ = tok.split(".")
        sig = d64(s_); pub.verify(utils.encode_dss_signature(int.from_bytes(sig[:32], "big"), int.from_bytes(sig[32:], "big")), p_.encode(), ec.ECDSA(hashes.SHA256()))
        data = json.loads(d64(p_))
        old = subs.get(data["id"])
        if old and json.loads(d64(old.split(".")[0]))["iat"] >= data["iat"]: continue
        subs[data["id"]] = tok; na += 1
    except Exception:
        continue
json.dump(subs, open(subs_f, "w"), separators=(",", ":"))
print(f"activations={len(alines)} new={na} accounts={len(subs)}")

# ===== المستخدمين: تسجيلات مشفّرة للأدمن، منحفظها بـ web/users.json (ما حدا بيقدر يقراها غير الأدمن) =====
users_topic = os.environ.get("USERS_TOPIC") or _re.search(r'usersTopic: "([^"]+)"', sub_js).group(1)
users_f = os.environ.get("USERS_FILE", "web/users.json")
users = json.load(open(users_f)) if os.path.exists(users_f) else {}
ulines = urllib.request.urlopen(urllib.request.Request(f"https://ntfy.sh/{users_topic}/json?poll=1&since=all", headers={"User-Agent": "harira-collector"}), timeout=60).read().decode().splitlines()
nu = 0
for line in ulines:
    try:
        m = json.loads(line)
        if m.get("event") != "message" or m["id"] in users: continue
        o = json.loads(m["message"])
        if not (isinstance(o.get("epk"), dict) and o.get("iv") and o.get("ct")) or len(m["message"]) > 4000: continue
        users[m["id"]] = m["message"]; nu += 1
    except Exception:
        continue
json.dump(users, open(users_f, "w"), separators=(",", ":"))
print(f"users_msgs={len(ulines)} new={nu} total={len(users)}")

# ===== إعدادات الأدمن وكلمة سرّه: رسائل موقّعة بمفتاح الأدمن، منحفظ آخر وحدة =====
cfg_topic = os.environ.get("CFG_TOPIC") or _re.search(r'cfgTopic: "([^"]+)"', sub_js).group(1)
cfg_f = os.environ.get("CONFIG_FILE", "web/config.json")
keys_f = os.environ.get("KEYS_FILE", "web/admin-keys.json")
cfg = json.load(open(cfg_f, encoding="utf-8")) if os.path.exists(cfg_f) else {}
akeys = json.load(open(keys_f)) if os.path.exists(keys_f) else {}
clines = urllib.request.urlopen(urllib.request.Request(f"https://ntfy.sh/{cfg_topic}/json?poll=1&since=all", headers={"User-Agent": "harira-collector"}), timeout=60).read().decode().splitlines()
best_cfg, best_keys = None, None
for line in clines:
    try:
        m = json.loads(line)
        if m.get("event") != "message": continue
        tok = m.get("message", "")
        if m.get("attachment"):
            tok = urllib.request.urlopen(urllib.request.Request(m["attachment"]["url"], headers={"User-Agent": "harira-collector"}), timeout=60).read().decode()
        p_, s_ = tok.strip().split(".")
        sig = d64(s_); pub.verify(utils.encode_dss_signature(int.from_bytes(sig[:32], "big"), int.from_bytes(sig[32:], "big")), p_.encode(), ec.ECDSA(hashes.SHA256()))
        data = json.loads(d64(p_))
        if data.get("t") == "cfg" and isinstance(data.get("cfg"), dict) and data["iat"] > cfg.get("iat", 0) and (not best_cfg or data["iat"] > best_cfg["iat"]): best_cfg = data
        if data.get("t") == "keys" and isinstance(data.get("ak"), dict) and data["iat"] > akeys.get("iat", 0) and (not best_keys or data["iat"] > best_keys["iat"]): best_keys = data
    except Exception:
        continue
if best_cfg:
    json.dump({**best_cfg["cfg"], "iat": best_cfg["iat"]}, open(cfg_f, "w", encoding="utf-8"), ensure_ascii=False, separators=(",", ":"))
if best_keys:
    ak = best_keys["ak"]
    if all(k in ak for k in ("salt", "it", "iv", "ct", "eh")):
        json.dump({**{k: ak[k] for k in ("v", "salt", "it", "iv", "ct", "eh") if k in ak}, "iat": best_keys["iat"]}, open(keys_f, "w"), separators=(",", ":"))
print(f"cfg_msgs={len(clines)} cfg={'new' if best_cfg else 'same'} keys={'new' if best_keys else 'same'}")
