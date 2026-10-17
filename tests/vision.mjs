// تجربة تحليل صورة أكل حقيقية بنفس كود التطبيق (OpenRouter)
import fs from "node:fs";
const src = fs.readFileSync("web/app.js", "utf8");
const pick = (start, end) => src.slice(src.indexOf(start), src.indexOf(end));
globalThis.HARIRA_DEBUG = !!process.env.HARIRA_DEBUG;
globalThis.localStorage = { getItem: () => null, setItem: () => {} };
const code = pick("const ORK", "const MEALS") + pick("// الموديلات المجانية", "// تصغير الصورة") + "\nexport { askVision, visionModels };";
fs.writeFileSync("/tmp/v.mjs", code.replace(/^const MEALS[\s\S]*$/m, ""));
const { askVision, visionModels } = await import("/tmp/v.mjs");
console.log("models:", (await visionModels()).slice(0, 5).join(", "));
const img = "data:image/jpeg;base64," + fs.readFileSync(process.argv[2]).toString("base64");
const t = Date.now();
try { console.log(JSON.stringify(await askVision(img), null, 1)); } catch (e) { console.log("ERROR:", e.message); }
console.log("seconds:", (Date.now() - t) / 1000);
