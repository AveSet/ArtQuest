const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'renderer', 'data');
const FILES = [
  'quests_drawing.json',
  'quests_effects.json',
  'quests_animation.json',
  'quests_anatomy.json',
  'quests_storytelling.json',
];

// ── Glossary: English → Russian for art terms found in RU fields ──
const GLOSSARY = {
  // Composition terms
  'rule of thirds': 'правило третей',
  'leading lines': 'направляющие линии',
  'visual weight': 'визуальный вес',
  'focal point': 'фокусная точка',
  'negative space': 'негативное пространство',
  'visual flow': 'визуальный поток',
  'frame composition': 'композиция кадра',
  'readability': 'читаемость',
  'silhouette readability': 'читаемость силуэта',

  // Drawing/painting terms
  'blending': 'смешивание',
  'blend modes': 'режимы наложения',
  'soft light': 'мягкий свет',
  'overlay': 'перекрытие',
  'multiply': 'умножение',
  'adjustment layers': 'корректирующие слои',
  'color grading': 'цветокоррекция',
  'grayscale': 'оттенки серого',
  'sharpening': 'повышение резкости',
  'opacity': 'непрозрачность',
  'scatter': 'разброс',
  'dynamics': 'динамика',
  'streamline': 'сглаживание',
  'stabilizer': 'стабилизатор',
  'digital tracing': 'цифровая обводка',
  'smart objects': 'смарт-объекты',
  'masks': 'маски',
  'base': 'основа',
  'detail': 'деталь',
  'shape': 'форма',

  // Color terms
  'palette arc': 'цветовая дуга',
  'hue': 'тон',
  'saturation': 'насыщенность',
  'brightness': 'яркость',
  'warm': 'тёплый',
  'cool': 'холодный',
  'light': 'светлый',
  'dark': 'тёмный',
  'mid': 'средний',

  // Animation terms
  'spacing': 'спейсинг',
  'timing': 'тайминг',
  'curves': 'кривые',
  'hold frames': 'заморозка кадров',
  'Onion skinning': 'луковая кожура',
  'Follow-through': 'доведение движения',
  'overlapping action': 'перекрывающееся действие',
  'organic feel': 'органичность',
  'visemes': 'виземы',
  'blend tree': 'дерево смешения',
  'LOD': 'уровень детализации',
  'full pipeline': 'полный конвейер',
  'pipeline ready': 'готово к конвейеру',
  'ball bounce': 'отскок мяча',
  'speed run': 'скоростной забег',
  'pro level': 'профессиональный уровень',
  'prof level': 'профессиональный уровень',
  'animation challenge': 'челлендж по анимации',

  // 3D/technical terms
  'shaders': 'шейдеры',
  'deformation': 'деформация',
  'optimization': 'оптимизация',
  'technical specs': 'технические характеристики',
  'bounce light': 'отражённый свет',

  // Effect/VFX terms
  'particles': 'частицы',
  'smoke': 'дым',
  'sparks': 'искры',
  'core': 'ядро',
  'build up': 'нарастание',
  'buildup': 'нарастание',
  'decay': 'затухание',
  'dissipation': 'рассеивание',
  'vortices': 'вихри',
  'source': 'источник',
  'crossfade': 'плавный переход',
  'Crossfade': 'плавный переход',
  'Heat map': 'тепловая карта',

  // Anatomy terms
  'foreshortening': 'ракурсное сокращение',
  'block figure': 'блочная фигура',
  'mapping': 'маппинг',
  'bio-mechanics': 'биомеханика',
  'pronation': 'пронация',
  'supination': 'супинация',
  'anime': 'аниме',
  'realism': 'реализм',

  // Storytelling/cinematic terms
  'frame': 'кадр',
  'storyboard': 'раскадровка',
  'panels': 'панели',
  'shot alternation': 'чередование планов',
  'rule continuity': 'правило непрерывности',
  'focus': 'фокус',
  'depth': 'глубина',
  'atmosphere': 'атмосфера',
  'visual story': 'визуальная история',
  'environment story': 'история окружения',
  'symbolism': 'символизм',
  'drama': 'драматургия',
  'intonation': 'интонация',
  'peak emotion': 'пик эмоции',
  'cinematic quality': 'кинематографичность',

  // Perspective/geometry
  'block figure': 'блочная фигура',
  'edge': 'грань',

  // File/software
  'PSD': 'PSD',
  'ctrl+z': 'Ctrl+Z',

  // Other
  'thumbnails': 'миниатюры',
  'variants': 'варианты',
  'sheet': 'лист',
  'view': 'вид',
  'frames': 'кадры',
  'scale': 'масштаб',
  'blind': 'вслепую',
  'side': 'боковой',
  'front': 'фронтальный',
  'medium': 'средний',
  'wide': 'широкий',
  'close': 'крупный',
  'show': 'показ',
  'tell': 'рассказывай',
  "don't": 'не',

  // Remaining specific patterns
  '2-layer effect': 'двухслойный эффект',
  '24h animation': 'анимационный марафон',
};

// ── Replacements that need to be applied as whole phrases first ──
const PHRASE_REPLACEMENTS = [
  // Multi-word phrases must be replaced before single words
  ['rule of thirds', 'правило третей'],
  ['leading lines', 'направляющие линии'],
  ['visual weight', 'визуальный вес'],
  ['adjustment layers', 'корректирующие слои'],
  ['blend modes', 'режимы наложения'],
  ['blend tree', 'дерево смешения'],
  ['smart objects', 'смарт-объекты'],
  ['soft light', 'мягкий свет'],
  ['organic feel', 'органичность'],
  ['Overlapping action', 'перекрывающееся действие'],
  ['follow-through', 'доведение движения'],
  ['Follow-through', 'доведение движения'],
  ['onion skinning', 'луковая кожура'],
  ['Onion skinning', 'луковая кожура'],
  ['hold frames', 'заморозка кадров'],
  ['color grading', 'цветокоррекция'],
  ['full pipeline', 'полный конвейер'],
  ['pipeline ready', 'готово к конвейеру'],
  ['visual flow', 'визуальный поток'],
  ['focal point', 'фокусная точка'],
  ['negative space', 'негативное пространство'],
  ['heat map', 'тепловая карта'],
  ['ball bounce', 'отскок мяча'],
  ['speed run', 'скоростной забег'],
  ['pro level', 'профессиональный уровень'],
  ['prof level', 'профессиональный уровень'],
  ['animation challenge', 'челлендж по анимации'],
  ['peak emotion', 'пик эмоции'],
  ['shot alternation', 'чередование планов'],
  ['rule continuity', 'правило непрерывности'],
  ['technical specs', 'технические характеристики'],
  ['bounce light', 'отражённый свет'],
  ['cinematic quality', 'кинематографичность'],
  ['environment story', 'история окружения'],
  ['digital tracing', 'цифровая обводка'],
  ['2-layer effect', 'двухслойный эффект'],
  ['24h animation', 'анимационный марафон'],
  ['curves/levels', 'кривые/уровни'],
  ["don't tell", 'не рассказывай'],
  ['/levels', '/уровни'],
];

// Sort by length (longest first) to avoid partial replacements
PHRASE_REPLACEMENTS.sort((a, b) => b[0].length - a[0].length);
const SORTED_GLOSSARY = Object.entries(GLOSSARY).sort((a, b) => b[0].length - a[0].length);

function fixText(text, fieldName) {
  if (!text) return text;
  let result = text;

  // 1. Apply phrase replacements first
  for (const [en, ru] of PHRASE_REPLACEMENTS) {
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'gi');
    result = result.replace(regex, ru);
  }

  // 1b. Fix mixed Russian/English patterns
  result = result.replace(/кривые\/levels/gi, 'кривые/уровни');

  // 2. Apply glossary (word-boundary matching)
  for (const [en, ru] of SORTED_GLOSSARY) {
    const escaped = en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp('\\b' + escaped + '\\b', 'gi');
    result = result.replace(regex, ru);
  }

  // 3. Post-processing: clean up artifacts
  // Remove orphaned parentheses after term replacement
  result = result.replace(/\(\s*\)/g, '').trim();
  result = result.replace(/\s{2,}/g, ' ');

  return result;
}

// ── Stats ──
let stats = { titlesFixed: 0, descsFixed: 0, totalEnglishTitles: 0, totalEnglishDescs: 0 };
const fileDetails = [];

for (const filename of FILES) {
  const filePath = path.join(DATA_DIR, filename);
  const quests = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  let fileTitles = 0, fileDescs = 0;

  for (const q of quests) {
    const oldTitle = q.title.ru;
    const oldDesc = q.description.ru;

    // Check if there's any English
    const hasEnglishTitle = /[A-Za-z]{3,}/.test(oldTitle);
    const hasEnglishDesc = /[A-Za-z]{3,}/.test(oldDesc);

    if (hasEnglishTitle) stats.totalEnglishTitles++;
    if (hasEnglishDesc) stats.totalEnglishDescs++;

    const newTitle = fixText(oldTitle, 'title.ru');
    const newDesc = fixText(oldDesc, 'description.ru');

    if (newTitle !== oldTitle) {
      q.title.ru = newTitle;
      fileTitles++;
    }
    if (newDesc !== oldDesc) {
      q.description.ru = newDesc;
      fileDescs++;
    }
  }

  stats.titlesFixed += fileTitles;
  stats.descsFixed += fileDescs;
  fileDetails.push({ file: filename, titlesFixed: fileTitles, descsFixed: fileDescs, total: quests.length });

  fs.writeFileSync(filePath, JSON.stringify(quests, null, 2), 'utf-8');
  console.log(`✓ ${filename}: fixed ${fileTitles} titles, ${fileDescs} descriptions`);
}

// ── Report ──
console.log('\n═══ RUSSIAN TRANSLATION FIX REPORT ═══');
console.log(`Total quests processed: ${fileDetails.reduce((s, f) => s + f.total, 0)}`);
console.log(`Titles with English before fix: ${stats.totalEnglishTitles}`);
console.log(`Descriptions with English before fix: ${stats.totalEnglishDescs}`);
console.log(`Titles fixed: ${stats.titlesFixed}`);
console.log(`Descriptions fixed: ${stats.descsFixed}`);
console.log(`\nPer file:`);
for (const f of fileDetails) {
  console.log(`  ${f.file}: ${f.titlesFixed} titles, ${f.descsFixed} descs (of ${f.total})`);
}
console.log('═══════════════════════════════════════');
