const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'src', 'renderer', 'data');

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

let nextId = 0;
function initNextId(existingIds) {
  nextId = existingIds.size > 0 ? Math.max(...existingIds) + 1 : 1;
}
function generateId(existingIds) {
  const id = nextId++;
  existingIds.add(id);
  return id;
}

function seededRand(seed) {
  let s = seed;
  return () => { s = (s * 1664525 + 1013904223) % 4294967296; return s / 4294967296; };
}

const DIFFICULTIES = ['novice', 'intermediate', 'advanced', 'expert', 'master'];
const XP_BASE = { novice: 25, intermediate: 60, advanced: 120, expert: 220, master: 350 };
const TIME_BASE = { novice: 20, intermediate: 40, advanced: 60, expert: 80, master: 100 };
const MIN_LVL = { novice: 1, intermediate: 5, advanced: 10, expert: 15, master: 20 };
const MEDIA = ['digital', 'traditional', 'both'];

// Collect existing IDs
const existingIds = new Set();
const existingFiles = ['quests_drawing.json','quests_effects.json','quests_animation.json','quests_anatomy.json','quests_storytelling.json'];
for (const f of existingFiles) {
  JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf-8')).forEach(q => existingIds.add(q.id));
}
console.log('Existing IDs: ' + existingIds.size);

// ── CHARACTER DESIGN QUESTS ──
const cdData = [
  // [{topicKey}, [{en_subject, ru_subject}, ...], {en_title_template, ru_title_template}, {en_desc, ru_desc}, [sources]]
  { key: 'silhouette', subjects: [['warrior','воин'],['mage','маг'],['rogue','разбойник'],['hero','герой'],['villain','злодей'],['monster','монстр'],['robot','робот'],['alien','пришелец'],['elf','эльф'],['dwarf','дворф']],
    titleEn: 'Silhouette: {s}', titleRu: 'Силуэт: {s}', descEn: 'Focus on clear, recognizable silhouette. No internal details.', descRu: 'Сосредоточься на чистом читаемом силуэте. Без внутренних деталей.' },
  { key: 'shape_language', subjects: [['cartoon','мультяшный'],['heroic','героический'],['mysterious','таинственный'],['cute','милый'],['menacing','угрожающий'],['elegant','элегантный'],['brutal','брутальный'],['whimsical','причудливый'],['regal','королевский'],['playful','игривый']],
    titleEn: 'Shape Language: {s}', titleRu: 'Язык форм: {s}', descEn: 'Use shapes (circle, square, triangle) to convey personality.', descRu: 'Используй формы (круг, квадрат, треугольник) для передачи характера.' },
  { key: 'proportions', subjects: [['chibi','чиби'],['realistic','реалистичный'],['anime','аниме'],['exaggerated','утрированный'],['stylized','стилизованный'],['semi-realistic','полуреалистичный'],['caricature','карикатура'],['fashion','модный'],['superhero','супергерой'],['fantasy','фэнтези']],
    titleEn: 'Proportions: {s}', titleRu: 'Пропорции: {s}', descEn: 'Study exaggerated and stylized proportions for character design.', descRu: 'Изучай утрированные и стилизованные пропорции.' },
  { key: 'personality', subjects: [['wise elder','мудрый старец'],['trickster','трикстер'],['brave knight','храбрый рыцарь'],['mysterious stranger','таинственный незнакомец'],['comic relief','комический персонаж'],['reluctant hero','неохотный герой'],['tyrant','тиран'],['mentor','наставник'],['survivor','выживший'],['dreamer','мечтатель']],
    titleEn: 'Personality: {s}', titleRu: 'Характер: {s}', descEn: 'Convey personality through body language, expression and design.', descRu: 'Передай характер через язык тела, выражение и дизайн.' },
  { key: 'variety', subjects: [['body types','типы телосложения'],['ages','возрасты'],['species','виды'],['social classes','социальные классы'],['professions','профессии'],['cultures','культуры'],['eras','эпохи'],['fantasy races','фэнтези-расы'],['archetypes','архетипы'],['factions','фракции']],
    titleEn: 'Character Variety: {s}', titleRu: 'Разнообразие: {s}', descEn: 'Design diverse character types with distinct visual identities.', descRu: 'Создай разнообразные типы персонажей с различной визуальной идентичностью.' },
  { key: 'costume', subjects: [['fantasy knight','фэнтези-рыцарь'],['cyberpunk runner','киберпанк-бегун'],['steampunk','стимпанк'],['royal courtier','придворный'],['nomad','кочевник'],['space marine','космодесантник'],['tribal shaman','шаман'],['detective','детектив'],['survivor','выживший'],['superhero','супергерой']],
    titleEn: 'Costume Design: {s}', titleRu: 'Дизайн костюма: {s}', descEn: 'Design functional, visually interesting costume with material variation.', descRu: 'Спроектируй функциональный костюм с вниманием к материалам.' },
  { key: 'expressions', subjects: [['anger','гнев'],['joy','радость'],['sadness','печаль'],['fear','страх'],['surprise','удивление'],['disgust','отвращение'],['contempt','презрение'],['determination','решимость'],['sneer','усмешка'],['crying','плач']],
    titleEn: 'Facial Expressions: {s}', titleRu: 'Мимика: {s}', descEn: 'Draw clear facial expressions conveying specific emotions.', descRu: 'Нарисуй чёткие выражения лица с конкретными эмоциями.' },
  { key: 'turnaround', subjects: [['hero','герой'],['villain','злодей'],['sidekick','напарник'],['creature','существо'],['robot','робот'],['fantasy being','фэнтези-существо'],['alien','пришелец'],['superhero','супергерой'],['mythical','мифическое'],['animal','животное']],
    titleEn: 'Character Turnaround: {s}', titleRu: 'Разворот: {s}', descEn: 'Draw consistent character from all angles — front, side, back, 3/4.', descRu: 'Нарисуй персонажа со всех сторон: спереди, сбоку, сзади, 3/4.' },
  { key: 'sheet', subjects: [['main character','главный герой'],['supporting cast','второстепенные'],['villain group','группа злодеев'],['creature companion','существо-компаньон'],['robot family','семья роботов'],['fantasy race','фэнтези-раса'],['superhero team','команда супергероев'],['mercenaries','наёмники'],['royal family','королевская семья'],['adventurers','искатели приключений']],
    titleEn: 'Model Sheet: {s}', titleRu: 'Лист модели: {s}', descEn: 'Create professional character model sheets for production pipeline.', descRu: 'Создай профессиональные листы моделей для производственного конвейера.' },
  { key: 'creatures', subjects: [['dragon','дракон'],['griffin','грифон'],['kraken','кракен'],['phoenix','феникс'],['chimera','химера'],['werewolf','оборотень'],['basilisk','василиск'],['hydra','гидра'],['golem','голем'],['cerberus','цербер']],
    titleEn: 'Creature Design: {s}', titleRu: 'Существо: {s}', descEn: 'Design believable creatures with unique anatomy and visual appeal.', descRu: 'Спроектируй убедительное существо с уникальной анатомией.' },
  { key: 'mechanical', subjects: [['combat mecha','боевая меха'],['worker robot','робот-рабочий'],['drone','дрон'],['exosuit','экзоскелет'],['cyborg','киборг'],['android','андроид'],['battle armor','боевая броня'],['utility robot','служебный робот'],['spaceship AI','ИИ корабля'],['mechanical beast','механический зверь']],
    titleEn: 'Mechanical Design: {s}', titleRu: 'Механика: {s}', descEn: 'Design mechanical characters with logical structure and detail.', descRu: 'Спроектируй механического персонажа с логичной структурой.' },
  { key: 'fundamentals', subjects: [['basics','основы'],['principles','принципы'],['appeal','привлекательность'],['contrast','контраст'],['rhythm','ритм'],['balance','баланс'],['unity','единство'],['emphasis','акцент'],['proportion','пропорция'],['simplicity','простота']],
    titleEn: 'Design Fundamentals: {s}', titleRu: 'Основы дизайна: {s}', descEn: 'Apply core design principles: appeal, contrast, rhythm, balance.', descRu: 'Примени базовые принципы дизайна: привлекательность, контраст, ритм.' },
];
const CD_SOURCES = ['Character Design for Animation', 'Creating Characters', 'Fundamentals of Character Design', 'The Silver Way', 'Character Design Quarterly'];

// ── ENVIRONMENT DESIGN QUESTS ──
const envData = [
  { key: 'perspective', subjects: [['city street','городская улица'],['interior hallway','коридор'],['mountain road','горная дорога'],['forest path','лесная тропа'],['train station','вокзал'],['castle courtyard','двор замка'],['spaceport','космопорт'],['cave','пещера'],['bridge','мост'],['market alley','рыночный переулок']],
    titleEn: 'Perspective: {s}', titleRu: 'Перспектива: {s}', descEn: 'Practice perspective with accurate vanishing points and depth.', descRu: 'Практикуй перспективу с точными точками схода и глубиной.' },
  { key: 'composition', subjects: [['village square','деревенская площадь'],['battlefield','поле битвы'],['peaceful meadow','мирный луг'],['busy harbor','шумная гавань'],['temple entrance','вход в храм'],['hidden valley','скрытая долина'],['floating islands','парящие острова'],['desert outpost','пустынный форпост'],['ceremonial hall','церемониальный зал'],['flooded ruins','затопленные руины']],
    titleEn: 'Composition: {s}', titleRu: 'Композиция: {s}', descEn: 'Create a well-composed scene with balance, leading lines and focal point.', descRu: 'Создай сцену с балансом, направляющими линиями и фокусом.' },
  { key: 'architecture', subjects: [['cathedral','собор'],['watchtower','сторожевая башня'],['palace gate','дворцовые ворота'],['fortress','крепость'],['aqueduct','акведук'],['lighthouse','маяк'],['gazebo','беседка'],['pagoda','пагода'],['colosseum','колизей'],['windmill','мельница']],
    titleEn: 'Architecture: {s}', titleRu: 'Архитектура: {s}', descEn: 'Study architectural forms, proportions, and structural details.', descRu: 'Изучай архитектурные формы, пропорции и детали.' },
  { key: 'nature', subjects: [['alpine lake','горное озеро'],['canyon','каньон'],['tropical beach','тропический пляж'],['autumn forest','осенний лес'],['arctic tundra','арктическая тундра'],['coral reef','коралловый риф'],['volcanic slope','вулканический склон'],['cherry blossom garden','сад сакуры'],['savanna','саванна'],['bamboo grove','бамбуковая роща']],
    titleEn: 'Nature Scene: {s}', titleRu: 'Природа: {s}', descEn: 'Paint natural environments with terrain, vegetation and atmosphere.', descRu: 'Напиши природное окружение с рельефом, растениями и атмосферой.' },
  { key: 'interior', subjects: [['medieval hall','средневековый зал'],['sci-fi bridge','мостик корабля'],['cozy cabin','уютная хижина'],['library','библиотека'],['tavern','таверна'],['laboratory','лаборатория'],['throne room','тронный зал'],['greenhouse','оранжерея'],['observatory','обсерватория'],['workshop','мастерская']],
    titleEn: 'Interior: {s}', titleRu: 'Интерьер: {s}', descEn: 'Design interior spaces with proper scale, lighting and functionality.', descRu: 'Спроектируй интерьер с правильным масштабом, светом и функцией.' },
  { key: 'props', subjects: [['ancient artifact','древний артефакт'],['sci-fi console','научная консоль'],['magical staff','магический посох'],['treasure chest','сундук с сокровищами'],['lantern','фонарь'],['fountain','фонтан'],['throne','трон'],['alchemy table','алхимический стол'],['music box','музыкальная шкатулка'],['weapon rack','стойка с оружием']],
    titleEn: 'Prop Design: {s}', titleRu: 'Предмет: {s}', descEn: 'Design detailed props that tell a story and fit the environment.', descRu: 'Создай детальный предмет, который рассказывает историю.' },
  { key: 'lighting', subjects: [['sunset beach','закат на пляже'],['moonlit forest','лунный лес'],['stormy sea','штормовое море'],['candlelit room','комната при свечах'],['neon city','неоновый город'],['dungeon','темница'],['aurora sky','северное сияние'],['misty morning','туманное утро'],['dramatic sunset','драматический закат'],['firelit cave','пещера при свете огня']],
    titleEn: 'Lighting: {s}', titleRu: 'Освещение: {s}', descEn: 'Study how lighting defines mood, depth and atmosphere in a scene.', descRu: 'Изучи, как освещение задаёт настроение и глубину.' },
  { key: 'mood', subjects: [['peaceful','спокойствие'],['ominous','зловещее'],['mysterious','таинственное'],['joyful','радостное'],['melancholic','меланхоличное'],['tense','напряжённое'],['serene','безмятежное'],['grandiose','величественное'],['decaying','заброшенное'],['hopeful','надежда']],
    titleEn: 'Atmosphere: {s}', titleRu: 'Атмосфера: {s}', descEn: 'Create mood and emotion through environmental storytelling.', descRu: 'Создай настроение через визуальный сторителлинг окружения.' },
  { key: 'matte', subjects: [['fantasy kingdom','фэнтези-королевство'],['alien world','инопланетный мир'],['ancient ruins','древние руины'],['future city','город будущего'],['underwater realm','подводный мир'],['sky city','небесный город'],['volcanic wasteland','вулканическая пустошь'],['enchanted forest','зачарованный лес'],['mechanical planet','механическая планета'],['floating continent','парящий континент']],
    titleEn: 'Matte Painting: {s}', titleRu: 'Matte painting: {s}', descEn: 'Create a digital matte painting combining photo and painted elements.', descRu: 'Создай цифровой мат-пейнтинг из фото и живописи.' },
];
const ENV_SOURCES = ['Environment Design for Games', 'World Building', 'Environment Art', 'Matte Painting Handbook', 'Sketching from Imagination'];

function buildQuest(topic, difficulty, rand, category, sources) {
  const id = generateId(existingIds);
  const subject = pick(topic.subjects);
  const codePre = category === 'character_design' ? 'CDN' : 'ENV';
  const diffTags = {
    novice: ['basics', topic.key],
    intermediate: ['intermediate', topic.key],
    advanced: ['advanced', topic.key, 'detail'],
    expert: ['expert', 'production', topic.key],
    master: ['master', 'portfolio', topic.key],
  };
  const allTags = [...new Set([...diffTags[difficulty], category, ...topic.key.split('_')])];

  return {
    id,
    code: `${codePre}-${String(id).padStart(5, '0')}`,
    title: { ru: topic.titleRu.replace('{s}', subject[1]), en: topic.titleEn.replace('{s}', subject[0]) },
    category,
    difficulty,
    description: { ru: topic.descRu, en: topic.descEn },
    xp: XP_BASE[difficulty] + Math.floor(rand() * 20),
    estimatedTime: TIME_BASE[difficulty] + Math.floor(rand() * 15),
    source: pick(sources),
    icon: category === 'character_design' ? '🎭' : '🏞️',
    color: category === 'character_design' ? '#f97316' : '#0891b2',
    min_level: MIN_LVL[difficulty],
    tags: allTags,
    prerequisites: [],
    medium: pick(MEDIA),
    is_repeatable: false,
    review_after_days: 0,
    streak_bonus: 1,
  };
}

function generateAll(topicData, category, sources) {
  const rand = seededRand(category === 'character_design' ? 4242 : 8080);
  const quests = [];
  for (let i = 0; i < 200; i++) {
    const topic = topicData[i % topicData.length];
    const difficulty = DIFFICULTIES[Math.floor(rand() * DIFFICULTIES.length)];
    quests.push(buildQuest(topic, difficulty, rand, category, sources));
  }
  return quests;
}

initNextId(existingIds);
const cdQuests = generateAll(cdData, 'character_design', CD_SOURCES);
const envQuests = generateAll(envData, 'environment', ENV_SOURCES);

fs.writeFileSync(path.join(DATA_DIR, 'quests_character_design.json'), JSON.stringify(cdQuests, null, 2), 'utf-8');
fs.writeFileSync(path.join(DATA_DIR, 'quests_environment.json'), JSON.stringify(envQuests, null, 2), 'utf-8');

console.log(`Character Design: ${cdQuests.length} quests (IDs ${cdQuests[0].id}–${cdQuests[cdQuests.length-1].id})`);
console.log(`Environment: ${envQuests.length} quests (IDs ${envQuests[0].id}–${envQuests[envQuests.length-1].id})`);
console.log('Done!');
