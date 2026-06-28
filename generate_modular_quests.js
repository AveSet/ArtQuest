const fs = require('fs');

const SUBJECTS = {
    "Drawing": {
        "beginner": [
            "куба", "сферы", "цилиндра", "конуса", "простых геометрических форм", 
            "базовых предметов (чашка, книга, телефон)", "простых фруктов", 
            "плоских паттернов", "базовых силуэтов", "простых линий и штрихов"
        ],
        "intermediate": [
            "натюрморта из 3-5 объектов", "мебели (стул, стол, лампа)", 
            "растений в горшках", "посуды и кухонной утвари", "электроники", 
            "одежды на вешалке", "обуви", "сумок и аксессуаров", 
            "простых интерьеров", "уличных фонарей и знаков"
        ],
        "advanced": [
            "персонажа в полный рост", "портрета с передачей характера", 
            "сложной техники (велосипед, камера, инструмент)", 
            "архитектурных фрагментов", "пейзажа с глубиной", 
            "фэнтези-существ", "мехов и роботов", "транспортных средств", 
            "сложных драпировок", "многофигурной композиции"
        ]
    },
    "Anatomy": {
        "beginner": [
            "жестов фигуры (30-60 сек)", "пропорций тела (метод 7.5-8 голов)", 
            "кисти руки", "стопы", "головы в анфас/профиль", 
            "торса без деталей", "простых поз стоя/сидя", 
            "базовых мышечных групп", "костных ориентиров", "суставов"
        ],
        "intermediate": [
            "рук в динамике", "ног при ходьбе", "плечевого пояса", 
            "лицевой мимики (5 базовых эмоций)", "позвоночника в движении", 
            "мускулатуры ног", "наклонов и скручиваний торса", 
            "весового распределения", "анатомии под простой одеждой", 
            "пропорций в перспективе"
        ],
        "advanced": [
            "сложных динамичных поз", "перспективного сокращения конечностей", 
            "анатомии в экстремальных ракурсах", "старения и типов телосложения", 
            "анатомии существ (квадрупедалы, крылья)", 
            "телесного актёрства (намерение через позу)", 
            "анатомии для анимации (упрощение)", 
            "турнарота персонажа (3 ракурса)", "экспрессивной стилизации", 
            "разрезов и медицинских схем"
        ]
    },
    "Animation": {
        "beginner": [
            "мяча с отскоком", "простых форм в движении", "прыжка", 
            "падения предмета", "отскока от поверхности", "базовых дуг движения", 
            "сжатия и растяжения", "замедления в начале/конце", 
            "простых циклов (4-8 кадров)", "реакции на стимул"
        ],
        "intermediate": [
            "персонажа в цикле ходьбы", "эмоциональной реакции", 
            "простых действий (поднять, бросить, сесть)", 
            "цикла бега с фазой полёта", "вторичной анимации (волосы/одежда)", 
            "синхронизации губ (5 сек)", "взаимодействия с лёгким объектом", 
            "пантомимы (10 сек)", "камеры с простым движением", 
            "переходов между позами"
        ],
        "advanced": [
            "сложных боевых циклов", "диалоговых сцен с подтекстом", 
            "акробатических элементов", "взаимодействия с тяжёлым объектом", 
            "множественных персонажей в кадре", "аниматика с монтажом", 
            "стилизации движения (аниме/картун)", "сцен с физикой ткани/жидкости", 
            "режиссёрских ракурсов", "финальной полировки (spacing/curves)"
        ]
    },
    "Effects": {
        "beginner": [
            "огня (базовая форма)", "дыма (плавные переходы)", 
            "простых частиц", "свечения (glow)", "искр", 
            "магической энергии (статика)", "пыли", "пара", 
            "простых волн", "базовых текстур энергии"
        ],
        "intermediate": [
            "воды с брызгами", "взрывной волны", "магических снарядов", 
            "погодных эффектов (дождь/снег)", "электрических дуг", 
            "лавовых потоков", "тумана с глубиной", "силовых полей", 
            "разрушения простых объектов", "комбинации 2 стихий"
        ],
        "advanced": [
            "кинематографичных взрывов", "сложных симуляций жидкости", 
            "магических ритуалов/порталов", "разрушений архитектуры", 
            "стихийных бедствий (шторм/извержение)", 
            "композитинга эффектов в сцену", "реал-тайм оптимизации", 
            "мультислойных магических атак", "физически корректного дыма/огня", 
            "финальных VFX-шотов для портфолио"
        ]
    },
    "Storytelling": {
        "intermediate": [
            "простых сцен (1 персонаж)", "эмоциональных моментов", 
            "композиции кадра (правило третей)", "раскадровки (3 кадра)", 
            "настроения через свет", "тихих сцен покоя", 
            "моментов открытия/удивления", "переходов между локациями", 
            "базового визуального ритма", "силуэтной читаемости"
        ],
        "advanced": [
            "сцен с действием (погоня/бой)", "диалогов с напряжением", 
            "кульминационных моментов", "визуальных метафор", 
            "динамичных ракурсов камеры", "цветовых скриптов", 
            "монтажных переходов", "сцен с 2+ персонажами", 
            "атмосферного окружения", "подтекста без слов"
        ],
        "expert": [
            "полных сцен (начало-середина-конец)", "сложных нарративных дуг", 
            "режиссёрского планирования", "питч-деков", 
            "левел-арта с навигацией", "многосценичной непрерывности", 
            "визуального языка проекта", "профессиональных аниматиков", 
            "сцен с ограниченным бюджетом/сроками", "финальных подач для студий"
        ]
    }
};

const TECHNIQUES = {
    "Drawing": [
        "block-in на отдельном слое", "line art со стабилизацией", 
        "flat colors с заливкой", "soft brush rendering", 
        "layer masking (недеструктивно)", "blend modes (multiply/overlay)", 
        "perspective grid overlay", "texture overlay (soft light)", 
        "speedpaint с таймером", "value study (3 тона)", 
        "color adjustment (curves/levels)", "custom brush creation"
    ],
    "Anatomy": [
        "gesture layer + construction layer", "muscle mapping overlay", 
        "proportions grid", "foreshortening guides", 
        "turnaround template", "weight distribution sketch", 
        "expression sheet", "anatomy simplification", 
        "dynamic pose construction", "medical cross-section"
    ],
    "Animation": [
        "onion skinning", "graph editor refinement", 
        "pose-to-pose workflow", "straight-ahead for secondary", 
        "lip-sync breakdown", "cycle loop testing", 
        "camera tracking setup", "timing chart analysis", 
        "spacing distribution", "arc visualization"
    ],
    "Effects": [
        "add/screen blending", "particle system basics", 
        "layer stacking (core/glow/smoke)", "gradient mapping", 
        "turbulence noise", "motion blur simulation", 
        "light wrap technique", "chromatic aberration pass", 
        "alpha channel masking", "procedural variation"
    ],
    "Storytelling": [
        "thumbnail iteration (5 вариантов)", "color script planning", 
        "leading lines composition", "focal point hierarchy", 
        "shot type variation (wide/medium/close)", "180° rule application", 
        "visual metaphor placement", "pacing through panel size", 
        "lighting for mood", "negative space usage"
    ]
};

const CONTEXTS = {
    "lighting": ["верхний свет", "боковой контровой", "рассеянный дневной", "ночной неон", "свечение экрана", "закатное тепло", "холодный офисный", "драматичный chiaroscuro"],
    "environment": ["пустая комната", "улица города", "лесная тропа", "космическая станция", "подводный мир", "пустыня", " заснеженные горы", "фэнтези-таверна"],
    "mood": ["спокойствие", "напряжение", "радость", "меланхолия", "тревога", "торжественность", "игривость", "эпичность"],
    "time": ["утро", "полдень", "сумерки", "глубокая ночь", "рассвет", "закат", "полнолуние", "пасмурный день"]
};

const FOCUS_AREAS = [
    "читаемость силуэта", "точность пропорций", "плавность переходов", 
    "баланс композиции", "передача веса/объёма", "чистота лайнарта", 
    "логика освещения", "эмоциональная подача", "техническая оптимизация", 
    "соответствие стилю", "динамика движения", "глубина пространства"
];

const SOURCES = {
    "Drawing": ["Drawabox Lesson 1-3", "Scott Robertson HTDRAW", "Proko Figure Basics", "Michael Hampton Figure Drawing"],
    "Anatomy": ["Proko Anatomy", "Michael Hampton Figure Drawing", "Bridgman Constructive Anatomy", "Atlas of Human Anatomy"],
    "Animation": ["The Animator's Survival Kit", "Richard Williams Animation Course", "12 Principles of Animation", "Blender Animation"],
    "Effects": ["The VFX Handbook", "Nuke Compositing Guide", "Blender Particle Systems", "After Effects Trapcode"],
    "Storytelling": ["Storytelling for Animation", "Framed Ink", "Cinematography for 3D Artists", "Visual Story by Bruck"]
};

const CATEGORY_META = {
    "Drawing": {"code": "DRA", "icon": "🎨", "color": "#6366f1"},
    "Anatomy": {"code": "ANA", "icon": "🦴", "color": "#ec4899"},
    "Animation": {"code": "ANM", "icon": "🎬", "color": "#10b981"},
    "Effects": {"code": "VFX", "icon": "✨", "color": "#f59e0b"},
    "Storytelling": {"code": "STY", "icon": "📖", "color": "#8b5cf6"}
};

const DIFFICULTY_MAP = {
    1: "beginner", 2: "beginner", 3: "beginner", 4: "beginner", 5: "beginner",
    6: "intermediate", 7: "intermediate", 8: "intermediate", 9: "intermediate", 10: "intermediate",
    11: "advanced", 12: "advanced", 13: "advanced", 14: "advanced", 15: "advanced",
    16: "expert", 17: "expert", 18: "expert", 19: "expert", 20: "expert"
};

const XP_MAP = {"beginner": 45, "intermediate": 95, "advanced": 190, "expert": 320};
const TIME_MAP = {
    "beginner": [20, 35], "intermediate": [35, 55], "advanced": [55, 85], "expert": [85, 120]
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randRange(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

const RU_EN = {
    "верхний свет": "top light", "боковой контровой": "side rim light", "рассеянный дневной": "soft daylight",
    "ночной неон": "night neon", "пустая комната": "empty room", "улица города": "city street",
    "лесная тропа": "forest path", "спокойствие": "calm", "напряжение": "tension", "радость": "joy",
    "утро": "morning", "полдень": "noon", "сумерки": "twilight", "глубокая ночь": "late night",
    "Создай работу": "Create artwork", " используя ": " using ", "Контекст:": "Context:",
    "Основной фокус:": "Focus:", "Источник:": "Source:"
};

function translateToEn(text) {
    let result = text;
    for (const [ru, en] of Object.entries(RU_EN)) {
        result = result.replace(new RegExp(ru, 'g'), en);
    }
    return result;
}

function generateQuest(globalId) {
    const level = randRange(1, 20);
    const difficulty = DIFFICULTY_MAP[level];
    
    let categories;
    if (difficulty === "beginner") categories = ["Drawing", "Anatomy", "Animation"];
    else if (difficulty === "intermediate") categories = ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"];
    else if (difficulty === "advanced") categories = ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"];
    else categories = ["Storytelling"]; // expert only Storytelling
    
    // Filter out empty categories
    categories = categories.filter(c => SUBJECTS[c] && SUBJECTS[c][difficulty]);
    
    const category = rand(categories);
    const meta = CATEGORY_META[category];
    
    const subject = rand(SUBJECTS[category][difficulty]);
    const techniques = TECHNIQUES[category];
    let technique;
    if (difficulty === "beginner") technique = rand(techniques.slice(0, 4));
    else if (difficulty === "intermediate") technique = rand(techniques.slice(4, 8));
    else technique = rand(techniques.slice(8));
    
    let context = "";
    let contextType = "";
    if (Math.random() > 0.5) {
        contextType = rand(Object.keys(CONTEXTS));
        context = ` Контекст: ${rand(CONTEXTS[contextType])}.`;
    }
    
    const focus = rand(FOCUS_AREAS);
    
    const title = `${technique}: ${subject} (${level} ур.)`;
    const description = `Создай работу, используя ${technique}.${context} Основной фокус: ${focus}. Источник: ${rand(SOURCES[category])}.`;
    
    const baseXp = XP_MAP[difficulty];
    const baseTime = TIME_MAP[difficulty];
    const xp = Math.floor(baseXp * (0.9 + Math.random() * 0.25));
    const time = randRange(baseTime[0], baseTime[1]);
    
    const tags = [difficulty, category.toLowerCase(), "digital"];
    if (contextType) tags.push(contextType);
    
    return {
        id: globalId,
        code: `${meta['code']}-${String(globalId).padStart(4, '0')}`,
        title: { "ru": title, "en": translateToEn(title) },
        category: category.toLowerCase(),
        difficulty: difficulty,
        description: { "ru": description, "en": translateToEn(description) },
        xp: xp,
        estimatedTime: time,
        source: rand(SOURCES[category]),
        icon: meta.icon,
        color: meta.color,
        tags: tags,
        prerequisites: [],
        medium: "digital",
        is_repeatable: difficulty === "expert",
        review_after_days: difficulty === "advanced" ? 7 : 0,
        streak_bonus: difficulty === "advanced" || difficulty === "expert" ? 1.1 : 1.0
    };
}

const levelsPerDifficulty = {
    1: 200, 2: 180, 3: 160, 4: 140, 5: 120,
    6: 110, 7: 100, 8: 90, 9: 80, 10: 70,
    11: 60, 12: 50, 13: 40, 14: 30, 15: 20,
    16: 10, 17: 8, 18: 6, 19: 4, 20: 2
};

const quests = [];
let globalId = 1;

for (const [level, count] of Object.entries(levelsPerDifficulty)) {
    for (let i = 0; i < count; i++) {
        quests.push(generateQuest(globalId));
        globalId++;
    }
}

fs.writeFileSync('src/renderer/src/data/quests.json', JSON.stringify(quests, null, 2), 'utf8');

console.log(`✅ Сгенерировано ${quests.length} уникальных квестов!`);
const counts = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
quests.forEach(q => counts[q.difficulty]++);
console.log(`📊 Распределение: beginner=${counts.beginner}, intermediate=${counts.intermediate}, advanced=${counts.advanced}, expert=${counts.expert}`);