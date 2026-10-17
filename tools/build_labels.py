# يبني web/ml/labels.js: لكل صنف بموديل جوجل للأكل، الأكلة المطابقة بقاعدتنا أو نوع عام بسعرات تقريبية
import csv, json, re, subprocess

foods = json.loads(subprocess.check_output(["node", "-e",
    "eval(require('fs').readFileSync('web/foods.js','utf8')+';console.log(JSON.stringify(FOODS.map(f=>f.n)))')"]))
labels = [r["name"] for r in csv.DictReader(open("tools/aiy_food_labels.csv", encoding="utf-8"))]

# تطابق مباشر: اسم الصنف بالموديل ← اسم الأكلة بقاعدتنا
DIRECT = {
 "Hummus":"حمص بطحينة","Falafel":"فلافل","Shawarma":"شاورما دجاج (لحمة فقط)","Kofta":"كفتة مشوية","Kibbeh":"كبة مقلية",
 "Tabbouleh":"تبولة","Fattoush":"فتوش","Baba ghanoush":"متبل / بابا غنوج","Eggplant Salad":"متبل / بابا غنوج","Mulukhiyah":"ملوخية بالدجاج",
 "Fatteh":"فتة حمص","Maqluba":"مقلوبة","Mandi":"مندي","Shish taouk":"شيش طاووق","Manakish":"منقوشة زعتر","Baklava":"بقلاوة",
 "Basbousa":"هريسة / بسبوسة","Qatayef":"قطايف بالقشطة","Halva":"حلاوة طحينية","Shakshouka":"شكشوكة","Ful medames":"فول مدمس",
 "Kushari":"كشري","Dolma":"يبرق / ورق عنب بالزيت","Stuffed peppers":"فلفل محشي","Stuffed squash":"محشي كوسا","Samosa":"سمبوسة خضار",
 "Couscous":"كسكس مطبوخ","Pepperoni":"بيتزا بيبروني","Spaghetti":"سباغيتي بالصلصة","Spaghetti aglio e olio":"سباغيتي بالصلصة",
 "Carbonara":"معكرونة كاربونارا","Lasagne":"لازانيا","Lasagna":"لازانيا","Sushi":"سوشي","Ramen":"رامن","Hamburger":"برغر كامل (بالخبز)",
 "Veggie burger":"برغر كامل (بالخبز)","Cheeseburger":"تشيز برغر","Ciabatta Bacon Cheeseburger":"تشيز برغر","Hot dog":"هوت دوغ",
 "Fried chicken":"دجاج مقلي (مع الجلد)","Crispy fried chicken":"زنجر / بروستد","Chicken nugget":"ناغتس دجاج","Buffalo wing":"أجنحة دجاج",
 "Fried rice":"رز مقلي","American fried rice":"رز مقلي","White rice":"رز أبيض مطبوخ","Hyderabadi biryani":"برياني","Biryani":"برياني",
 "Chicken curry":"كاري دجاج","Japanese curry":"كاري دجاج","Pancake":"بان كيك","Waffle":"وافل","French toast":"توست فرنسي",
 "Omelette":"عجة بيض","Greek salad":"سلطة يونانية","Caesar salad":"سلطة سيزر","Potato salad":"سلطة بطاطا","Caprese salad":"سلطة خضار",
 "Fruit salad":"سلطة فواكه","Cheesecake":"تشيز كيك","Tiramisu":"تيراميسو","Chocolate brownie":"براوني","Poppyseed muffin":"مافن","Muffin":"مافن",
 "Apple pie":"فطيرة تفاح","Taco":"تاكو","Burrito":"بوريتو","Fried fish":"سمك مقلي","Fish and chips":"سمك وبطاطا مقلية",
 "Club sandwich":"كلوب ساندويش","Tuna fish sandwich":"ساندويشة تونة","Roast beef sandwich":"ساندويشة لحم","Steak sandwich":"ساندويشة لحم",
 "Croissant":"كرواسون","Doughnut":"دونات","Donut":"دونات","Ice cream":"بوظة (آيس كريم)","Mashed potato":"بطاطا مهروسة",
 "French fries":"بطاطا مقلية","Home fries":"بطاطا مقلية","Cheese fries":"بطاطا مقلية","Rice pudding":"رز بحليب","Lentil soup":"شوربة عدس",
 "Chicken soup":"شوربة دجاج","Tomato soup":"شوربة بندورة","Harira":"حريرة","Kabsa":"كبسة / رز بالدجاج","Mansaf":"منسف","Mujaddara":"مجدرة",
 "Knafeh":"كنافة","Kunafa":"كنافة","Ma'amoul":"معمول بالتمر","Labneh":"لبنة","Sfiha":"لحم بعجين / صفيحة","Lahmacun":"لحم بعجين / صفيحة",
 "Moussaka":"مسقعة","Shish kebab":"كباب حلبي","Kebab":"كباب حلبي","Adana kebabı":"كباب حلبي","Kofte":"كفتة مشوية","Döner kebab":"سندويشة شاورما لحمة",
 "Gyro":"سندويشة شاورما لحمة","Pita":"خبز عربي أبيض","Flatbread":"خبز عربي أبيض","Bagel":"كعك / سميد بالسمسم","Simit":"كعك / سميد بالسمسم",
 "Dumpling":"دمبلنغ (زلابية صينية)","Jiaozi":"دمبلنغ (زلابية صينية)","Gyoza":"دمبلنغ (زلابية صينية)","Spring roll":"سبرنغ رول",
 "Spaghetti bolognese":"سباغيتي بالصلصة","Macaroni and cheese":"معكرونة مطبوخة","Popcorn":"فشار","Potato chips":"شيبس (رقائق بطاطا)",
 "Chocolate cake":"كاتو / كيك","Sponge cake":"كاتو / كيك","Crème caramel":"كريم كراميل","Flan":"كريم كراميل","Muhallebi":"مهلبية",
 "Luqaimat":"عوامة / لقيمات","Kanafeh":"كنافة","Ice cream cake":"بوظة (آيس كريم)","German chocolate cake":"كاتو / كيك",
 "Chocolate chip cookie":"بسكويت حلو","Spanakopita":"فطيرة سبانخ","Fried dough":"عوامة / لقيمات","Cheesesteak":"ساندويشة لحم",
 "Shami kebab":"كفتة مشوية","Pain au chocolat":"كرواسون","Chocolate pudding":"مهلبية","Stir-fried tomato and scrambled eggs":"عجة بيض","Grilled cheese":"جبنة حلوم مشوية","Halloumi":"جبنة حلوم مشوية","Steak":"ستيك لحم مشوي",
}
for k, v in DIRECT.items():
    assert v in foods, ("missing food", k, v)

# أنواع عامة: كلمة بالاسم الإنكليزي ← (اسم عربي، سعرات، بروتين، كربو، دهون، الوحدة، غرامات)
TYPES = [
 ("soup|broth|chowder|bisque|consomm|gazpacho|borscht|pho\\b|laksa", ("شوربة",60,3.5,7,2,"زبدية",300)),
 ("salad|slaw", ("سلطة",110,3,8,8,"صحن",200)),
 ("pizza", ("بيتزا",266,11,33,10,"قطعة",110)),
 ("curry|stew|tagine|goulash|chili|ragout|ragù|casserole|hotpot|hot pot", ("يخنة / طبخة",130,9,8,7,"صحن",300)),
 ("spaghetti|pasta|macaroni|noodle|lasagn|ravioli|gnocchi|penne|fettuccine|linguine|udon|ramen|lo mein|tagliatelle|vermicelli", ("معكرونة / نودلز",160,6,26,4,"صحن",300)),
 ("rice|risotto|pilaf|pilau|paella|biryani|jollof", ("طبق رز",170,6,25,5,"صحن",300)),
 ("sandwich|burger|hot dog|\\bdog\\b|wrap|burrito|taco|sub\\b|panini", ("سندويشة",250,12,25,11,"سندويشة",220)),
 ("cake|torte|gateau|tart\\b|pie\\b|pudding|cookie|biscuit|brownie|muffin|cupcake|donut|doughnut|crumble|cobbler|strudel|meringue|mousse|custard|candy|fudge|toffee|halva|halwa|ice cream|sorbet|gelato|baklava|sweet|dessert|pastry|pastries|shortcake|bun\\b", ("حلويات",330,5,45,15,"قطعة",100)),
 ("pancake|waffle|crêpe|crepe|fritter", ("فطائر / بان كيك",250,6,32,11,"قطعة",60)),
 ("bread|roll\\b|bagel|naan|roti|paratha|pita|loaf|focaccia|baguette|toast|bun|brioche", ("خبز / معجنات",280,9,50,5,"قطعة",80)),
 ("dumpling|gyoza|momo|pierog|wonton|bao\\b|samosa|empanada|pastel|börek|burek|patty|pasty", ("معجنات محشية",230,8,25,11,"قطعة",60)),
 ("sushi|sashimi|fish|salmon|tuna|cod\\b|herring|shrimp|prawn|crab|lobster|oyster|clam|mussel|squid|octopus|calamari|scallop|seafood|anchov|sardine|eel", ("سمك / مأكولات بحرية",150,20,4,6,"صحن",200)),
 ("chicken|duck|turkey|goose|quail", ("طبق دجاج",190,22,4,10,"صحن",250)),
 ("beef|steak|pork|lamb|mutton|veal|meat|sausage|ham\\b|bacon|kebab|kebap|kofta|meatball|ribs|brisket|liver|goat", ("طبق لحمة",250,22,4,16,"صحن",250)),
 ("egg|omelet|frittata|quiche|tortilla de", ("طبق بيض",160,11,3,12,"صحن",150)),
 ("cheese", ("طبق جبنة",330,18,5,26,"قطعة",80)),
 ("tofu|bean|lentil|dal\\b|dhal|chickpea|falafel|hummus", ("بقوليات",130,8,18,3,"صحن",250)),
 ("potato|fries|chips", ("بطاطا",150,2.5,22,6,"صحن",200)),
 ("fried|tempura|croquette|katsu|schnitzel", ("مقلي",280,12,20,17,"صحن",200)),
 ("vegetable|eggplant|aubergine|zucchini|cabbage|spinach|mushroom|pepper|tomato|okra|cauliflower|broccoli|carrot", ("طبق خضار",80,2.5,9,4,"صحن",250)),
 ("drink|juice|tea\\b|coffee|lassi|smoothie|milkshake|shake\\b", ("مشروب",60,1,12,1,"كاسة",250)),
]
GENERIC = ("طبق",180,8,18,8,"صحن",300)

out = []
used = set()
for name in labels:
    if name.startswith("/") or name == "__background__":
        out.append(None); continue
    if name in DIRECT:
        out.append([name, DIRECT[name]]); used.add(name); continue
    t = GENERIC
    for pat, val in TYPES:
        if re.search(pat, name, re.I): t = val; break
    out.append([name, None, *t])
print("direct:", len(used), "of", len(DIRECT), "| total labels:", len(labels))
print("unused direct keys:", sorted(set(DIRECT) - used))
js = "// مولّد بـ tools/build_labels.py — أصناف موديل جوجل للأكل (AIY food V1) مع الأكلة المطابقة أو نوع عام\nconst ML_LABELS = " + json.dumps(out, ensure_ascii=False, separators=(",", ":")) + ";\n"
open("web/ml/labels.js", "w", encoding="utf-8").write(js)
