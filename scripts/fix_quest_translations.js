const fs = require('fs');
const path = require('path');
const translatte = require('translatte');

const DATA_PATH = path.join(__dirname, '..', 'src', 'renderer', 'data', 'quests.json');
const q = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));

// ── Step 1: Extract unique Russian text from EN titles and descriptions ──
const titleRus = new Set();
const descRus = new Set();

q.forEach(quest => {
  const en = quest.title.en;
  // Extract trailing Russian text (after last colon+space, or entire string)
  const ruMatch = en.match(/[а-яА-ЯёЁ].+$/);
  if (ruMatch) titleRus.add(ruMatch[0].trim());
  
  const de = quest.description.en;
  if (/[а-яА-ЯёЁ]/.test(de)) descRus.add(de.trim());
});

console.log(`Unique RU title fragments: ${titleRus.size}`);
console.log(`Unique RU descriptions: ${descRus.size}`);

// ── Step 2: Pre-defined subject translations for common art terms ──
const SUBJECT_DICT = {
  "жестов фигуры (30-60 сек)": "figure gestures (30-60 sec)",
  "пропорций тела (метод 7.5-8 голов)": "body proportions (7.5-8 heads method)",
  "кисти руки": "hand",
  "стопы": "foot",
  "головы в анфас/профиль": "head (front/profile)",
  "торса без деталей": "torso (simplified)",
  "простых поз стоя/сидя": "simple standing/sitting poses",
  "базовых мышечных групп": "basic muscle groups",
  "костных ориентиров": "bony landmarks",
  "суставов": "joints",
  "рук в динамике": "arms in motion",
  "ног при ходьбе": "legs walking",
  "плечевого пояса": "shoulder girdle",
  "лицевой мимики (5 базовых эмоций)": "facial expressions (5 basic emotions)",
  "позвоночника в движении": "spine in motion",
  "мускулатуры ног": "leg muscles",
  "наклонов и скручиваний торса": "torso tilts and twists",
  "весового распределения": "weight distribution",
  "анатомии под простой одеждой": "anatomy under simple clothing",
  "пропорций в перспективе": "proportions in perspective",
  "сложных динамичных поз": "complex dynamic poses",
  "перспективного сокращения конечностей": "foreshortened limbs",
  "анатомии в экстремальных ракурсах": "anatomy in extreme angles",
  "старения и типов телосложения": "aging and body types",
  "анатомии существ (квадрупедалы, крылья)": "creature anatomy (quadrupedals, wings)",
  "телесного актёрства (намерение через позу)": "body acting (intent through pose)",
  "анатомии для анимации (упрощение)": "anatomy for animation (simplification)",
  "турнарота персонажа (3 ракурса)": "character turnaround (3 views)",
  "экспрессивной стилизации": "expressive stylization",
  "разрезов и медицинских схем": "cross-sections and medical diagrams",
  "мяча с отскоком": "bouncing ball",
  "простых форм в движении": "simple forms in motion",
  "прыжка": "jump",
  "падения предмета": "falling object",
  "отскока от поверхности": "surface bounce",
  "базовых дуг движения": "basic motion arcs",
  "сжатия и растяжения": "squash and stretch",
  "замедления в начале/конце": "slow in/out",
  "простых циклов (4-8 кадров)": "simple cycles (4-8 frames)",
  "реакции на стимул": "reaction to stimulus",
  "персонажа в цикле ходьбы": "walk cycle character",
  "эмоциональной реакции": "emotional reaction",
  "простых действий (поднять, бросить, сесть)": "simple actions (lift, throw, sit)",
  "цикла бега с фазой полёта": "run cycle with flight phase",
  "вторичной анимации (волосы/одежда)": "secondary animation (hair/clothing)",
  "синхронизации губ (5 сек)": "lip sync (5 sec)",
  "взаимодействия с лёгким объектом": "interaction with light object",
  "пантомимы (10 сек)": "pantomime (10 sec)",
  "камеры с простым движением": "simple camera movement",
  "переходов между позами": "pose transitions",
  "сложных боевых циклов": "complex combat cycles",
  "диалоговых сцен с подтекстом": "dialogue scenes with subtext",
  "акробатических элементов": "acrobatic elements",
  "взаимодействия с тяжёлым объектом": "interaction with heavy object",
  "множественных персонажей в кадре": "multiple characters in frame",
  "аниматика с монтажом": "animatic with editing",
  "стилизации движения (аниме/картун)": "motion stylization (anime/cartoon)",
  "сцен с физикой ткани/жидкости": "cloth/fluid physics scenes",
  "режиссёрских ракурсов": "directorial angles",
  "финальной полировки (spacing/curves)": "final polish (spacing/curves)",
  "огня (базовая форма)": "fire (basic form)",
  "дыма (плавные переходы)": "smoke (smooth transitions)",
  "простых частиц": "simple particles",
  "свечения (glow)": "glow effect",
  "искр": "sparks",
  "магической энергии (статика)": "magic energy (static)",
  "пыли": "dust",
  "пара": "steam",
  "простых волн": "simple waves",
  "базовых текстур энергии": "basic energy textures",
  "воды с брызгами": "water splashes",
  "взрывной волны": "shockwave",
  "магических снарядов": "magic projectiles",
  "погодных эффектов (дождь/снег)": "weather effects (rain/snow)",
  "электрических дуг": "electric arcs",
  "лавовых потоков": "lava flows",
  "тумана с глубиной": "fog with depth",
  "силовых полей": "force fields",
  "разрушения простых объектов": "simple object destruction",
  "комбинации 2 стихий": "element combination",
  "кинематографичных взрывов": "cinematic explosions",
  "сложных симуляций жидкости": "complex fluid simulations",
  "магических ритуалов/порталов": "magic rituals/portals",
  "разрушений архитектуры": "architectural destruction",
  "стихийных бедствий (шторм/извержение)": "natural disasters (storm/eruption)",
  "композитинга эффектов в сцену": "effect compositing into scene",
  "реал-тайм оптимизации": "real-time optimization",
  "мультислойных магических атак": "multi-layer magic attacks",
  "физически корректного дыма/огня": "physically accurate smoke/fire",
  "финальных VFX-шотов для портфолио": "final VFX shots for portfolio",
  "простых сцен (1 персонаж)": "simple scenes (1 character)",
  "эмоциональных моментов": "emotional moments",
  "композиции кадра (правило третей)": "frame composition (rule of thirds)",
  "раскадровки (3 кадра)": "storyboarding (3 frames)",
  "настроения через свет": "mood through lighting",
  "тихих сцен покоя": "quiet peaceful scenes",
  "моментов открытия/удивления": "discovery/surprise moments",
  "переходов между локациями": "location transitions",
  "базового визуального ритма": "basic visual rhythm",
  "силуэтной читаемости": "silhouette readability",
  "напряжённых диалогов": "tense dialogue",
  "визуальной кульминации": "visual climax",
  "многофигурных композиций": "multi-figure compositions",
  "цветовой драматургии": "color dramatics",
  "атмосферы и тона": "atmosphere and tone",
  "внутреннего монолога": "internal monologue",
  "параллельного монтажа": "parallel editing",
  "сюжетных твистов": "plot twists",
  "эмоциональных арок": "emotional arcs",
  "визуальной метафоры": "visual metaphor",
  "полного цикла": "full cycle",
  "боевой сцены": "battle scene",
  "экстерьера": "exterior scene",
  "интерьера": "interior scene",
  "животных": "animals",
  "механизма в 1-2 точках": "mechanism in 1-2 point perspective",
  "персонажа": "character",
  "предмета": "object",
  "окружения": "environment",
  "анимации": "animation",
  "пантомимы": "pantomime",
  "монтажной последовательности": "editing sequence",
  "прыжка с приземлением": "jump with landing",
  "персонажа в прыжке": "character jumping",
  "хвоста животного": "animal tail",
  "ткани на ветру": "fabric in wind",
  "камеры с панорамой": "camera pan",
  "объекта с весом": "object with weight",
  "диалоговой сцены": "dialogue scene",
  "цикла бега": "run cycle",
  "реакции персонажа": "character reaction",
  "сцены погони": "chase scene",
  "диалога": "dialogue",
  "момента открытия": "discovery moment",
  "тихой сцены": "quiet scene",
  "кульминации": "climax",
  "флешбэка": "flashback",
  "эмоционального пика": "emotional peak",
  "завязки": "setup",
  "развязки": "resolution",
  "куба": "cube",
  "сферы": "sphere",
  "цилиндра": "cylinder",
  "руки в жесте": "hand gesture",
  "портрета в 3/4": "three-quarter portrait",
  "натюрморта": "still life",
  "пейзажа": "landscape",
  "архитектурного фрагмента": "architectural fragment",
  "торса": "torso",
  "скелета таза": "pelvis skeleton",
  "фигуры в движении": "figure in motion",
  "конуса": "cone",
  "призмы": "prism",
  "пирамиды": "pyramid",
  "чайника": "teapot",
  "вазы": "vase",
  "книги": "book",
  "свечи": "candle",
  "кольца": "ring",
  "ключа": "key",
  "фрукта (яблоко/груша)": "fruit (apple/pear)",
  "овоща (перец/баклажан)": "vegetable (pepper/eggplant)",
  "ракушки": "seashell",
  "листа дерева": "tree leaf",
  "цветка": "flower",
  "камня/скалы": "rock/cliff",
  "дерева (ствол)": "tree trunk",
  "окна": "window",
  "двери": "door",
  "лестницы": "staircase",
  "мостика": "small bridge",
  "фонарного столба": "lamppost",
  "велосипедной рамы": "bicycle frame",
  "гитары": "guitar",
  "часов": "watch/clock",
  "очков": "glasses",
  "зонтика": "umbrella",
  "шляпы": "hat",
  "перчатки": "glove",
  "ремня/сумки": "belt/bag",
  "складного стула": "folding chair",
  "фонтана": "fountain",
  "колонны": "column",
  "арки": "arch",
  "статуи": "statue",
  "автомобиля (ретро)": "vintage car",
  "лодки": "boat",
  "палатки": "tent",
  "фонаря": "lantern",
  "замка": "castle",
  "башни": "tower",
  "рожка мороженого": "ice cream cone",
  "бутылки": "bottle",
  "кастрюли": "saucepan",
  "чайной пары": "tea set",
  "подсвечника": "candlestick",
  "шкатулки": "jewelry box",
  "таза в наклоне": "pelvis (tilted)",
  "позвоночника (изгибы)": "spine curves",
  "ключа и лопатки": "collarbone and scapula",
  "коленного сустава": "knee joint",
  "локтевого сустава": "elbow joint",
  "лучезапястного сустава": "wrist joint",
  "голеностопа": "ankle",
  "шеи и трапеции": "neck and trapezius",
  "мышц спины (широчайшие)": "back muscles (lats)",
  "грудных мышц": "pectorals",
  "пресса": "abs",
  "ягодичных мышц": "glutes",
  "бицепса/трицепса": "biceps/triceps",
  "предплечья": "forearm",
  "икроножных мышц": "calves",
  "стопы в перспективе": "foot in perspective",
  "кисти в кулаке": "fist hand",
  "пальцев (жест)": "finger gesture",
  "ушной раковины": "ear shape",
  "носа (разные типы)": "nose types",
  "глаза в профиль": "eye in profile",
  "губ (разные выражения)": "lip expressions",
  "черепа (3/4)": "skull three-quarter",
  "челюсти и подбородка": "jaw and chin",
  "ключицы в движении": "clavicle in motion",
  "рёберной дуги": "rib cage",
  "лопатки при отведении руки": "scapula arm abduction",
  "позвонков (поясница)": "lumbar vertebrae",
  "седалищного бугра": "ischium",
  "бедренной кости": "femur",
  "большеберцовой кости": "tibia",
  "ахиллова сухожилия": "achilles tendon",
  "мышц шеи (грудино-ключично-сосцевидная)": "neck muscles (SCM)",
  "дельтовидной мышцы": "deltoid",
  "мышц предплечья (pronation/supination)": "forearm muscles pronation supination",
  "подколенного сухожилия": "hamstring",
  "квадрицепса": "quadriceps",
  "мимики: гнева": "expression: anger",
  "мимики: страха": "expression: fear",
  "мимики: отвращения": "expression: disgust",
  "мимики: удивления": "expression: surprise",
  "мимики: печали": "expression: sadness",
  "мимики: радости": "expression: joy",
  "качающегося маятника": "swinging pendulum",
  "вращающегося волчка": "spinning top",
  "падающего листа": "falling leaf",
  "летящего мяча (бейсбол)": "flying baseball",
  "надувающегося шара": "inflating balloon",
  "лопающегося пузыря": "popping bubble",
  "пружины (сжатие/растяжение)": "spring compression/extension",
  "качелей": "swing",
  "раскачивающейся верёвки": "swinging rope",
  "флага на ветру": "flag in wind",
  "занавески (открытие)": "curtain opening",
  "дверцы шкафа": "cabinet door",
  "выдвигающегося ящика": "sliding drawer",
  "падающей книги": "falling book",
  "разбивающегося стакана": "breaking glass",
  "напильника (рука туда-сюда)": "filing motion",
  "кисти руки (жест хватания)": "hand grasping gesture",
  "указующего перста": "pointing finger",
  "поворота головы (шейный)": "head turn",
  "подмигивания": "winking",
  "зевания": "yawning",
  "чихания": "sneezing",
  "смеха (плечи/корпус)": "laughing",
  "плача (утрирование)": "crying exaggerated",
  "пожимания плечами": "shrugging",
  "спотыкания": "tripping",
  "вставания со стула": "standing up from chair",
  "падения на спину": "falling on back",
  "лазанья по лестнице": "climbing stairs",
  "перешагивания через препятствие": "stepping over obstacle",
  "приседания": "squatting",
  "потягивания (пробуждение)": "stretching waking up",
  "засыпания (крэнк)": "falling asleep",
  "удивлённого подскока": "surprised jump",
  "принюхивания": "sniffing",
  "вытирания пота со лба": "wiping sweat",
  "почёсывания затылка": "scratching head",
  "качания головой (несогласие)": "shaking head disagreement",
  "кивка (согласие)": "nodding agreement",
  "вращения дверной ручки": "turning doorknob",
  "нажатия кнопки": "pressing button",
  "водопада": "waterfall",
  "фонтана (брызги)": "fountain spray",
  "дождя (ливень)": "heavy rain",
  "снегопада": "snowfall",
  "града": "hail",
  "тумана (с рассеиванием)": "dissipating fog",
  "дыма (промышленного)": "industrial smoke",
  "пара от дыхания": "breath vapor",
  "огня (костёр)": "campfire",
  "пламени (факел)": "flame torch",
  "взрыва (гриб)": "mushroom explosion",
  "искр от точила": "grinder sparks",
  "электрической дуги (молния)": "electric arc lightning",
  "энергетического щита": "energy shield",
  "магического барьера": "magic barrier",
  "светового меча": "lightsaber",
  "портала (открытие)": "portal opening",
  "телепортации": "teleportation",
  "левитации объекта": "object levitation",
  "пузырей магии": "magic bubbles",
  "кристалла энергии": "energy crystal",
  "силового поля": "force field",
  "заклинания (огненный шар)": "fireball spell",
  "ледяного шипа": "ice spike",
  "ветряного вихря": "wind vortex",
  "земляной стены": "earthen wall",
  "тёмной сферы": "dark sphere",
  "святого сияния": "holy radiance",
  "ядовитого облака": "poison cloud",
  "кислотной лужи": "acid puddle",
  "лавы (пузырение)": "bubbling lava",
  "магмы": "magma",
  "песчаной бури": "sandstorm",
  "пылевого облака": "dust cloud",
  "разрушения стены": "wall destruction",
  "падения колонны": "falling column",
  "трещины на стекле": "glass crack",
  "ряби на воде": "water ripple",
  "приливной волны": "tidal wave",
  "торнадо": "tornado",
  "ожидания (тишина перед бурей)": "anticipation calm before storm",
  "разочарования": "disappointment",
  "облегчения после опасности": "relief after danger",
  "момента принятия решения": "decision moment",
  "предательства (жест)": "betrayal gesture",
  "прощения": "forgiveness",
  "расставания на вокзале": "farewell at station",
  "воссоединения после долгой разлуки": "reunion after long separation",
  "тайной передачи записки": "secret note passing",
  "подслушанного разговора": "overheard conversation",
  "напряжённого молчания (дуэль)": "tense silence duel",
  "победы (триумф)": "victory triumph",
  "поражения (смирение)": "defeat resignation",
  "жертвы (самопожертвование)": "sacrifice self-sacrifice",
  "угрозы (нависающая опасность)": "looming threat",
  "спасения (в последний момент)": "last-minute rescue",
  "неожиданного открытия": "unexpected discovery",
  "разоблачения (ложь раскрыта)": "exposure lie revealed",
  "утраты (потеря близкого)": "loss of loved one",
  "надежды (рассвет после тьмы)": "hope dawn after darkness",
  "ссоры за столом": "argument at table",
  "примирения через объятия": "reconciliation through hug",
  "одиночества в толпе": "loneliness in crowd",
  "вдохновения (озарение идеей)": "inspiration epiphany",
  "скуки (ожидание в очереди)": "boredom waiting in line",
  "любопытства (изучает карту)": "curiosity studying map",
  "страха перед входом в тёмную комнату": "fear entering dark room",
  "радости от неожиданного подарка": "joy from unexpected gift",
  "гордости (смотрит на свою работу)": "pride looking at own work",
  "стыда (покраснел/отвёл взгляд)": "shame blushed looked away",
  "замешательства (не знает, как реагировать)": "bewilderment unsure reaction",
  "тайного заговора (шёпот)": "secret conspiracy whisper",
  "приказа (властный жест)": "command authoritative gesture",
  "извинения (виноватый взгляд)": "apology guilty look",
  "подбадривания": "encouragement",
  "утешения (плечо/объятие)": "comfort shoulder hug",
  "соперничества (взгляд глаза в глаза)": "rivalry eye to eye",
  "соревнования (финишная черта)": "competition finish line",
  "путешествия (прощание с домом)": "journey farewell to home",
  "возвращения (встреча у порога)": "return meeting at doorstep",
  "Plant": "Plant",
  "Dialogue": "Dialogue",
  // Additional generic subjects from generate_quests.js
  "куба и цилиндра": "cube and cylinder",
  "сферы и конуса": "sphere and cone",
  "чашки, книги, телефона": "cup, book, phone",
  "простых геометрических форм": "simple geometric forms",
  "базовых предметов": "basic objects",
  "простых фруктов": "simple fruits",
  "плоских паттернов": "flat patterns",
  "базовых силуэтов": "basic silhouettes",
  "простых линий и штрихов": "simple lines and strokes",
  "натюрморта из 3-5 объектов": "still life of 3-5 objects",
  "мебели (стул, стол, лампа)": "furniture (chair, table, lamp)",
  "растений в горшках": "potted plants",
  "посуды и кухонной утвари": "dishes and kitchen utensils",
  "электроники": "electronics",
  "одежды на вешалке": "clothes on hanger",
  "обуви": "shoes",
  "сумок и аксессуаров": "bags and accessories",
  "простых интерьеров": "simple interiors",
  "уличных фонарей и знаков": "street lamps and signs",
  "персонажа в полный рост": "full-body character",
  "портрета с передачей характера": "character portrait",
  "сложной техники (велосипед, камера, инструмент)": "complex machinery",
  "архитектурных фрагментов": "architectural fragments",
  "пейзажа с глубиной": "landscape with depth",
  "фэнтези-существ": "fantasy creatures",
  "мехов и роботов": "furry characters and robots",
  "транспортных средств": "vehicles",
  "сложных драпировок": "complex drapery",
  "многофигурной композиции": "multi-figure composition",
};

// ── Step 3: Sort dictionary keys by length (longest first) for correct matching ──
const sortedEntries = Object.entries(SUBJECT_DICT).sort((a, b) => b[0].length - a[0].length);

function translateRussianText(text) {
  if (!text) return text;
  let result = text;
  for (const [ru, en] of sortedEntries) {
    // Match as whole word or at word boundaries
    const escaped = ru.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escaped, 'gi');
    if (regex.test(result)) {
      result = result.replace(regex, en);
    }
  }
  // If still has Cyrillic, try web translation
  return result;
}

// ── Step 4: Fix all EN titles ──
let fixedTitles = 0;
let fixedDescs = 0;

q.forEach(quest => {
  const oldTitle = quest.title.en;
  if (/[а-яА-ЯёЁ]/.test(oldTitle)) {
    const newTitle = translateRussianText(oldTitle);
    if (newTitle !== oldTitle) {
      quest.title.en = newTitle;
      fixedTitles++;
    }
  }

  const oldDesc = quest.description.en;
  if (/[а-яА-ЯёЁ]/.test(oldDesc)) {
    const newDesc = translateRussianText(oldDesc);
    if (newDesc !== oldDesc) {
      quest.description.en = newDesc;
      fixedDescs++;
    }
  }
});

console.log(`\nFixed titles: ${fixedTitles}`);
console.log(`Fixed descriptions: ${fixedDescs}`);

// ── Step 5: Report remaining issues ──
const remainingTitles = q.filter(x => /[а-яА-ЯёЁ]/.test(x.title.en));
const remainingDescs = q.filter(x => /[а-яА-ЯёЁ]/.test(x.description.en));
console.log(`\nRemaining Cyrillic in EN titles: ${remainingTitles.length}`);
console.log(`Remaining Cyrillic in EN descs: ${remainingDescs.length}`);

if (remainingTitles.length > 0) {
  console.log('\nUnfixed titles:');
  remainingTitles.slice(0, 10).forEach(x => console.log(`  ID ${x.id}: "${x.title.en}"`));
}

if (remainingDescs.length > 0) {
  console.log('\nUnfixed descriptions (sample):');
  remainingDescs.slice(0, 5).forEach(x => console.log(`  ID ${x.id}: "${x.description.en.substring(0, 80)}"`));
}

// ── Step 6: For remaining items, use translatte ──
async function fixRemaining() {
  if (remainingTitles.length === 0 && remainingDescs.length === 0) {
    console.log('\nAll fixed! Writing file...');
    fs.writeFileSync(DATA_PATH, JSON.stringify(q, null, 2), 'utf-8');
    console.log('Done!');
    return;
  }

  console.log(`\nTranslating ${remainingTitles.length} titles and ${remainingDescs.length} descs via web...`);
  
  // Collect unique remaining RU text from titles
  const titleRuTexts = [...new Set(remainingTitles.map(x => {
    const m = x.title.en.match(/[а-яА-ЯёЁ].+$/);
    return m ? m[0].trim() : null;
  }).filter(Boolean))];
  
  const descRuTexts = [...new Set(remainingDescs.map(x => x.description.en.trim()))];
  
  console.log(`Unique RU title fragments: ${titleRuTexts.length}`);
  console.log(`Unique RU descriptions: ${descRuTexts.length}`);
  
  const translationCache = {};
  
  for (const ru of [...titleRuTexts, ...descRuTexts]) {
    try {
      const result = await translatte(ru, { to: 'en' });
      translationCache[ru] = result.text;
      console.log(`  ✓ "${ru.substring(0, 40)}" → "${result.text.substring(0, 40)}"`);
    } catch (e) {
      console.log(`  ✗ Failed: "${ru.substring(0, 40)}" — ${e.message}`);
    }
    // Small delay to avoid rate limiting
    await new Promise(r => setTimeout(r, 200));
  }
  
  // Apply translations
  let translatedTitles = 0;
  let translatedDescs = 0;
  
  q.forEach(quest => {
    const oldTitle = quest.title.en;
    if (/[а-яА-ЯёЁ]/.test(oldTitle)) {
      const m = oldTitle.match(/[а-яА-ЯёЁ].+$/);
      if (m) {
        const ruPart = m[0].trim();
        if (translationCache[ruPart]) {
          quest.title.en = oldTitle.replace(ruPart, translationCache[ruPart]);
          translatedTitles++;
        }
      }
    }
    
    const oldDesc = quest.description.en;
    if (/[а-яА-ЯёЁ]/.test(oldDesc)) {
      if (translationCache[oldDesc.trim()]) {
        quest.description.en = translationCache[oldDesc.trim()];
        translatedDescs++;
      }
    }
  });
  
  console.log(`\nWeb-translated titles: ${translatedTitles}`);
  console.log(`Web-translated descs: ${translatedDescs}`);
  
  // Final check
  const finalTitles = q.filter(x => /[а-яА-ЯёЁ]/.test(x.title.en));
  const finalDescs = q.filter(x => /[а-яА-ЯёЁ]/.test(x.description.en));
  console.log(`\nFinal Cyrillic in EN titles: ${finalTitles.length}`);
  console.log(`Final Cyrillic in EN descs: ${finalDescs.length}`);
  
  if (finalTitles.length > 0) {
    console.log('\nStill unfixed:');
    finalTitles.slice(0, 5).forEach(x => console.log(`  ID ${x.id}: "${x.title.en}"`));
  }
  
  fs.writeFileSync(DATA_PATH, JSON.stringify(q, null, 2), 'utf-8');
  console.log('\nFile written!');
}

fixRemaining().catch(e => {
  console.error('Error:', e);
  // Save progress even on error
  fs.writeFileSync(DATA_PATH, JSON.stringify(q, null, 2), 'utf-8');
  console.log('Partial save completed.');
});
