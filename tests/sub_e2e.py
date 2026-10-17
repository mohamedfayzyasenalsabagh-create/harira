# تجربة الاشتراك من أول لآخر عبر ntfy.sh الحقيقي بمفاتيح تجريبية (مو مفاتيح صاحب التطبيق)
import base64, json, os, re, secrets
from cryptography.hazmat.primitives.asymmetric import ec
from playwright.sync_api import sync_playwright
b = lambda n: base64.urlsafe_b64encode(n.to_bytes(32, "big")).rstrip(b"=").decode()
keys = {}
for name in ("sign", "dh"):
    k = ec.generate_private_key(ec.SECP256R1()); pn = k.public_key().public_numbers()
    keys[name] = {"x": b(pn.x), "y": b(pn.y), "d": b(k.private_numbers().private_value)}
topic = "harira-test-req-" + secrets.token_hex(6)
acts = "harira-test-acts-" + secrets.token_hex(6)
src = open("web/sub.js", encoding="utf-8").read()
src = re.sub(r'signPub: \{[^}]*\}', 'signPub: {x: "%s", y: "%s"}' % (keys["sign"]["x"], keys["sign"]["y"]), src)
src = re.sub(r'dhPub: \{[^}]*\}', 'dhPub: {x: "%s", y: "%s"}' % (keys["dh"]["x"], keys["dh"]["y"]), src)
src = re.sub(r'reqTopic: "[^"]*"', 'reqTopic: "%s"' % topic, src).replace('actPrefix: "harira-act-"', 'actPrefix: "harira-test-act-"')
src = re.sub(r'actsTopic: "[^"]*"', 'actsTopic: "%s"' % acts, src)
out = []
with sync_playwright() as p:
    br = p.chromium.launch()
    ctx = br.new_context(viewport={"width": 390, "height": 844}, locale="ar", service_workers="block")
    ctx.route("**/sub.js", lambda r: r.fulfill(body=src, content_type="application/javascript"))
    errs = []
    u = ctx.new_page(); u.on("pageerror", lambda e: errs.append(str(e)))
    u.goto("http://localhost:8080/"); u.wait_for_timeout(1500)
    u.fill("#l-name", "تجربة"); u.fill("#l-email", "ci-test@example.com"); u.fill("#l-pass", "test-pass-123"); u.click("#l-go"); u.wait_for_timeout(4000)
    u.evaluate("localStorage.setItem('harira-first', String(Date.now()-10*864e5))"); u.reload(); u.wait_for_timeout(1500)
    out.append("locked: " + u.inner_text("#app h2"))
    u.click("#lock-sub"); u.fill("#s-name", "تجربة"); u.fill("#s-phone", "0990000000"); u.set_input_files("#s-rc", "tests/receipt.jpg"); u.click("#s-send"); u.wait_for_timeout(5000)
    out.append("request: " + json.dumps(u.evaluate("JSON.parse(localStorage.getItem('harira-req')||'{}').status")))
    a = ctx.new_page(); a.on("pageerror", lambda e: errs.append("admin: " + str(e)))
    a.goto("http://localhost:8080/admin.html"); a.evaluate("k => localStorage.setItem('harira-admin', JSON.stringify(k))", {"sign": keys["sign"]["d"], "dh": keys["dh"]["d"]}); a.reload(); a.wait_for_timeout(8000)
    out.append("admin sees: %s receipt imgs: %d" % (a.locator(".card .card b").all_inner_texts()[:1], a.locator("img.rc").count()))
    a.screenshot(path=".results/admin.png", full_page=True)
    a.click("[data-d$='|m1']"); a.wait_for_timeout(4000)
    u.wait_for_timeout(25000)
    out.append("user after approve: " + (u.inner_text("#subchip") if u.query_selector("#subchip") else u.inner_text("#app h2")))
    u.screenshot(path=".results/user.png", full_page=True)
    acc_id = u.evaluate("deviceId()")
    import subprocess
    env = dict(os.environ, ACTS_TOPIC=acts, SIGN_X=keys["sign"]["x"], SIGN_Y=keys["sign"]["y"], SUBS_FILE="/tmp/subs.json", TOPIC="harira-test-none-" + secrets.token_hex(4), SHARED_FILE="/tmp/shared.json", SINCE_FILE="/tmp/since.txt")
    open("/tmp/shared.json", "w").write("[]")
    out.append("collector: " + subprocess.run(["python3", "tools/collect_shared.py"], env=env, capture_output=True, text=True).stdout.strip().replace("\n", " | "))
    out.append("durable subs.json has account: %s" % (acc_id in json.load(open("/tmp/subs.json"))))
    out.append("errors: " + json.dumps(errs, ensure_ascii=False))
    br.close()
os.makedirs(".results", exist_ok=True)
open(".results/sub.txt", "w").write("\n".join(out)); print("\n".join(out))
