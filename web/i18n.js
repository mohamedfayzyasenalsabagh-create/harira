// حريره بالإنكليزي: الواجهة مكتوبة بالعربي، وبالإنكليزي منترجم النصوص بعد كل رسم
const LANG = (() => { try { const l = localStorage.getItem("harira-lang"); if (l) return l; } catch (e) {} return /^ar/i.test(navigator.language || "ar") ? "ar" : "en"; })();
const LOC = LANG === "en" ? "en-US" : "ar-SY";
document.documentElement.lang = LANG; document.documentElement.dir = LANG === "en" ? "ltr" : "rtl";
function setLang(l) { try { localStorage.setItem("harira-lang", l); } catch (e) {} location.reload(); }

const EN_FOODS = {
"خبز عربي أبيض":"Pita bread (white)","خبز أسمر (قمح كامل)":"Whole wheat pita","خبز توست أبيض":"White toast bread","خبز توست أسمر":"Whole wheat toast","خبز صاج / مرقوق":"Saj / markook bread","كعك / سميد بالسمسم":"Sesame ka'ak / bagel","كرواسون":"Croissant","رز أبيض مطبوخ":"White rice, cooked","رز بسمتي مطبوخ":"Basmati rice, cooked","رز بني مطبوخ":"Brown rice, cooked","معكرونة مطبوخة":"Pasta, cooked","برغل مطبوخ":"Bulgur, cooked","فريكة مطبوخة":"Freekeh, cooked","شوفان (جاف)":"Oats (dry)","كورن فليكس":"Corn flakes","بطاطا مسلوقة":"Boiled potato","بطاطا مقلية":"French fries","بطاطا حلوة مشوية":"Baked sweet potato","ذرة مسلوقة":"Boiled corn","كسكس مطبوخ":"Couscous, cooked","نودلز مطبوخة":"Noodles, cooked","شعيرية مطبوخة":"Vermicelli, cooked","بسكويت مالح (كراكرز)":"Crackers",
"صدر دجاج مشوي":"Grilled chicken breast","فخذ دجاج مشوي":"Grilled chicken thigh","دجاج مقلي (مع الجلد)":"Fried chicken (with skin)","دجاج مسلوق":"Boiled chicken","لحم بقر قليل الدهن مطبوخ":"Lean beef, cooked","لحم غنم مطبوخ":"Lamb, cooked","لحم مفروم مطبوخ":"Ground meat, cooked","كفتة مشوية":"Grilled kofta","ستيك لحم مشوي":"Grilled steak","ديك رومي (حبش) مشوي":"Roast turkey","مرتديلا":"Mortadella","سجق / نقانق":"Sausage","كبدة دجاج مطبوخة":"Chicken liver, cooked","كبدة غنم مطبوخة":"Lamb liver, cooked","برغر لحم مشوي (القرص فقط)":"Beef patty (grilled)",
"سمك أبيض مشوي":"Grilled white fish","سمك سلمون مشوي":"Grilled salmon","سمك مقلي":"Fried fish","تونة معلبة بالماء":"Canned tuna in water","تونة معلبة بالزيت":"Canned tuna in oil","سردين معلب":"Canned sardines","جمبري (قريدس) مطبوخ":"Shrimp, cooked",
"بيضة مسلوقة":"Boiled egg","بيضة مقلية":"Fried egg","عجة بيض":"Omelette","حليب كامل الدسم":"Whole milk","حليب قليل الدسم":"Low-fat milk","لبن (زبادي) كامل الدسم":"Yogurt (full fat)","لبن يوناني":"Greek yogurt","لبنة":"Labneh","جبنة بيضاء (عكاوي/حلوم)":"White cheese (akkawi/halloumi)","جبنة حلوم مشوية":"Grilled halloumi","جبنة شيدر":"Cheddar cheese","جبنة موزاريلا":"Mozzarella","جبنة مثلثات":"Cheese triangles","جبنة قريش / قريشة":"Cottage cheese","زبدة":"Butter","قشطة":"Clotted cream (ashta)","عيران / شنينة":"Ayran (yogurt drink)",
"حمص مسلوق":"Boiled chickpeas","عدس مطبوخ":"Lentils, cooked","فول مدمس":"Ful medames","فاصولياء حمراء مطبوخة":"Kidney beans, cooked","فاصولياء بيضاء مطبوخة":"White beans, cooked","بازلاء مطبوخة":"Peas, cooked","فاصولياء خضراء مطبوخة":"Green beans, cooked",
"خيار":"Cucumber","بندورة (طماطم)":"Tomato","خس":"Lettuce","جزر":"Carrot","فليفلة (فلفل حلو)":"Bell pepper","بصل":"Onion","ثوم":"Garlic","كوسا مطبوخة":"Zucchini, cooked","باذنجان مشوي":"Grilled eggplant","باذنجان مقلي":"Fried eggplant","قرنبيط (زهرة) مسلوق":"Boiled cauliflower","قرنبيط مقلي":"Fried cauliflower","بروكلي مسلوق":"Boiled broccoli","سبانخ مطبوخة":"Spinach, cooked","ملفوف":"Cabbage","فطر (مشروم)":"Mushrooms","بقدونس":"Parsley","فجل":"Radish","زيتون أخضر":"Green olives","زيتون أسود":"Black olives","مخلل":"Pickles",
"تفاح":"Apple","موز":"Banana","برتقال":"Orange","يوسفي (مندرين)":"Mandarin","عنب":"Grapes","فراولة":"Strawberries","بطيخ أحمر":"Watermelon","شمام":"Cantaloupe","مانجا":"Mango","أناناس":"Pineapple","إجاص (كمثرى)":"Pear","خوخ / دراق":"Peach","مشمش":"Apricot","كرز":"Cherries","رمان":"Pomegranate","تين":"Fig","كيوي":"Kiwi","تمر":"Dates","أفوكادو":"Avocado","زبيب":"Raisins",
"لوز":"Almonds","جوز":"Walnuts","فستق حلبي":"Pistachios","كاجو":"Cashews","فول سوداني":"Peanuts","بزر دوار الشمس":"Sunflower seeds","بزر بطيخ / قرع":"Pumpkin / melon seeds","طحينة":"Tahini","زبدة فول سوداني":"Peanut butter",
"زيت زيتون":"Olive oil","زيت نباتي":"Vegetable oil","سمنة":"Ghee","مايونيز":"Mayonnaise","كاتشب":"Ketchup","ثومية":"Garlic sauce (toum)","عسل":"Honey","مربى":"Jam","سكر":"Sugar","دبس عنب / خرنوب":"Grape / carob molasses","شوكولا قابلة للدهن (نوتيلا)":"Chocolate spread (Nutella)",
"حمص بطحينة":"Hummus","متبل / بابا غنوج":"Baba ghanoush","فلافل":"Falafel","سندويشة فلافل":"Falafel sandwich","شاورما دجاج (لحمة فقط)":"Chicken shawarma (meat only)","سندويشة شاورما دجاج":"Chicken shawarma sandwich","سندويشة شاورما لحمة":"Beef shawarma sandwich","تبولة":"Tabbouleh","فتوش":"Fattoush","كبة مقلية":"Fried kibbeh","كبة لبنية":"Kibbeh in yogurt","كبة بالصينية":"Baked kibbeh","مقلوبة":"Maqluba","كبسة / رز بالدجاج":"Kabsa (chicken & rice)","منسف":"Mansaf","مجدرة":"Mujaddara","يبرق / ورق عنب بالزيت":"Stuffed grape leaves","محشي كوسا":"Stuffed zucchini","فتة حمص":"Chickpea fatteh","فتة مكدوس / باذنجان":"Eggplant fatteh","مكدوس":"Makdous","شيش طاووق":"Shish tawook","شوربة عدس":"Lentil soup","حريرة":"Harira soup","شوربة خضار":"Vegetable soup","ملوخية بالدجاج":"Mulukhiyah with chicken","بامية باللحمة":"Okra stew with meat","فاصولياء باللحمة":"Green bean stew with meat","كوسا بلبن / شيخ المحشي":"Zucchini in yogurt","منقوشة زعتر":"Za'atar manakish","منقوشة جبنة":"Cheese manakish","فطيرة سبانخ":"Spinach pie","لحم بعجين / صفيحة":"Lahm bi ajeen / sfiha","سمبوسك لحمة مقلي":"Fried meat sambousek","كباب حلبي":"Aleppo kebab","فول بالزيت":"Fava beans in oil","مسقعة":"Moussaka","كشري":"Koshari",
"بيتزا مارغريتا":"Margherita pizza","بيتزا بيبروني":"Pepperoni pizza","برغر كامل (بالخبز)":"Hamburger (with bun)","تشيز برغر":"Cheeseburger","سندويشة كريسبي دجاج":"Crispy chicken sandwich","ناغتس دجاج":"Chicken nuggets","هوت دوغ":"Hot dog","زنجر / بروستد":"Zinger / broasted chicken","شيبس (رقائق بطاطا)":"Potato chips","فشار":"Popcorn",
"كنافة":"Knafeh","بقلاوة":"Baklava","معمول بالتمر":"Date ma'amoul","هريسة / بسبوسة":"Basbousa","مهلبية":"Muhallebi (milk pudding)","رز بحليب":"Rice pudding","قطايف بالقشطة":"Qatayef with cream","عوامة / لقيمات":"Awameh / luqaimat","حلاوة طحينية":"Halva","كاتو / كيك":"Cake","دونات":"Donut","شوكولا بالحليب":"Milk chocolate","شوكولا داكنة":"Dark chocolate","بسكويت حلو":"Cookies","بوظة (آيس كريم)":"Ice cream","كريم كراميل":"Crème caramel",
"قهوة عربية / تركية بدون سكر":"Arabic / Turkish coffee (no sugar)","قهوة أمريكانو":"Americano","نسكافيه بالحليب والسكر":"Instant coffee with milk & sugar","كابتشينو":"Cappuccino","شاي بدون سكر":"Tea (no sugar)","شاي بسكر (ملعقتين)":"Tea with 2 tsp sugar","متة بدون سكر":"Mate (no sugar)","عصير برتقال طبيعي":"Fresh orange juice","عصير معلب":"Packaged juice","مشروب غازي":"Soft drink","مشروب طاقة":"Energy drink","كوكتيل فواكه بالحليب":"Fruit milkshake","تمر هندي / عرق سوس":"Tamarind / licorice drink","ليمونادة":"Lemonade","ماء":"Water",
"سباغيتي بالصلصة":"Spaghetti with sauce","معكرونة كاربونارا":"Pasta carbonara","لازانيا":"Lasagna","سوشي":"Sushi","رامن":"Ramen","رز مقلي":"Fried rice","برياني":"Biryani","كاري دجاج":"Chicken curry","تاكو":"Taco","بوريتو":"Burrito","بان كيك":"Pancakes","وافل":"Waffle","توست فرنسي":"French toast","سلطة يونانية":"Greek salad","سلطة سيزر":"Caesar salad","سلطة خضار":"Garden salad","سلطة بطاطا":"Potato salad","سلطة فواكه":"Fruit salad","شوربة دجاج":"Chicken soup","شوربة بندورة":"Tomato soup","بطاطا مهروسة":"Mashed potatoes","أجنحة دجاج":"Chicken wings","سمك وبطاطا مقلية":"Fish and chips","سمبوسة خضار":"Vegetable samosa","دمبلنغ (زلابية صينية)":"Dumplings","سبرنغ رول":"Spring rolls","ساندويشة لحم":"Meat sandwich","ساندويشة تونة":"Tuna sandwich","كلوب ساندويش":"Club sandwich","شكشوكة":"Shakshuka","كفتة بالصينية":"Baked kofta tray","فلفل محشي":"Stuffed peppers","مندي":"Mandi","تشيز كيك":"Cheesecake","تيراميسو":"Tiramisu","براوني":"Brownie","مافن":"Muffin","فطيرة تفاح":"Apple pie","ليمون":"Lemon","أرضي شوكي":"Artichoke","يقطين مطبوخ":"Pumpkin, cooked","خبز فرنسي (باغيت)":"Baguette","قشطة (فاكهة)":"Custard apple"
};
const EN_WORDS = {
// تصنيفات
"خبز ونشويات":"Bread & starches","لحوم ودجاج":"Meat & chicken","أسماك":"Fish","ألبان وبيض":"Dairy & eggs","بقوليات":"Legumes","خضار":"Vegetables","فواكه":"Fruit","مكسرات وبذور":"Nuts & seeds","زيوت وصلصات":"Oils & sauces","أكلات شرقية":"Middle Eastern","وجبات سريعة":"Fast food","حلويات":"Desserts","مشروبات":"Drinks","أكلات عالمية":"International","أكلاتي":"My foods","الكل":"All","من صورة":"From photo",
// وحدات
"رغيف":"loaf","شريحة":"slice","قطعة":"piece","كاسة":"cup","ملعقة كبيرة":"tbsp","ملعقة صغيرة":"tsp","حبة وسط":"medium","صحن وسط":"medium plate","حبة":"piece","كوز":"cob","صدر":"breast","فخذ":"thigh","سيخ":"skewer","صحن صغير":"small plate","قرص":"patty","فيليه":"fillet","علبة":"can","صحن":"plate","بيضة":"egg","حفنة":"handful","مثلث":"triangle","فص":"clove","باقة":"bunch","عنقود صغير":"small bunch","سندويشة":"sandwich","زبدية":"bowl","كيس صغير":"small bag","لوح صغير":"small bar","مربع":"square","كرة":"scoop","فنجان":"small cup","حصة":"serving",
// أنواع عامة
"بطاطا":"Potato dish","بيتزا":"Pizza","خبز / معجنات":"Bread / pastry","سلطة":"Salad","سمك / مأكولات بحرية":"Fish / seafood","شوربة":"Soup","طبق":"Dish","طبق بيض":"Egg dish","طبق جبنة":"Cheese dish","طبق خضار":"Vegetable dish","طبق دجاج":"Chicken dish","طبق رز":"Rice dish","طبق لحمة":"Meat dish","فطائر / بان كيك":"Pancakes / crêpes","مشروب":"Drink","معجنات محشية":"Stuffed pastry","معكرونة / نودلز":"Pasta / noodles","مقلي":"Fried food","يخنة / طبخة":"Stew",
// وجبات
"فطور":"Breakfast","غداء":"Lunch","عشاء":"Dinner","سناك":"Snack",
// الواجهة
"حريره":"Harira","اليوم":"Today","مبارح":"Yesterday","أضف أكلة":"Add food","من صورة":"From photo","سعرة":"kcal","باقي":"Left","زيادة":"Over","بروتين":"Protein","كربوهيدرات":"Carbs","دهون":"Fat","آخر ٧ أيام":"Last 7 days","الخط = هدفك":"Line = your goal","اختار أكلة":"Pick a food","صوّر صحنك":"Snap your plate",
"المي":"Water","الوزن":"Weight","سجّل وزنك":"Log weight","وزنك اليوم":"Today's weight","الوزن بالكيلو":"Weight (kg)","احفظ":"Save","هدفك اليومي":"Daily goal","ذكر":"Male","أنثى":"Female","العمر":"Age","الطول (سم)":"Height (cm)","الوزن (كغ)":"Weight (kg)","النشاط":"Activity","هدفك":"Goal","السعرات اليومية":"Daily calories",
"قليل الحركة (مكتب)":"Sedentary (desk job)","خفيف (رياضة ١-٣ أيام)":"Light (exercise 1–3 days)","متوسط (٣-٥ أيام)":"Moderate (3–5 days)","عالي (٦-٧ أيام)":"High (6–7 days)","عالي جداً (شغل بدني)":"Very high (physical work)","تنزيل وزن":"Lose weight","تثبيت الوزن":"Maintain weight","زيادة وزن / عضل":"Gain weight / muscle",
"عبّي معلوماتك وبحسبلك احتياجك، أو اكتب رقمك بإيدك تحت.":"Fill in your details and I'll calculate your needs, or type your own number below.",
"الحساب تقريبي. إذا عندك حالة صحية أو حمل أو بدك تنزل كتير، استشير طبيب أو أخصائي تغذية.":"This is an estimate. If you have a health condition, are pregnant, or want to lose a lot, consult a doctor or dietitian.",
"عبّي العمر والطول والوزن بأرقام صحيحة.":"Enter a valid age, height and weight.",
"دوّر: رز، شاورما، تفاح…":"Search: rice, shawarma, apple…","المفضلة والأخيرة":"Favorites & recent","+ أكلة مو موجودة؟ أضفها لأكلاتي":"+ Not listed? Add it to My foods",
"القيم تقريبية لكل ١٠٠ غرام، وبتختلف حسب طريقة الطبخ والمكونات.":"Values are approximate per 100 g and vary with cooking method and ingredients.",
"اختار الأكلة اللي بالصورة، وبتعلّمها للمرة الجاية.":"Pick the food in the photo and the app will learn it for next time.","إلغاء":"Cancel",
"جرّب اسم تاني، أو أضفها لأكلاتي من الزر تحت.":"Try another name, or add it to My foods with the button below.",
"أكلة جديدة لأكلاتي":"New food for My foods","الاسم":"Name","السعرات بكل ١٠٠ غرام":"Calories per 100 g","الوحدة":"Unit","غرامات الوحدة":"Grams per unit","احفظ واستعملها":"Save and use",
"إذا ما بتعرفها، اكتب رقم أكلة بتشبهها من القائمة، أو شوف المكتوب على الغلاف.":"If you don't know it, use a similar food's value from the list, or check the package label.",
"الكمية بالغرام":"Amount in grams","الوجبة":"Meal","أضف للسجل":"Add to log","نص":"half","المجموع":"Total",
"صوّر":"Take photo","اختار من المعرض":"Choose from gallery","صوّر صحنك من قريب وبضوء منيح، وأنا بقلك شو هالأكلة.":"Take a close, well-lit photo of your plate and I'll tell you what's on it.",
"التعرّف بيصير على موبايلك نفسه، بدون نت وبدون حد يومي. صوّر أكلة وحدة بكل صورة لنتيجة أدق.":"Recognition runs on your phone, offline and unlimited.",
"عم جهّز المحلل لأول مرة…":"Preparing the analyzer for the first time…","عم اتعرّف على الأكلة…":"Recognizing your food…","عم حلل أونلاين، ممكن ياخد دقيقة…":"Analyzing online, may take a minute…","رجوع للاقتراحات":"Back to suggestions",
"جرّب مرة تانية":"Try again","دوّر بالأسماء":"Search by name","حجم الصحن:":"Plate size:","صغيرة":"Small","وسط":"Medium","كبيرة":"Large","بالصحن:":"On the plate:","⭐ تعلّمت هالصحن منك قبل:":"⭐ Learned this plate from you:","⭐ تعلّمته من مستخدمين تانيين:":"⭐ Learned from other users:",
"في شي غلط أو ناقص؟ كبّس لتضيفه:":"Something wrong or missing? Tap to add:","الأوزان تقديرية حسب الحصة المعتادة. شيل الصح عن الغلط وعدّل الغرامات، والتطبيق بيتعلّم من اختيارك.":"Weights are estimates based on typical portions. Untick wrong items and adjust grams — the app learns from your choices.",
"أكلة مو موجودة؟ دوّر عليها وعلّمني ياها":"Food missing? Find it and teach me","تحليل أونلاين (أبطأ)":"Online analysis (slower)","صورة جديدة":"New photo",
"ما قدرت ميّز أكل بهالصورة. جرّب صورة أقرب وأوضح.":"I couldn't spot food in this photo. Try a closer, clearer shot.",
"ما قدرت شغّل المحلل على هالموبايل. جرّب مرة تانية، أو دوّر على الأكلة بالاسم.":"Couldn't start the analyzer on this phone. Try again or search by name.",
"أول مرة المحلل بيحتاج إنترنت ليتحمّل. اتصل بالنت وجرّب.":"The analyzer needs internet the first time to download. Connect and try again.",
"في نسخة جديدة من التطبيق":"A new version of the app is available","نزّلها":"Download","لاحقاً":"Later","اللغة":"Language",
};
// كلمات داخل جمل مركّبة (الأطول أولاً)
const EN_PARTS = Object.entries({
"انضافت:":"Added:","انضاف":"Added","أصناف":"items","سعرة/١٠٠غ":"kcal/100g","/١٠٠غ":"/100g","سعرة باليوم":"kcal per day","سعرة":"kcal","كاسات":"cups","غرام":"g","تقريباً":"about","ثقة":"confidence","آخر وزن:":"Last:","سجّل":"log","كغ":"kg","الهدف:":"Goal:",
"حرقك وانت مرتاح":"Resting burn","مع نشاطك":"With activity","المقترح لهدفك:":"Suggested for your goal:","تعلّمتها منك":"learned from you","ما لقيت":"No results for","ما سجلت شي اليوم لسا.":"Nothing logged today yet.","ما سجلت شي بهاليوم لسا.":"Nothing logged this day.",
"انضافت للمفضلة":"Added to favorites","انشالت من المفضلة":"Removed from favorites","اختار أكلة وحدة على الأقل":"Pick at least one food","اكتب رقم بين ٨٠٠ و٦٠٠٠":"Enter a number between 800 and 6000","اكتب وزن صحيح بالكيلو":"Enter a valid weight in kg",
"عم اقرأ الباركود…":"Reading barcode…","عم دوّر على المنتج…":"Looking up product…","ما قدرت اقرأ الباركود. قرّب الكاميرا وخلّي الخطوط واضحة.":"Couldn't read the barcode. Move closer so the lines are sharp.",
"ما لقيت هالمنتج بالقاعدة العالمية. أضفه لأكلاتي من المكتوب على الغلاف.":"Product not found in the global database. Add it from the package label.","منتج":"Product","من صورة":"from photo","حصة":"serving",
}).sort((a, b) => b[0].length - a[0].length);

const AR_DIGITS = /[٠-٩٬٫]/g;
const toLatin = s => s.replace(AR_DIGITS, c => c === "٬" ? "," : c === "٫" ? "." : String("٠١٢٣٤٥٦٧٨٩".indexOf(c)));
function trEN(text) {
  const t = text.trim();
  if (!t) return text;
  let out = EN_FOODS[t] || EN_WORDS[t] || (t === "غ" ? "g" : t === "غرام" ? "g" : null);
  if (!out) {
    out = t;
    for (const [k, v] of Object.entries(EN_FOODS)) if (out.includes(k)) out = out.split(k).join(v);
    for (const [k, v] of EN_PARTS) if (out.includes(k)) out = out.split(k).join(v);
    for (const [k, v] of Object.entries(EN_WORDS)) if (k.length > 2 && out.includes(k)) out = out.split(k).join(v);
    out = out.replace(/٪/g, "%").replace(/([\d٠-٩])\s*غ(?![\u0600-\u06FF])/g, "$1 g").replace(/^غ$/, "g");
  }
  return text.replace(t, toLatin(out));
}
function translateDOM(root) {
  if (LANG !== "en" || !root) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const nodes = []; while (w.nextNode()) nodes.push(w.currentNode);
  for (const n of nodes) if (/[؀-ۿ]/.test(n.nodeValue)) n.nodeValue = trEN(n.nodeValue);
  root.querySelectorAll && root.querySelectorAll("[placeholder],[aria-label],[title]").forEach(el => {
    for (const a of ["placeholder", "aria-label", "title"]) { const v = el.getAttribute(a); if (v && /[؀-ۿ]/.test(v)) el.setAttribute(a, trEN(v)); }
  });
}
// أي تغيير بالصفحة بيترجم لحاله
if (LANG === "en") new MutationObserver(ms => { for (const m of ms) for (const n of m.addedNodes) { if (n.nodeType === 1) translateDOM(n); else if (n.nodeType === 3 && /[؀-ۿ]/.test(n.nodeValue)) n.nodeValue = trEN(n.nodeValue); } })
  .observe(document.documentElement, { childList: true, subtree: true });
document.addEventListener("DOMContentLoaded", () => translateDOM(document.body));
const foodName = n => LANG === "en" ? (EN_FOODS[n] || n) : n;
