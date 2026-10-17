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
