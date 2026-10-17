// قياس سرعة كل موديل مجاني بيفهم الصور على صورة أكل حقيقية
import fs from "node:fs";
const src = fs.readFileSync("web/app.js", "utf8");
const ORK = eval(src.slice(src.indexOf("(() => { const m"), src.indexOf("const OR =")).trim().replace(/;$/, ""));
const PROMPT = eval(src.slice(src.indexOf("const AI_PROMPT = ") + 18, src.indexOf("`;", src.indexOf("const AI_PROMPT")) + 1));
const img = "data:image/jpeg;base64," + fs.readFileSync(process.argv[2]).toString("base64");
const all = (await (await fetch("https://openrouter.ai/api/v1/models")).json()).data;
const free = all.filter(m => /:free$/.test(m.id) && (m.architecture?.input_modalities || []).includes("image") && !/safety|guard|embed/i.test(m.id));
console.log("free vision models:", free.map(m => m.id).join(", "));
await Promise.all(free.map(async m => {
  const t = Date.now();
  try {
    const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", signal: AbortSignal.timeout(90000),
      headers: { Authorization: "Bearer " + ORK, "Content-Type": "application/json" },
      body: JSON.stringify({ model: m.id, temperature: 0.2, max_tokens: 1500, reasoning: { effort: "low", exclude: true },
        messages: [{ role: "user", content: [{ type: "text", text: PROMPT }, { type: "image_url", image_url: { url: img } }] }] }) });
    const raw = await r.text(); const j = JSON.parse(raw.split("\n").filter(l => !l.startsWith(":")).join("\n").trim() || "{}");
    const c = j.choices?.[0]?.message?.content || "";
    console.log(`${m.id} | ${r.status} | ${((Date.now() - t) / 1000).toFixed(1)}s | ${c.includes('"items"') ? "OK" : "BAD"} | ${(c || JSON.stringify(j.error || j)).replace(/\s+/g, " ").slice(0, 160)}`);
  } catch (e) { console.log(`${m.id} | ERR ${e.name} | ${((Date.now() - t) / 1000).toFixed(1)}s`); }
}));
