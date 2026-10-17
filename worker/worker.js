// خادم تحليل صور الأكل لتطبيق حريره (Cloudflare Workers AI - مجاني ضمن الحد اليومي)
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (o, status = 200) => new Response(JSON.stringify(o), { status, headers: { ...CORS, "Content-Type": "application/json; charset=utf-8" } });

const PROMPT = `You are a nutrition assistant. Look at this food photo and identify every distinct food or drink visible.
For each one, estimate the portion weight in grams from visual cues (plate size, utensils, typical servings), and give typical nutrition values PER 100 GRAMS for that food as prepared.
Reply with ONLY a JSON object, no other text, in exactly this shape:
{"items":[{"name":"<short Arabic name, Levantine wording>","grams":<number>,"kcal100":<number>,"p100":<protein g per 100g>,"c100":<carbs g per 100g>,"f100":<fat g per 100g>}],"note":"<one short Arabic sentence about uncertainty, e.g. hidden oil or sauce>"}
If there is no food in the image, reply {"items":[],"note":"ما في أكل واضح بالصورة"}.`;

function parse(text) {
  if (typeof text !== "string") return text;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/);
  const body = fence ? fence[1] : text;
  const a = body.indexOf("{"), b = body.lastIndexOf("}");
  if (a < 0 || b < a) throw new Error("no json");
  return JSON.parse(body.slice(a, b + 1));
}

async function scout(env, dataUrl) {
  const r = await env.AI.run("@cf/meta/llama-4-scout-17b-16e-instruct", {
    messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: dataUrl } }] }],
    max_tokens: 900, temperature: 0.2,
  });
  return parse(r.response);
}

async function llamaVision(env, b64) {
  const bytes = [...Uint8Array.from(atob(b64), c => c.charCodeAt(0))];
  const run = () => env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", {
    messages: [{ role: "user", content: PROMPT }], image: bytes, max_tokens: 900, temperature: 0.2,
  });
  try { return parse((await run()).response); }
  catch (e) {
    // هالموديل بيطلب موافقة على الرخصة لمرة وحدة
    if (String(e).includes("agree")) { await env.AI.run("@cf/meta/llama-3.2-11b-vision-instruct", { prompt: "agree" }).catch(() => {}); return parse((await run()).response); }
    throw e;
  }
}

function clean(o) {
  const num = v => Math.max(0, Math.min(5000, Number(v) || 0));
  const items = (Array.isArray(o && o.items) ? o.items : []).slice(0, 12).map(it => ({
    name: String(it.name || "أكلة").slice(0, 60), grams: num(it.grams),
    kcal100: Math.min(num(it.kcal100), 900), p100: Math.min(num(it.p100), 100), c100: Math.min(num(it.c100), 100), f100: Math.min(num(it.f100), 100),
  }));
  return { items, note: String((o && o.note) || "").slice(0, 200) };
}

export default {
  async fetch(req, env) {
    if (req.method === "OPTIONS") return new Response(null, { headers: CORS });
    if (req.method !== "POST") return json({ ok: true, name: "harira-ai" });
    let image;
    try { ({ image } = await req.json()); } catch { return json({ error: "الطلب غير صالح" }, 400); }
    const m = typeof image === "string" && image.match(/^data:image\/(jpeg|png|webp);base64,(.+)$/);
    if (!m) return json({ error: "ابعت صورة JPG أو PNG" }, 400);
    if (m[2].length > 4_000_000) return json({ error: "الصورة كبيرة كتير" }, 413);
    try {
      return json(clean(await scout(env, image)));
    } catch (e1) {
      try { return json(clean(await llamaVision(env, m[2]))); }
      catch (e2) {
        const msg = String(e2.message || e2);
        if (/limit|quota|capacity|429/i.test(msg)) return json({ error: "خلص حد التحليل المجاني لليوم. جرب بكرا، أو اختار الأكلة يدوياً." }, 429);
        return json({ error: "ما قدرت حلل الصورة. جرب صورة أوضح." , detail: msg.slice(0, 200) }, 502);
      }
    }
  },
};
