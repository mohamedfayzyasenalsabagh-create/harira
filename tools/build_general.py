# يبني web/ml/general.js: أصناف موديل جوجل العام (ImageNet) اللي هي أكل ← الأكلة المطابقة بقاعدتنا
import json, subprocess
foods = json.loads(subprocess.check_output(["node", "-e",
    "eval(require('fs').readFileSync('web/foods.js','utf8')+';console.log(JSON.stringify(FOODS.map(f=>f.n)))')"]))
labels = [l.strip() for l in open("tools/imagenet_labels.txt", encoding="utf-8")]
MAP = {
 "Granny Smith":"تفاح","strawberry":"فراولة","orange":"برتقال","lemon":"ليمون","fig":"تين","pineapple":"أناناس","banana":"موز",
 "pomegranate":"رمان","custard apple":"قشطة (فاكهة)","bell pepper":"فليفلة (فلفل حلو)","cucumber":"خيار","broccoli":"بروكلي مسلوق",
 "cauliflower":"قرنبيط (زهرة) مسلوق","head cabbage":"ملفوف","zucchini":"كوسا مطبوخة","mushroom":"فطر (مشروم)","corn":"ذرة مسلوقة",
 "ear":"ذرة مسلوقة","artichoke":"أرضي شوكي","butternut squash":"يقطين مطبوخ","acorn squash":"يقطين مطبوخ","spaghetti squash":"يقطين مطبوخ",
 "guacamole":"أفوكادو","pizza":"بيتزا مارغريتا","cheeseburger":"تشيز برغر","hotdog":"هوت دوغ","ice cream":"بوظة (آيس كريم)",
 "ice lolly":"بوظة (آيس كريم)","French loaf":"خبز فرنسي (باغيت)","bagel":"كعك / سميد بالسمسم","pretzel":"كعك / سميد بالسمسم",
 "mashed potato":"بطاطا مهروسة","carbonara":"معكرونة كاربونارا","meat loaf":"كفتة بالصينية","burrito":"بوريتو",
 "espresso":"قهوة عربية / تركية بدون سكر","consomme":"شوربة خضار","trifle":"كاتو / كيك","eggnog":"كوكتيل فواكه بالحليب",
 "potpie":"فطيرة سبانخ","hot pot":"شوربة خضار","plate":None,
}
out = {}
for i, name in enumerate(labels):
    if name in MAP and MAP[name]:
        assert MAP[name] in foods, (name, MAP[name])
        out[i] = MAP[name]
missing = [k for k in MAP if k not in labels]
print("mapped", len(out), "missing labels:", missing)
open("web/ml/general.js", "w", encoding="utf-8").write("// مولّد بـ tools/build_general.py — أصناف الأكل بموديل جوجل العام (ImageNet) ← أكلات القاعدة\nconst ML_GENERAL = " + json.dumps(out, ensure_ascii=False) + ";\n")
