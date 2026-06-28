const fs = require('fs');
const path = require('path');

// ── Targets ──
const TARGET_TOTAL = 1000;
const SEED = 2026;

// ── Category meta (matching existing quests.json format) ──
const CATS = {
  drawing:     { code: "DRW", icon: "🎨", color: "#6366f1", sources: ["Drawabox", "Proko Figure Basics", "Michael Hampton", "Scott Robertson HTDRAW", "Perspective Handbook"] },
  anatomy:     { code: "ANA", icon: "🦴", color: "#ec4899", sources: ["Bridgman", "Michael Hampton", "Christopher Hart", "Atlas of Human Anatomy", "Proko Anatomy"] },
  animation:   { code: "ANM", icon: "🎬", color: "#10b981", sources: ["Richard Williams", "Animation Mentor", "12 Principles", "Alan Becker", "Blender Animation"] },
  effects:     { code: "VFX", icon: "✨", color: "#f59e0b", sources: ["Elemental Magic", "FX Animation Guide", "Ufotable/Trigger", "The VFX Handbook", "Houdini for Artists"] },
  storytelling:{ code: "STY", icon: "📖", color: "#8b5cf6", sources: ["Framed Ink", "Scott McCloud", "Storyboard Essentials", "Pixar Storytelling", "Visual Storytelling"] }
};

// ── Difficulty config ──
const DIFFS = {
  novice:       { xp: [40,70],  time: [15,30],  ml: 1,  sb: 1.0, rank: 0 },
  intermediate: { xp: [70,120], time: [25,50],  ml: 5,  sb: 1.0, rank: 1 },
  advanced:     { xp: [120,220],time: [40,80],  ml: 13, sb: 1.1, rank: 2 },
  master:       { xp: [200,350],time: [60,120], ml: 21, sb: 1.2, rank: 3 },
  expert:       { xp: [300,550],time: [80,180], ml: 31, sb: 1.2, rank: 4 }
};
const DIFF_LIST = ["novice","intermediate","advanced","master","expert"];
const CAT_LIST = ["drawing","anatomy","animation","effects","storytelling"];

// ── Subject pools (ru) ──
const SUBJECTS_RU = {
  drawing: [
    "куба", "сферы", "цилиндра", "конуса", "призмы", "пирамиды",
    "чайника", "вазы", "книги", "свечи", "кольца", "ключа",
    "фрукта (яблоко/груша)", "овоща (перец/баклажан)", "ракушки",
    "листа дерева", "цветка", "камня/скалы", "дерева (ствол)",
    "окна", "двери", "лестницы", "мостика", "фонарного столба",
    "велосипедной рамы", "гитары", "часов", "очков", "зонтика",
    "шляпы", "перчатки", "ремня/сумки", "складного стула",
    "фонтана", "колонны", "арки", "статуи", "автомобиля (ретро)",
    "лодки", "палатки", "фонаря", "замка́", "башни",
    "рожка мороженого", "бутылки", "кастрюли", "чайной пары",
    "подсвечника", "шкатулки"
  ],
  anatomy: [
    "плечевого пояса", "таза в наклоне", "позвоночника (изгибы)",
    "ключа и лопатки", "коленного сустава", "локтевого сустава",
    "лучезапястного сустава", "голеностопа", "шеи и трапеции",
    "мышц спины (широчайшие)", "грудных мышц", "пресса",
    "ягодичных мышц", "бицепса/трицепса", "предплечья",
    "икроножных мышц", "стопы в перспективе", "кисти в кулаке",
    "пальцев (жест)", "ушной раковины", "носа (разные типы)",
    "глаза в профиль", "губ (разные выражения)", "черепа (3/4)",
    "челюсти и подбородка", "ключицы в движении", "рёберной дуги",
    "лопатки при отведении руки", "позвонков (поясница)",
    "седалищного бугра", "бедренной кости", "большеберцовой кости",
    "ахиллова сухожилия", "мышц шеи (грудино-ключично-сосцевидная)",
    "дельтовидной мышцы", "мышц предплечья (pronation/supination)",
    "подколенного сухожилия", "квадрицепса",
    "мимики: гнева", "мимики: страха", "мимики: отвращения",
    "мимики: удивления", "мимики: печали", "мимики: радости"
  ],
  animation: [
    "качающегося маятника", "вращающегося волчка",
    "падающего листа", "летящего мяча (бейсбол)",
    "надувающегося шара", "лопающегося пузыря",
    "пружины (сжатие/растяжение)", "качелей",
    "раскачивающейся верёвки", "флага на ветру",
    "занавески (открытие)", "дверцы шкафа",
    "выдвигающегося ящика", "падающей книги",
    "разбивающегося стакана", "напильника (рука туда-сюда)",
    "кисти руки (жест хватания)", "указующего перста",
    "поворота головы (шейный)", "подмигивания",
    "зевания", "чихания", "смеха (плечи/корпус)",
    "плача (утрирование)", "пожимания плечами",
    "спотыкания", "вставания со стула",
    "падения на спину", "лазанья по лестнице",
    "перешагивания через препятствие", "приседания",
    "потягивания (пробуждение)", "засыпания (крэнк)",
    "удивлённого подскока", "принюхивания",
    "вытирания пота со лба", "почёсывания затылка",
    "качания головой (несогласие)", "кивка (согласие)",
    "вращения дверной ручки", "нажатия кнопки"
  ],
  effects: [
    "водопада", "фонтана (брызги)", "дождя (ливень)",
    "снегопада", "града", "тумана (с рассеиванием)",
    "дыма (промышленного)", "пара от дыхания",
    "огня (костёр)", "пламени (факел)", "взрыва (гриб)",
    "искр от точила", "электрической дуги (молния)",
    "энергетического щита", "магического барьера",
    "светового меча", "портала (открытие)", "телепортации",
    "левитации объекта", "пузырей магии",
    "кристалла энергии", "силового поля",
    "заклинания (огненный шар)", "ледяного шипа",
    "ветряного вихря", "земляной стены",
    "тёмной сферы", "святого сияния",
    "ядовитого облака", "кислотной лужи",
    "лавы (пузырение)", "магмы",
    "песчаной бури", "пылевого облака",
    "разрушения стены", "падения колонны",
    "трещины на стекле", "ряби на воде",
    "приливной волны", "торнадо"
  ],
  storytelling: [
    "ожидания (тишина перед бурей)", "разочарования",
    "облегчения после опасности", "момента принятия решения",
    "предательства (жест)", "прощения",
    "расставания на вокзале", "воссоединения после долгой разлуки",
    "тайной передачи записки", "подслушанного разговора",
    "напряжённого молчания (дуэль)", "победы (триумф)",
    "поражения (смирение)", "жертвы (самопожертвование)",
    "угрозы (нависающая опасность)", "спасения (в последний момент)",
    "неожиданного открытия", "разоблачения (ложь раскрыта)",
    "утраты (потеря близкого)", "надежды (рассвет после тьмы)",
    "ссоры за столом", "примирения через объятия",
    "одиночества в толпе", "вдохновения (озарение идеей)",
    "скуки (ожидание в очереди)", "любопытства (изучает карту)",
    "страха перед входом в тёмную комнату",
    "радости от неожиданного подарка",
    "гордости (смотрит на свою работу)",
    "стыда (покраснел/отвёл взгляд)",
    "замешательства (не знает, как реагировать)",
    "тайного заговора (шёпот)", "приказа (властный жест)",
    "извинения (виноватый взгляд)", "подбадривания",
    "утешения (плечо/объятие)", "соперничества (взгляд глаза в глаза)",
    "соревнования (финишная черта)", "путешествия (прощание с домом)",
    "возвращения (встреча у порога)"
  ]
};

const SUBJECTS_EN = {
  drawing: [
    "cube", "sphere", "cylinder", "cone", "prism", "pyramid",
    "teapot", "vase", "book", "candle", "ring", "key",
    "fruit (apple/pear)", "vegetable (pepper/eggplant)", "seashell",
    "tree leaf", "flower", "rock/cliff", "tree (trunk)",
    "window", "door", "staircase", "small bridge", "lamppost",
    "bicycle frame", "guitar", "watch", "glasses", "umbrella",
    "hat", "glove", "belt/bag", "folding chair",
    "fountain", "column", "arch", "statue", "car (vintage)",
    "boat", "tent", "lantern", "castle", "tower",
    "ice cream cone", "bottle", "saucepan", "tea set",
    "candlestick", "jewelry box"
  ],
  anatomy: [
    "shoulder girdle", "pelvis (tilted)", "spine (curves)",
    "collarbone & scapula", "knee joint", "elbow joint",
    "wrist joint", "ankle", "neck & trapezius",
    "back muscles (lats)", "pectorals", "abs",
    "glutes", "biceps/triceps", "forearm",
    "calves", "foot in perspective", "fist hand",
    "fingers (gesture)", "ear shape", "nose (various types)",
    "eye in profile", "lips (expressions)", "skull (3/4)",
    "jaw & chin", "clavicle in motion", "rib cage",
    "scapula (arm abducted)", "vertebrae (lumbar)",
    "sitting bone (ischium)", "femur", "tibia",
    "achilles tendon", "neck muscles (SCM)",
    "deltoid", "forearm muscles (pronation/supination)",
    "hamstring", "quadriceps",
    "expression: anger", "expression: fear", "expression: disgust",
    "expression: surprise", "expression: sadness", "expression: joy"
  ],
  animation: [
    "swinging pendulum", "spinning top",
    "falling leaf", "flying ball (baseball)",
    "inflating balloon", "popping bubble",
    "spring (squash/stretch)", "swing",
    "swinging rope", "flag in wind",
    "curtain (opening)", "cabinet door",
    "sliding drawer", "falling book",
    "breaking glass", "filing motion (hand back/forth)",
    "hand gesture (grasping)", "pointing finger",
    "head turn (neck)", "winking",
    "yawning", "sneezing", "laughing (shoulders/torso)",
    "crying (exaggerated)", "shrugging",
    "tripping", "standing up from chair",
    "falling on back", "climbing stairs",
    "stepping over obstacle", "squatting",
    "stretching (waking up)", "falling asleep (crank)",
    "surprised jump", "sniffing",
    "wiping sweat off forehead", "scratching head",
    "shaking head (disagreement)", "nodding (agreement)",
    "turning doorknob", "pressing button"
  ],
  effects: [
    "waterfall", "fountain (splash)", "rain (downpour)",
    "snowfall", "hail", "fog (dissipating)",
    "smoke (industrial)", "breath vapor",
    "fire (campfire)", "flame (torch)", "explosion (mushroom)",
    "sparks from grinder", "electric arc (lightning)",
    "energy shield", "magic barrier",
    "lightsaber", "portal (opening)", "teleportation",
    "object levitation", "magic bubbles",
    "energy crystal", "force field",
    "spell (fireball)", "ice spike",
    "wind vortex", "earthen wall",
    "dark sphere", "holy radiance",
    "poison cloud", "acid puddle",
    "lava (bubbling)", "magma",
    "sandstorm", "dust cloud",
    "wall destruction", "falling column",
    "glass crack", "water ripple",
    "tidal wave", "tornado"
  ],
  storytelling: [
    "anticipation (calm before storm)", "disappointment",
    "relief after danger", "decision moment",
    "betrayal (gesture)", "forgiveness",
    "farewell at station", "reunion after long separation",
    "secret note passing", "overheard conversation",
    "tense silence (duel)", "victory (triumph)",
    "defeat (resignation)", "sacrifice (self-sacrifice)",
    "threat (looming danger)", "rescue (last moment)",
    "unexpected discovery", "exposure (lie revealed)",
    "loss (grief)", "hope (dawn after darkness)",
    "argument at table", "reconciliation through hug",
    "loneliness in crowd", "inspiration (epiphany)",
    "boredom (waiting in line)", "curiosity (studying map)",
    "fear before entering dark room",
    "joy from unexpected gift",
    "pride (looking at own work)",
    "shame (blushed/looked away)",
    "bewilderment (unsure how to react)",
    "secret conspiracy (whisper)", "command (authoritative gesture)",
    "apology (guilty look)", "encouragement",
    "comfort (shoulder/hug)", "rivalry (eye to eye)",
    "competition (finish line)", "journey (farewell to home)",
    "return (meeting at doorstep)"
  ]
};

// ── Exercise templates (per category/difficulty) ──
// Matches style of existing generate_quests.js but more varied
const EXERCISES = {};

CAT_LIST.forEach(cat => {
  EXERCISES[cat] = {};
  DIFF_LIST.forEach(diff => {
    EXERCISES[cat][diff] = [];
  });
});

// Helper to push templates
function tmpl(cat, diff, t_ru, t_en, d_ru, d_en, tags, m, rep, rev) {
  EXERCISES[cat][diff].push({
    t_ru, t_en, d_ru, d_en,
    tags: tags || [],
    m: m || "both",
    rep: rep || false,
    rev: rev || 0
  });
}

// ── DRAWING ──
// novice
tmpl("drawing","novice",
  "Gesture sketch: {} ({1} сек)", "Gesture sketch: {} ({1} sec)",
  "Захвати линию действия и энергию формы. Скорость важнее деталей.",
  "Capture line of action and form energy. Speed over details.",
  ["gesture","speed"], "both");
tmpl("drawing","novice",
  "Contour drawing: {} (blind)", "Contour drawing: {} (blind)",
  "Рисуй не глядя на лист. Зрительно-моторная координация.",
  "Draw without looking at paper. Hand-eye coordination.",
  ["contour","observation"], "traditional");
tmpl("drawing","novice",
  "Primitives: {} из базовых форм", "Primitives: {} from basic shapes",
  "Разбей объект на сферы, кубы, цилиндры. Почувствуй объём.",
  "Break object into spheres, cubes, cylinders. Feel the volume.",
  ["construction","volume"], "both");
tmpl("drawing","novice",
  "Value block-in: {} (3 тона)", "Value block-in: {} (3 tones)",
  "Раздели изображение на тёмный, средний и светлый тона.",
  "Divide the image into dark, mid, and light values.",
  ["value","blocking"], "digital");
tmpl("drawing","novice",
  "Line quality: {} (прямые/кривые)", "Line quality: {} (straight/curved)",
  "Чистые, уверенные линии. Без штриховки и растушёвки.",
  "Clean, confident lines. No hatching or blending.",
  ["linework","precision"], "both");
tmpl("drawing","novice",
  "Negative space: {}", "Negative space: {}",
  "Рисуй только пространство вокруг объекта, не сам объект.",
  "Draw only the space around the object, not the object itself.",
  ["negative-space","observation"], "traditional");
// intermediate
tmpl("drawing","intermediate",
  "Constructive drawing: {} (3/4 view)", "Constructive drawing: {} (3/4 view)",
  "Построй объект в повороте. Проверь эллипсы и перспективу.",
  "Build object in rotation. Check ellipses and perspective.",
  ["construction","perspective"], "both");
tmpl("drawing","intermediate",
  "Drapery study: {} (складки ткани)", "Drapery study: {} (fabric folds)",
  "Трубчатые, инертные, диагональные складки. Изучи механику.",
  "Pipe, inert, diagonal folds. Study the mechanics.",
  ["drapery","observation"], "traditional");
tmpl("drawing","intermediate",
  "Two-point perspective: {}", "Two-point perspective: {}",
  "Угловой ракурс с двумя точками схода. Глубина и масштаб.",
  "Angular view with two vanishing points. Depth and scale.",
  ["perspective","spatial"], "digital");
tmpl("drawing","intermediate",
  "Speed sketch: {} (5 мин)", "Speed sketch: {} (5 min)",
  "Быстрые наброски с таймером. Выбери главное, опусти детали.",
  "Quick timed sketches. Pick essentials, skip details.",
  ["speed","composition"], "both");
tmpl("drawing","intermediate",
  "Master study: {} (анализ техники)", "Master study: {} (technique analysis)",
  "Скопируй фрагмент работы мастера. Разбери их приёмы.",
  "Copy a master's fragment. Analyze their techniques.",
  ["master-study","technique"], "both");
tmpl("drawing","intermediate",
  "Texture study: {} (штрих)", "Texture study: {} (hatching)",
  "Передай фактуру предмета через разные типы штриховки.",
  "Convey surface texture through different hatching types.",
  ["texture","rendering"], "traditional");
// advanced
tmpl("drawing","advanced",
  "Foreshortening: {} (ракурс)", "Foreshortening: {} (foreshortened view)",
  "Форма направлена на зрителя. Сохрани пропорции и объём.",
  "Form aimed at viewer. Maintain proportions and volume.",
  ["foreshortening","depth"], "both");
tmpl("drawing","advanced",
  "Lighting study: {} (3 setup)", "Lighting study: {} (3 setups)",
  "Верхний, боковой и контровой свет. Сравни влияние на форму.",
  "Top, side, rim lighting. Compare effect on form.",
  ["lighting","study"], "digital");
tmpl("drawing","advanced",
  "Memory drawing: {} (без референса)", "Memory drawing: {} (no reference)",
  "Нарисуй по памяти. Проверь свою визуальную библиотеку.",
  "Draw from memory. Test your visual library.",
  ["memory","imagination"], "both");
tmpl("drawing","advanced",
  "Cross-hatching: {} (сложная штриховка)", "Cross-hatching: {} (complex)",
  "Сочетай перекрёстную штриховку, stippling и мягкие переходы.",
  "Combine cross-hatching, stippling, and soft blending.",
  ["technique","hybrid"], "traditional");
tmpl("drawing","advanced",
  "Color study: {} (ограниченная палитра)", "Color study: {} (limited palette)",
  "Используй 4-5 цветов. Передай форму и настроение.",
  "Use 4-5 colors. Convey form and mood.",
  ["color","limitation"], "digital");
tmpl("drawing","advanced",
  "Environment element: {} (детализация)", "Environment element: {} (detailing)",
  "Проработай объект окружения с высокой детализацией.",
  "Detail an environment object with high polish.",
  ["environment","detail"], "both", true);
// master
tmpl("drawing","master",
  "Composition search: {} (5 thumbnails)", "Composition search: {} (5 thumbs)",
  "Попробуй 5 разных композиций. Правило третей, ведущие линии.",
  "Try 5 different compositions. Rule of thirds, leading lines.",
  ["composition","thumbnails"], "both");
tmpl("drawing","master",
  "Portrait: {} (характер + свет)", "Portrait: {} (character + light)",
  "Синтез анатомии и личности. Работа с настроением через свет.",
  "Synthesize anatomy and personality. Mood through lighting.",
  ["portrait","expression"], "digital");
tmpl("drawing","master",
  "Full render: {} (полировка)", "Full render: {} (polish)",
  "Чистота линий, плавные градиенты, внимание к краям.",
  "Clean lines, smooth gradients, attention to edges.",
  ["render","polish"], "digital", true, 14);
tmpl("drawing","master",
  "Global lighting: {} (bounce light)", "Global lighting: {} (bounce light)",
  "Отражённый свет, цветовые рефлексы, мягкие тени.",
  "Bounce light, color reflections, soft shadows.",
  ["lighting","interior"], "digital");
tmpl("drawing","master",
  "Stylization: {} (под стиль)", "Stylization: {} (in chosen style)",
  "Переработай реалистичный объект в конкретный арт-стиль.",
  "Transform realistic object into specific art style.",
  ["stylization","design"], "both");
tmpl("drawing","master",
  "Technique copy: {} (разбор)", "Technique copy: {} (breakdown)",
  "Разбери приёмы художника: ритм, края, экономия средств.",
  "Analyze artist's techniques: rhythm, edges, economy.",
  ["master-study","analysis"], "both");
// expert
tmpl("drawing","expert",
  "Portfolio piece: {} (проф уровень)", "Portfolio piece: {} (pro level)",
  "Финальная работа для портфолио. Чистота, цельность.",
  "Final portfolio work. Cleanliness, wholeness.",
  ["portfolio","final"], "digital");
tmpl("drawing","expert",
  "Industry brief: {} (ТЗ)", "Industry brief: {} (spec)",
  "Работа по техническому заданию. Стиль, сроки, экспорт.",
  "Work from technical spec. Style, deadlines, export.",
  ["industry","brief"], "both");
tmpl("drawing","expert",
  "Multi-element scene: {}", "Multi-element scene: {}",
  "Сложная сцена с несколькими объектами. Композиция, перспектива.",
  "Complex scene with multiple objects. Composition, perspective.",
  ["scene","composition"], "digital", true);
tmpl("drawing","expert",
  "Speed challenge: {} (2 часа)", "Speed challenge: {} (2 hours)",
  "Полный рисунок за 2 часа. Фокус на главном, без лишнего.",
  "Full drawing in 2 hours. Focus on essentials only.",
  ["speed","challenge"], "both", true);
tmpl("drawing","expert",
  "Atmospheric perspective: {}", "Atmospheric perspective: {}",
  "Глубина через воздушную перспективу: контраст, цвет, размытие.",
  "Depth via atmospheric perspective: contrast, color, blur.",
  ["atmosphere","depth"], "digital");
tmpl("drawing","expert",
  "Visual development: {} (3 итерации)", "Visual development: {} (3 iterations)",
  "Создай 3 варианта дизайна. Выбери лучший и доработай.",
  "Create 3 design variants. Choose best and refine.",
  ["dev","iteration"], "digital", true, 7);

// ── ANATOMY ──
tmpl("anatomy","novice",
  "Gesture figure: {} ({1} сек)", "Gesture figure: {} ({1} sec)",
  "Линия действия, центр тяжести, общая динамика позы.",
  "Line of action, center of gravity, overall pose dynamics.",
  ["gesture","rhythm"], "both");
tmpl("anatomy","novice",
  "Proportions: {} (метод голов)", "Proportions: {} (heads method)",
  "Построение по каноническим пропорциям (7.5-8 голов).",
  "Build using canonical proportions (7.5-8 heads).",
  ["proportions","canonical"], "both");
tmpl("anatomy","novice",
  "Simplified skeleton: {}", "Simplified skeleton: {}",
  "Костные ориентиры и их влияние на внешнюю форму тела.",
  "Bony landmarks and their influence on outer body form.",
  ["skeleton","landmarks"], "traditional");
tmpl("anatomy","novice",
  "Block figure: {} (массы)", "Block figure: {} (masses)",
  "Замени мышцы на коробки и цилиндры. 3D-мышление.",
  "Replace muscles with boxes and cylinders. 3D thinking.",
  ["construction","mass"], "both");
tmpl("anatomy","novice",
  "Bony landmarks: {} (пальпация)", "Bony landmarks: {} (palpation)",
  "Отметь ключевые костные точки, видимые под кожей.",
  "Mark key bony points visible under the skin.",
  ["anatomy","reference"], "traditional");
tmpl("anatomy","novice",
  "Major muscles: {} (mapping)", "Major muscles: {} (mapping)",
  "Нанеси основные мышечные группы на упрощённую фигуру.",
  "Map major muscle groups onto a simplified figure.",
  ["muscles","mapping"], "digital");
// intermediate
tmpl("anatomy","intermediate",
  "Torso twist: {}", "Torso twist: {}",
  "Вращение грудной клетки и таза. Позвоночник в скручивании.",
  "Ribcage and pelvis rotation. Spine in torsion.",
  ["torso","twist"], "both");
tmpl("anatomy","intermediate",
  "Limbs: {} (суставы/рычаги)", "Limbs: {} (joints/levers)",
  "Построение конечностей через цилиндры и точки сгиба.",
  "Build limbs via cylinders and flex points.",
  ["limbs","joints"], "traditional");
tmpl("anatomy","intermediate",
  "Hand: {} (ладонь + пальцы)", "Hand: {} (palm + fingers)",
  "Упрощение сложной структуры кисти для быстрого рисунка.",
  "Simplify complex hand structure for quick drawing.",
  ["hands","construction"], "both");
tmpl("anatomy","intermediate",
  "Face: {} (Loomis/Reilly метод)", "Face: {} (Loomis/Reilly method)",
  "Построение головы в разных ракурсах с разметкой лица.",
  "Construct head in various angles with facial mapping.",
  ["head","proportions"], "digital");
tmpl("anatomy","intermediate",
  "Dynamic pose: {} (вес/баланс)", "Dynamic pose: {} (weight/balance)",
  "Передача опоры, баланса и напряжения через позу.",
  "Convey support, balance, tension through pose.",
  ["pose","balance"], "both");
tmpl("anatomy","intermediate",
  "Muscle map: {} (наложение)", "Muscle map: {} (overlay)",
  "Наложи анатомические формы на упрощённый манекен.",
  "Overlay anatomical forms onto a simplified mannequin.",
  ["muscle","layering"], "digital");
// advanced
tmpl("anatomy","advanced",
  "Foreshortened figure: {}", "Foreshortened figure: {}",
  "Фигура в сильном ракурсе. Сохрани пропорции при сокращении.",
  "Figure in strong perspective. Maintain proportions under foreshortening.",
  ["foreshortening","depth"], "both");
tmpl("anatomy","advanced",
  "Muscle function: {} (действие)", "Muscle function: {} (action)",
  "Как мышцы сокращаются и растягиваются в конкретном движении.",
  "How muscles contract and stretch in specific movement.",
  ["kinetics","function"], "both");
tmpl("anatomy","advanced",
  "Anatomy under clothing: {}", "Anatomy under clothing: {}",
  "Чтение форм тела сквозь ткань разной плотности.",
  "Read body forms through fabrics of varying density.",
  ["drapery","underlying"], "traditional");
tmpl("anatomy","advanced",
  "Variations: {} (возраст/тип)", "Variations: {} (age/body type)",
  "Адаптируй пропорции под разные возраст и тип телосложения.",
  "Adapt proportions for different ages and body types.",
  ["variation","body-types"], "both");
tmpl("anatomy","advanced",
  "Facial expression: {} (sus мышцы лица)", "Facial expression: {} (via face muscles)",
  "Изучи связь мимических мышц с выражением эмоций.",
  "Study connection of facial muscles with emotional expression.",
  ["expression","face"], "traditional");
tmpl("anatomy","advanced",
  "Quick anatomy: {} (5 min)", "Quick anatomy: {} (5 min)",
  "Синтез жеста, конструкции и основных мышц под таймером.",
  "Synthesize gesture, construction, major muscles under timer.",
  ["speed","integration"], "both", true);
// master
tmpl("anatomy","master",
  "Anatomical breakdown: {} (слои)", "Anatomical breakdown: {} (layers)",
  "Кость → мышца → жир → кожа. Точное отображение слоёв.",
  "Bone → muscle → fat → skin. Accurate layer display.",
  ["medical","layers"], "digital");
tmpl("anatomy","master",
  "Stylization: {} (anime/realism)", "Stylization: {} (anime/realism)",
  "Упрости или преувеличь анатомию под выбранный стиль.",
  "Simplify or exaggerate anatomy for chosen style.",
  ["stylization","design"], "both");
tmpl("anatomy","master",
  "Weight distribution: {} (на опорах)", "Weight distribution: {} (on supports)",
  "Как тело компенсирует нагрузку, наклон и инерцию.",
  "How body compensates for load, tilt, inertia.",
  ["weight","balance"], "traditional");
tmpl("anatomy","master",
  "Complex pose: {} (перекрытие)", "Complex pose: {} (overlap)",
  "Перекрытие конечностей, скручивание, баланс в сложной позе.",
  "Limb overlap, twist, balance in complex pose.",
  ["complex-pose","overlap"], "both");
tmpl("anatomy","master",
  "Turnaround: {} (front/side)", "Turnaround: {} (front/side)",
  "Сохрани единообразие пропорций во всех ракурсах.",
  "Maintain consistent proportions across all views.",
  ["turnaround","consistency"], "digital");
tmpl("anatomy","master",
  "Master anatomy analysis: {}", "Master anatomy analysis: {}",
  "Как классики решали анатомические задачи. Разбор приёмов.",
  "How classics solved anatomy problems. Technique breakdown.",
  ["master-study","analysis"], "both");
// expert
tmpl("anatomy","expert",
  "Figure portfolio piece: {}", "Figure portfolio piece: {}",
  "Профессиональный уровень: точность, экспрессия, чистота.",
  "Pro level: accuracy, expression, cleanliness.",
  ["portfolio","final"], "digital");
tmpl("anatomy","expert",
  "Animation anatomy: {} (упрощение)", "Animation anatomy: {} (simplification)",
  "Упрощение форм для быстрого построения в анимации.",
  "Simplify forms for quick construction in animation.",
  ["animation-ready","simplification"], "digital", true);
tmpl("anatomy","expert",
  "Creature anatomy: {} (bio-mechanics)", "Creature anatomy: {} (bio-mechanics)",
  "Сконструируй биомеханику вымышленного существа.",
  "Construct biomechanics of an imaginary creature.",
  ["creature","design"], "both");
tmpl("anatomy","expert",
  "Body acting: {} (через позу)", "Body acting: {} (through pose)",
  "Передай намерение, эмоцию и характер только через анатомию.",
  "Convey intent, emotion, character via anatomy alone.",
  ["acting","character"], "traditional");
tmpl("anatomy","expert",
  "Technical drawing: {} (с размерами)", "Technical drawing: {} (measured)",
  "Подготовь анатомический лист для моделирования/риггинга.",
  "Prepare anatomical sheet for modeling/rigging.",
  ["technical","production"], "digital");
tmpl("anatomy","expert",
  "Industry task: {} (по брифу)", "Industry task: {} (from brief)",
  "Соответствие требованиям студии: читаемость, стиль, сроки.",
  "Meet studio requirements: legibility, style, deadlines.",
  ["industry","brief"], "both", true);

// ── ANIMATION ──
tmpl("animation","novice",
  "Timing chart: ball bounce ({1} frames)", "Timing chart: ball bounce ({1} frames)",
  "Базовое упражнение на ускорение/замедление и дуги движения.",
  "Basic exercise for ease-in/out and motion arcs.",
  ["timing","arcs"], "both");
tmpl("animation","novice",
  "Squash & stretch: {}", "Squash & stretch: {}",
  "Сохрани объём при деформации формы в движении.",
  "Preserve volume during form deformation in motion.",
  ["squash-stretch","volume"], "both");
tmpl("animation","novice",
  "Motion arcs: {} (keyframes)", "Motion arcs: {} (keyframes)",
  "Плавные траектории. Избегай механических прямых линий.",
  "Smooth trajectories. Avoid mechanical straight lines.",
  ["arcs","flow"], "digital");
tmpl("animation","novice",
  "Slow in/out: {}", "Slow in/out: {}",
  "Имитация инерции через распределение кадров (spacing).",
  "Imitate inertia via frame distribution (spacing).",
  ["slow-in-out","inertia"], "both");
tmpl("animation","novice",
  "Flipbook: {} ({1} frames)", "Flipbook: {} ({1} frames)",
  "Последовательность, ритм и замкнутость движения.",
  "Sequence, rhythm, and motion closure.",
  ["cycle","flipbook"], "traditional");
tmpl("animation","novice",
  "Pose to pose: {}", "Pose to pose: {}",
  "Создай ключевые кадры перед прорисовкой промежуточных.",
  "Create keyframes before inbetweening.",
  ["pose-to-pose","planning"], "both");
// intermediate
tmpl("animation","intermediate",
  "Walk cycle: {} (4 phases)", "Walk cycle: {} (4 phases)",
  "Контакт, отталкивание, проход, опускание. Перенос веса.",
  "Contact, push-off, passing, down. Weight transfer.",
  ["walk-cycle","weight"], "both");
tmpl("animation","intermediate",
  "Run cycle: {} (с фазой полёта)", "Run cycle: {} (with flight phase)",
  "Динамика, наклон корпуса, руки/ноги в противофазе.",
  "Dynamics, torso tilt, arms/legs in counterphase.",
  ["run-cycle","dynamics"], "digital");
tmpl("animation","intermediate",
  "Secondary motion: {} (follow-through)", "Secondary motion: {} (follow-through)",
  "Волосы/одежда/хвост. Follow-through и overlapping action.",
  "Hair/clothes/tail. Follow-through and overlapping action.",
  ["secondary","overlap"], "both");
tmpl("animation","intermediate",
  "Weight transfer: {} (тяжёлый/лёгкий)", "Weight transfer: {} (heavy/light)",
  "Как масса влияет на тайминг, деформацию, реакцию тела.",
  "How mass affects timing, deformation, body reaction.",
  ["weight","mass"], "both");
tmpl("animation","intermediate",
  "Anticipation: {} (перед действием)", "Anticipation: {} (before action)",
  "Подготовь зрителя к движению через обратное движение.",
  "Prepare viewer for motion via reverse movement.",
  ["anticipation","readiness"], "traditional");
tmpl("animation","intermediate",
  "Lip sync: {} (vowels/consonants)", "Lip sync: {} (vowels/consonants)",
  "Разбей речь на формы рта. Работа с таймингом фонем.",
  "Break speech into mouth shapes. Phoneme timing.",
  ["lip-sync","mouth-shapes"], "digital");
// advanced
tmpl("animation","advanced",
  "Jump: {} (landing + bounce)", "Jump: {} (landing + bounce)",
  "Сжатие перед стартом, полёт, амортизация приземления.",
  "Pre-compression, flight, landing amortization.",
  ["jump","physics"], "both");
tmpl("animation","advanced",
  "Object interaction: {}", "Object interaction: {}",
  "Как тело и объект влияют на движение друг друга.",
  "How body and object influence each other's motion.",
  ["interaction","force"], "traditional");
tmpl("animation","advanced",
  "Pantomime: {} (без слов 10-15s)", "Pantomime: {} (wordless 10-15s)",
  "Передай намерение и эмоцию через чистое движение.",
  "Convey intent and emotion through pure motion.",
  ["pantomime","acting"], "both", true);
tmpl("animation","advanced",
  "Camera animation: {} (pan/zoom)", "Camera animation: {} (pan/zoom)",
  "Синхронизируй движение камеры с действием в кадре.",
  "Sync camera movement with on-screen action.",
  ["camera","composition"], "digital");
tmpl("animation","advanced",
  "Complex cycle: {} (animal/mech)", "Complex cycle: {} (animal/mech)",
  "Нестандартная биомеханика или техническая анимация.",
  "Non-standard biomechanics or technical animation.",
  ["complex-cycle","mechanics"], "both");
tmpl("animation","advanced",
  "Acting pose: {} (character)", "Acting pose: {} (character)",
  "Выбери сильную читаемую позу, раскрывающую намерение.",
  "Choose strong readable pose revealing intent.",
  ["acting","pose"], "both");
// master
tmpl("animation","master",
  "Dialogue scene: {} (intonation)", "Dialogue scene: {} (intonation)",
  "Синхронизируй анимацию с речью, эмоцией и подтекстом.",
  "Sync animation with speech, emotion, and subtext.",
  ["dialogue","subtext"], "digital");
tmpl("animation","master",
  "Multi-character interaction: {}", "Multi-character interaction: {}",
  "Распределение фокуса, тайминг реакций, визуальный вес.",
  "Focus distribution, reaction timing, visual weight.",
  ["multi-char","focus"], "both");
tmpl("animation","master",
  "Motion stylization: {} (anime/cartoon)", "Motion stylization: {} (anime/cartoon)",
  "Преувеличение, ломка физики под стиль.",
  "Exaggeration, physics breakdown for style.",
  ["stylization","exaggeration"], "digital", true, 14);
tmpl("animation","master",
  "Scene animatic: {} (rhythm)", "Scene animatic: {} (rhythm)",
  "Тестируй тайминг, переходы и эмоциональную дугу.",
  "Test timing, transitions, and emotional arc.",
  ["animatic","pacing"], "both");
tmpl("animation","master",
  "Scene polish: {} (spacing/curves)", "Scene polish: {} (spacing/curves)",
  "Финальная доводка: чистота линий, точность дуг, мягкие ключи.",
  "Final cleanup: line clarity, arc accuracy, soft keys.",
  ["polish","curves"], "digital");
tmpl("animation","master",
  "Showreel scene: {} (pro level)", "Showreel scene: {} (pro level)",
  "Индустриальный стандарт: вес, характер, полировка.",
  "Industry standard: weight, character, polish.",
  ["reel","industry"], "digital");
// expert
tmpl("animation","expert",
  "Game cycle: {} (optimization)", "Game cycle: {} (optimization)",
  "Адаптируй под реаль-тайм: петли, переходы, вес.",
  "Adapt for real-time: loops, transitions, weight.",
  ["game-ready","optimization"], "digital", true);
tmpl("animation","expert",
  "Mocap cleanup: {} (сохранение характера)", "Mocap cleanup: {} (preserve character)",
  "Усиль читаемость, удали шум, добавь стиль.",
  "Enhance legibility, remove noise, add style.",
  ["mocap","cleanup"], "digital");
tmpl("animation","expert",
  "FX animation: {} (огонь/вода/магия)", "FX animation: {} (fire/water/magic)",
  "Тайминг энергии, сохранение объёма, слоистая анимация.",
  "Energy timing, volume preservation, layered animation.",
  ["fx-animation","energy"], "both");
tmpl("animation","expert",
  "Director's frame: {} (visual story)", "Director's frame: {} (visual story)",
  "Композиция, камера, свет и движение как единое повествование.",
  "Composition, camera, light, motion as unified narrative.",
  ["direction","story"], "both");
tmpl("animation","expert",
  "24h animation: {} (speed run)", "24h animation: {} (speed run)",
  "Интеграция всех навыков под давлением времени.",
  "Integrate all skills under time pressure.",
  ["speed","challenge"], "both", true, 3);
tmpl("animation","expert",
  "Final scene: {} (pipeline complete)", "Final scene: {} (pipeline complete)",
  "От референса до финала: тест, полировка, звук, экспорт.",
  "From ref to final: test, polish, sound, export.",
  ["production","pipeline"], "digital");

// ── EFFECTS ──
tmpl("effects","novice",
  "Basic effect shape: {}", "Basic effect shape: {}",
  "Силуэт, направление энергии, основные массы эффекта.",
  "Silhouette, energy direction, main masses of effect.",
  ["shape","energy"], "both");
tmpl("effects","novice",
  "Timing: {} (buildup/decay)", "Timing: {} (buildup/decay)",
  "Как эффект набирает силу и затухает во времени.",
  "How effect builds up and decays over time.",
  ["timing","life-cycle"], "digital");
tmpl("effects","novice",
  "2-layer effect: {} (base + detail)", "2-layer effect: {} (base + detail)",
  "Раздели эффект на основной объём и мелкие элементы.",
  "Separate effect into base volume and small elements.",
  ["layers","separation"], "digital");
tmpl("effects","novice",
  "Reference copy: {} (shape)", "Reference copy: {} (shape)",
  "Точно воспроизведи наблюдаемый эффект без упрощений.",
  "Accurately reproduce observed effect without simplification.",
  ["reference","accuracy"], "both");
tmpl("effects","novice",
  "Energy flow: {} (source → dissipation)", "Energy flow: {} (source → dissipation)",
  "Визуализируй движение силы через пространство.",
  "Visualize force movement through space.",
  ["flow","direction"], "both");
tmpl("effects","novice",
  "Simple composition: {} на фоне", "Simple composition: {} on background",
  "Размести эффект в пространстве с учётом освещения.",
  "Place effect in space considering lighting.",
  ["composition","placement"], "digital");
// intermediate
tmpl("effects","intermediate",
  "Volume retention: {} (deformation)", "Volume retention: {} (deformation)",
  "Эффект не должен схлопываться или терять массу.",
  "Effect must not collapse or lose mass.",
  ["volume","mass-retention"], "both");
tmpl("effects","intermediate",
  "Turbulence: {} (vortices)", "Turbulence: {} (vortices)",
  "Добавь хаотичность, контролируемую основным направлением.",
  "Add chaos, controlled by primary direction.",
  ["turbulence","chaos-control"], "digital");
tmpl("effects","intermediate",
  "Surface interaction: {}", "Surface interaction: {}",
  "Как эффект растекается, отскакивает или разрушает объект.",
  "How effect spreads, bounces, or destroys object.",
  ["collision","interaction"], "both");
tmpl("effects","intermediate",
  "Color gradient: {} (core → edge)", "Color gradient: {} (core → edge)",
  "Переход температуры/цвета от центра к периферии.",
  "Temperature/color transition from center to periphery.",
  ["color","temperature"], "digital");
tmpl("effects","intermediate",
  "Secondary effect: {} (sparks/smoke)", "Secondary effect: {} (sparks/smoke)",
  "Добавь сопутствующие элементы для усиления читаемости.",
  "Add accompanying elements to enhance readability.",
  ["secondary","detail"], "both");
tmpl("effects","intermediate",
  "Effect timing chart: {} (frame by frame)", "Effect timing chart: {} (frame by frame)",
  "Распиши эффект по кадрам: ключевые моменты, промежутки.",
  "Break down effect frame by frame: keys, inbetweens.",
  ["timing-chart","planning"], "traditional");
// advanced
tmpl("effects","advanced",
  "Multi-layer effect: {} (3-5 layers)", "Multi-layer effect: {} (3-5 layers)",
  "Ядро, свечение, частицы, дым/пыль. Контроль opacity.",
  "Core, glow, particles, smoke/dust. Opacity control.",
  ["multi-layer","breakdown"], "digital");
tmpl("effects","advanced",
  "Physics-based: {} (fluid/gas/solid)", "Physics-based: {} (fluid/gas/solid)",
  "Имитируй реальное поведение в упрощённой анимированной форме.",
  "Imitate real behavior in simplified animated form.",
  ["physics","simulation"], "digital");
tmpl("effects","advanced",
  "Effect stylization: {} (anime/comic)", "Effect stylization: {} (anime/comic)",
  "Преобразуй физическое явление под визуальный стиль.",
  "Transform physical phenomenon into visual style.",
  ["stylization","design"], "both");
tmpl("effects","advanced",
  "Atmospheric effect: {} (fog/rain)", "Atmospheric effect: {} (fog/rain)",
  "Глубина и настроение через плотность среды и освещение.",
  "Depth and mood through medium density and lighting.",
  ["atmosphere","mood"], "both");
tmpl("effects","advanced",
  "Impact frame: {} (flash/deformation)", "Impact frame: {} (flash/deformation)",
  "Кульминация эффекта: максимальная энергия, читаемость.",
  "Effect climax: maximum energy, readability.",
  ["impact","climax"], "digital", true);
tmpl("effects","advanced",
  "Looping effect: {} (seamless cycle)", "Looping effect: {} (seamless cycle)",
  "Создай непрерывный эффект без видимых стыков кадров.",
  "Create continuous effect without visible frame seams.",
  ["loop","seamless"], "both");
// master
tmpl("effects","master",
  "Cinematic effect: {} (scale + drama)", "Cinematic effect: {} (scale + drama)",
  "Масштаб, контраст, свет и эмоциональный вес эффекта.",
  "Scale, contrast, light, and emotional weight of effect.",
  ["cinematic","scale"], "digital");
tmpl("effects","master",
  "Effect compositing: {} (layers + glow)", "Effect compositing: {} (layers + glow)",
  "Сборка финального кадра с эффектом. Взаимодействие с окружением.",
  "Final frame assembly with effect. Environment interaction.",
  ["compositing","final"], "digital");
tmpl("effects","master",
  "Procedural study: {} (rules + variations)", "Procedural study: {} (rules + variations)",
  "Пойми правила генерации эффекта для создания вариаций.",
  "Understand effect generation rules to create variations.",
  ["procedural","rules"], "digital", true, 14);
tmpl("effects","master",
  "Effect as storytelling: {}", "Effect as storytelling: {}",
  "Как форма, цвет и движение эффекта передают характер.",
  "How form, color, and motion of effect convey character.",
  ["storytelling","symbolism"], "both");
tmpl("effects","master",
  "Optimization: {} (LOD)", "Optimization: {} (LOD)",
  "Снижение детализации без потери читаемости для продакшена.",
  "Reduce detail without losing readability for production.",
  ["optimization","readability"], "digital");
tmpl("effects","master",
  "Studio effect copy: {} (Ufotable/Pixar)", "Studio effect copy: {} (Ufotable/Pixar)",
  "Разбор техник профессионалов: слои, тайминг, стилистика.",
  "Breakdown of pro techniques: layers, timing, style.",
  ["master-study","industry"], "both");
// expert
tmpl("effects","expert",
  "Final FX shot: {} (full pipeline)", "Final FX shot: {} (full pipeline)",
  "От референса до композита: тайминг, слои, свет, полировка.",
  "From ref to composite: timing, layers, light, polish.",
  ["portfolio","pipeline"], "digital");
tmpl("effects","expert",
  "Realtime effect: {} (particles/shaders)", "Realtime effect: {} (particles/shaders)",
  "Адаптация под игровые движки: LOD, спрайты, производительность.",
  "Adapt for game engines: LOD, sprites, performance.",
  ["realtime","game-dev"], "digital", true);
tmpl("effects","expert",
  "FX direction: {} (focus control)", "FX direction: {} (focus control)",
  "Управляй вниманием зрителя через масштаб, цвет и движение.",
  "Control viewer attention via scale, color, motion.",
  ["direction","focus"], "both");
tmpl("effects","expert",
  "Multi-FX scene: {}", "Multi-FX scene: {}",
  "Взаимодействие разных эффектов без визуального шума.",
  "Multiple effects interacting without visual noise.",
  ["multi-fx","composition"], "digital");
tmpl("effects","expert",
  "Speed FX: {} (2-4h readability)", "Speed FX: {} (2-4h readability)",
  "Индустриальный спид: выбери главное, упрости второстепенное.",
  "Industry speed: choose main, simplify secondary.",
  ["speed","industry"], "both", true);
tmpl("effects","expert",
  "Brief-based FX: {} (technical specs)", "Brief-based FX: {} (technical specs)",
  "Профессиональная работа: соответствие ТЗ, полировка, экспорт.",
  "Pro work: meet brief, polish, export.",
  ["industry","production"], "digital");

// ── STORYTELLING ──
// novice
tmpl("storytelling","novice",
  "Framing: {} (rule of thirds)", "Framing: {} (rule of thirds)",
  "Размести объект в сильных точках пересечения линий.",
  "Place subject at strong line intersection points.",
  ["framing","rule-of-thirds"], "both");
tmpl("storytelling","novice",
  "Silhouette: {} (readability)", "Silhouette: {} (readability)",
  "Узнаётся ли объект/поза в чёрном контуре?",
  "Can you recognize subject/pose in black silhouette?",
  ["silhouette","readability"], "traditional");
tmpl("storytelling","novice",
  "Value grouping: {} (light/mid/dark)", "Value grouping: {} (light/mid/dark)",
  "Упрости сцену до 3-4 тональных масс для ясности.",
  "Simplify scene to 3-4 value masses for clarity.",
  ["value-grouping","simplification"], "both");
tmpl("storytelling","novice",
  "Leading lines: {} to focus", "Leading lines: {} to focus",
  "Направь взгляд зрителя через архитектуру, свет или позы.",
  "Direct viewer's eye via architecture, light, or poses.",
  ["leading-lines","focus"], "both");
tmpl("storytelling","novice",
  "Shot type: {} (wide/medium/close)", "Shot type: {} (wide/medium/close)",
  "Выбери дистанцию камеры для передачи масштаба или эмоции.",
  "Choose camera distance to convey scale or emotion.",
  ["shot-type","distance"], "digital");
tmpl("storytelling","novice",
  "Simple layout: {} (2-3 panels)", "Simple layout: {} (2-3 panels)",
  "Базовая последовательность: установка, действие, реакция.",
  "Basic sequence: setup, action, reaction.",
  ["layout","sequence"], "both");
// intermediate
tmpl("storytelling","intermediate",
  "Camera angle: {} (high/low/eye)", "Camera angle: {} (high/low/eye)",
  "Как наклон камеры влияет на восприятие силы/слабости.",
  "How camera tilt affects perception of power/weakness.",
  ["angle","perspective"], "both");
tmpl("storytelling","intermediate",
  "Depth layers: {} (fg/mg/bg)", "Depth layers: {} (fg/mg/bg)",
  "Пространство через перекрытие, тон и детализацию.",
  "Space through overlap, value, and detail.",
  ["depth","layering"], "digital");
tmpl("storytelling","intermediate",
  "Color mood: {} (warm/cool)", "Color mood: {} (warm/cool)",
  "Палитра для передачи эмоции или времени суток.",
  "Use palette to convey emotion or time of day.",
  ["color","mood"], "digital");
tmpl("storytelling","intermediate",
  "Visual rhythm: {} (shot alternation)", "Visual rhythm: {} (shot alternation)",
  "Управление вниманием через размер кадра и плотность деталей.",
  "Control attention via frame size and detail density.",
  ["pacing","rhythm"], "both");
tmpl("storytelling","intermediate",
  "Continuity: {} (180° rule)", "Continuity: {} (180° rule)",
  "Сохрани пространственную логику между кадрами.",
  "Maintain spatial logic between shots.",
  ["continuity","180-rule"], "traditional");
tmpl("storytelling","intermediate",
  "Thumbnails: {} (5 variants)", "Thumbnails: {} (5 variants)",
  "Быстрый поиск сильных композиций перед финалом.",
  "Quick search for strong compositions before final.",
  ["thumbnails","exploration"], "both");
// advanced
tmpl("storytelling","advanced",
  "Storyboard: {} (5-7 panels)", "Storyboard: {} (5-7 panels)",
  "Раскадровка ключевых моментов сцены. Композиция и переходы.",
  "Key moments storyboard. Composition and transitions.",
  ["storyboard","cinematic"], "both");
tmpl("storytelling","advanced",
  "Mood & light: {} (time of day)", "Mood & light: {} (time of day)",
  "Одно и то же место в разное время суток. Настроение через свет.",
  "Same location at different times of day. Mood through light.",
  ["mood","lighting"], "digital");
tmpl("storytelling","advanced",
  "Character intro: {} (first frame)", "Character intro: {} (first frame)",
  "Кадр, представляющий персонажа. Характер через окружение.",
  "Frame introducing character. Personality through environment.",
  ["introduction","character-design"], "both");
tmpl("storytelling","advanced",
  "Action sequence: {} (3 beats)", "Action sequence: {} (3 beats)",
  "Три фазы: подготовка, кульминация, последствие.",
  "Three phases: setup, climax, aftermath.",
  ["action","pacing"], "digital", true);
tmpl("storytelling","advanced",
  "Emotional arc: {} (turn)", "Emotional arc: {} (turn)",
  "Поворот настроения в сцене. От надежды к отчаянию или наоборот.",
  "Mood shift in scene. From hope to despair or vice versa.",
  ["emotion","arc"], "both");
tmpl("storytelling","advanced",
  "Composition: {} (visual weight)", "Composition: {} (visual weight)",
  "Баланс масс, пустот, цвета. Фокусная точка.",
  "Balance of masses, empty space, color. Focal point.",
  ["composition","balance"], "traditional");
// master
tmpl("storytelling","master",
  "Film still: {} (cinematic quality)", "Film still: {} (cinematic quality)",
  "Кадр уровня кино. Композиция, свет, атмосфера, история.",
  "Cinematic quality frame. Composition, light, atmosphere, story.",
  ["cinematic","film"], "digital");
tmpl("storytelling","master",
  "Sequence: {} (развитие сцены)", "Sequence: {} (scene development)",
  "5-10 панелей, раскрывающих сцену с началом, серединой, концом.",
  "5-10 panels developing a scene with beginning, middle, end.",
  ["sequence","development"], "both");
tmpl("storytelling","master",
  "Subtext: {} (show, don't tell)", "Subtext: {} (show, don't tell)",
  "Передай информацию через визуальные детали, не через слова.",
  "Convey info through visual details, not words.",
  ["subtext","visual-narrative"], "both", true, 14);
tmpl("storytelling","master",
  "Atmosphere: {} (environment story)", "Atmosphere: {} (environment story)",
  "Окружение, которое рассказывает историю само по себе.",
  "Environment that tells a story by itself.",
  ["atmosphere","world-building"], "digital");
tmpl("storytelling","master",
  "Color script: {} (palette arc)", "Color script: {} (palette arc)",
  "Цветовая дуга всей сцены. Эволюция палитры от начала к финалу.",
  "Color arc of entire scene. Palette evolution from start to end.",
  ["color-script","palette"], "digital");
tmpl("storytelling","master",
  "Director's layout: {} (blocking)", "Director's layout: {} (blocking)",
  "Размещение персонажей и камеры. Фокус, ритм, глубина.",
  "Character and camera placement. Focus, rhythm, depth.",
  ["blocking","staging"], "traditional");
// expert
tmpl("storytelling","expert",
  "Portfolio storyboard: {} (prof level)", "Portfolio storyboard: {} (pro level)",
  "Профессиональная раскадровка: чистота, читаемость, стиль.",
  "Professional storyboard: cleanliness, readability, style.",
  ["portfolio","final"], "digital");
tmpl("storytelling","expert",
  "Opening scene: {} (hook)", "Opening scene: {} (hook)",
  "Первые 3-5 кадров, которые захватывают внимание зрителя.",
  "First 3-5 frames that grab viewer's attention.",
  ["hook","engagement"], "both");
tmpl("storytelling","expert",
  "Climax sequence: {} (peak emotion)", "Climax sequence: {} (peak emotion)",
  "Кульминация истории. Максимальное напряжение, разрядка.",
  "Story climax. Maximum tension, release.",
  ["climax","peak"], "digital", true);
tmpl("storytelling","expert",
  "Silent storytelling: {} (без диалогов)", "Silent storytelling: {} (no dialogue)",
  "Расскажи историю без единого слова. Только визуал.",
  "Tell a story without a single word. Visuals only.",
  ["silent","visual-only"], "both");
tmpl("storytelling","expert",
  "Production brief: {} (pipeline ready)", "Production brief: {} (pipeline ready)",
  "Работа по индустриальным стандартам: формат, слои, экспорт.",
  "Industry standards work: format, layers, export.",
  ["industry","production"], "digital", true);
tmpl("storytelling","expert",
  "Visual metaphor: {} (symbolism)", "Visual metaphor: {} (symbolism)",
  "Передай абстрактную идею через визуальную метафору.",
  "Convey abstract idea through visual metaphor.",
  ["symbolism","concept"], "both");

// ── Seeded PRNG ──
function lcg(seed) {
  let s = seed >>> 0;
  return function() {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 0xFFFFFFFF;
  };
}

function pick(arr, rand) {
  return arr[Math.floor(rand() * arr.length)];
}

function randInt(min, max, rand) {
  return Math.floor(min + rand() * (max - min + 1));
}

// ── Main generation ──
const existing = JSON.parse(fs.readFileSync(
  path.join(__dirname, '..', 'src', 'renderer', 'data', 'quests.json'), 'utf-8'
));

const existingIds = new Set(existing.map(q => q.id));
const existingCodes = new Set(existing.map(q => q.code));
let maxId = Math.max(...existingIds);
let startId = maxId + 1;
const rand = lcg(SEED);

// Target per category & difficulty for balanced distribution
const TARGET_PER_CAT = 200;
const TARGET_PER_DIFF = 200;
const added = [];

const DIFF_RANK = { novice: 0, intermediate: 1, advanced: 2, master: 3, expert: 4 };

function getMinLevel(diff, rank) {
  if (rank <= 1) return 1;      // fundamentals/row0 always accessible
  if (rank === 2) return 5;      // row1 → level 5
  if (rank === 3) return 13;     // row2 → advanced
  return 21;                     // row3 → expert/master
}

function getCode(cat, id) {
  const prefix = CATS[cat].code;
  return `${prefix}-${String(id).padStart(5, '0')}`;
}

// Generate target number of quests per category
const TARGET_ADD = TARGET_TOTAL - existing.length; // 235
let addedCount = 0;
let safety = 0;

// Calculate how many per category we need to add
const catCounts = {};
const diffCounts = {};
CAT_LIST.forEach(c => catCounts[c] = existing.filter(q => q.category === c).length);
DIFF_LIST.forEach(d => diffCounts[d] = existing.filter(q => q.difficulty === d).length);

// We want to bring each category closer to TARGET_PER_CAT
// and each difficulty closer to TARGET_PER_DIFF
const MAX_ITER = 50000;

for (let iter = 0; iter < MAX_ITER && addedCount < TARGET_ADD; iter++) {
  // Pick category with most deficit
  const catDeficit = CAT_LIST.map(c => ({ c, def: TARGET_PER_CAT - catCounts[c] }));
  catDeficit.sort((a, b) => b.def - a.def);
  const cat = catDeficit[0].c;

  // Pick difficulty with most deficit
  const diffDeficit = DIFF_LIST.map(d => ({ d, def: TARGET_PER_DIFF - diffCounts[d] }));
  diffDeficit.sort((a, b) => b.def - a.def);
  const diff = diffDeficit[0].d;

  const rank = DIFF_RANK[diff];
  const cfg = DIFFS[diff];
  const meta = CATS[cat];
  const subjectsRU = SUBJECTS_RU[cat];
  const subjectsEN = SUBJECTS_EN[cat];
  const templates = EXERCISES[cat][diff];

  if (!templates || templates.length === 0) continue;

  const tmpl = pick(templates, rand);
  const subRU = pick(subjectsRU, rand);
  const subEN = pick(subjectsEN, rand);
  const medium = tmpl.m;
  const sources = meta.sources;
  const source = pick(sources, rand);

  // Generate time (2-placeholder replacement)  
  const hasSec = tmpl.t_ru.includes("{1}");
  const sec = hasSec ? randInt(15, 60, rand) : "";

  const titleRU = tmpl.t_ru.replace("{}", subRU).replace("{1}", sec);
  const titleEN = tmpl.t_en.replace("{}", subEN).replace("{1}", sec);
  const tipsRU = {
    "both": ["Используй любые материалы.", "Можно карандаш или планшет.", "Выбери удобную технику."],
    "digital": ["Работай на планшете.", "Используй любимую программу.", "Только цифровые инструменты."],
    "traditional": ["Бумага и карандаш.", "Только традиционные материалы.", "Никакой цифры."]
  };
  const tipsEN = {
    "both": ["Use any materials.", "Pencil or tablet allowed.", "Choose your preferred medium."],
    "digital": ["Work on a tablet.", "Use your favorite software.", "Digital tools only."],
    "traditional": ["Paper and pencil.", "Traditional materials only.", "No digital tools."]
  };
  const constrsRU = {
    "both": ["без ограничений", "с таймером", "без референса"],
    "digital": ["без ctrl+z", "1 кисть", "5 цветов", "без blending"],
    "traditional": ["без ластика", "3 тона", "одним инструментом", "без растушёвки"]
  };
  const constrsEN = {
    "both": ["No restrictions.", "Timed.", "Without reference."],
    "digital": ["No undo.", "One brush only.", "Five colors max.", "No blending modes."],
    "traditional": ["No eraser.", "Three tones only.", "One tool only.", "No smudging."]
  };
  const tipRU = pick(tipsRU[medium], rand);
  const tipEN = pick(tipsEN[medium], rand);
  const constrRU = pick(constrsRU[medium], rand);
  const constrEN = pick(constrsEN[medium], rand);
  const addDescsRU = ["", ` ${tipRU}`, ` ${constrRU}`];
  const addDescsEN = ["", ` ${tipEN}`, ` ${constrEN}`];
  const descRU = tmpl.d_ru + pick(addDescsRU, rand);
  const descEN = tmpl.d_en + pick(addDescsEN, rand);

  const xp = randInt(cfg.xp[0], cfg.xp[1], rand);
  const time = randInt(cfg.time[0], cfg.time[1], rand);

  const tags = [...tmpl.tags, diff, cat, medium];

  const newId = startId + addedCount;
  const code = getCode(cat, newId);

  const quest = {
    id: newId,
    code: code,
    title: { ru: titleRU, en: titleEN },
    category: cat,
    difficulty: diff,
    description: { ru: descRU, en: descEN },
    xp: xp,
    estimatedTime: time,
    source: source,
    icon: meta.icon,
    color: meta.color,
    min_level: cfg.ml,
    tags: tags,
    prerequisites: [],
    medium: medium,
    is_repeatable: tmpl.rep ? true : rand() > 0.6,
    review_after_days: tmpl.rev || (tmpl.rep ? 14 : 0),
    streak_bonus: cfg.sb
  };

  // No dedup needed — IDs and codes are unique by construction

  added.push(quest);
  catCounts[cat]++;
  diffCounts[diff]++;
  addedCount++;
}

// ── Merge and write ──
const merged = existing.concat(added);
const outputPath = path.join(__dirname, '..', 'src', 'renderer', 'data', 'quests.json');
fs.writeFileSync(outputPath, JSON.stringify(merged, null, 2), 'utf-8');

// ── Report ──
console.log(`\n📊 BEFORE: ${existing.length} quests (IDs 1-${maxId})`);
console.log(`📊 ADDED: ${added.length} quests (IDs ${startId}-${startId + added.length - 1})`);
console.log(`📊 TOTAL: ${merged.length} quests`);

console.log(`\n📈 By Category:`);
const finalCat = {};
merged.forEach(q => { finalCat[q.category] = (finalCat[q.category] || 0) + 1; });
CAT_LIST.forEach(c => console.log(`  ${c}: ${finalCat[c] || 0}`));

console.log(`\n📈 By Difficulty:`);
const finalDiff = {};
merged.forEach(q => { finalDiff[q.difficulty] = (finalDiff[q.difficulty] || 0) + 1; });
DIFF_LIST.forEach(d => console.log(`  ${d}: ${finalDiff[d] || 0}`));

console.log(`\n📈 By Medium:`);
const finalMed = {};
merged.forEach(q => { finalMed[q.medium] = (finalMed[q.medium] || 0) + 1; });
Object.keys(finalMed).sort().forEach(m => console.log(`  ${m}: ${finalMed[m]}`));

console.log(`\n📈 By Repeatable:`);
const rep = merged.filter(q => q.is_repeatable).length;
console.log(`  repeatable: ${rep}`);
console.log(`  non-repeatable: ${merged.length - rep}`);

if (added.length < TARGET_ADD) {
  console.log(`\n⚠️ Only added ${added.length} (target ${TARGET_ADD}) — template pool exhausted.`);
}
console.log('\n✅ Done!');
