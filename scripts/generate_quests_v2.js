const fs = require('fs');
const path = require('path');

const QUESTS_PER_DIFF = 40;
const DEFAULT_SEED = 42;

const SUBJECTS = {
  "Drawing": ["куба", "сферы", "цилиндра", "руки в жесте", "портрета в 3/4", "натюрморта", "пейзажа", "персонажа", "архитектурного фрагмента"],
  "Anatomy": ["торса", "кисти", "стопы", "головы в анфас", "фигуры в движении", "скелета таза", "плечевого пояса", "лицевой мимики", "позвоночника", "мускулатуры ног"],
  "Animation": ["мяча с отскоком", "фигуры в шаге", "персонажа в прыжке", "хвоста животного", "ткани на ветру", "камеры с панорамой", "объекта с весом", "диалоговой сцены", "цикла бега", "реакции персонажа"],
  "Effects": ["огня", "дыма", "воды с брызгами", "магической энергии", "взрывной волны", "дождя", "искр", "тумана", "плави", "электрической дуги"],
  "Storytelling": ["сцены погони", "диалога", "момента открытия", "тихой сцены", "кульминации", "флешбэка", "перехода между локациями", "эмоционального пика", "завязки", "развязки"]
};

const CONSTRAINTS = {
  "traditional": ["без ластика", "только уголь/карандаш", "ограничение 3 оттенками серого", "одним инструментом", "без растушевки"],
  "digital": ["без ctrl+z", "только 1 кисть", "ограничение палитры 5 цветов", "слой только для скетча", "без blending modes"],
  "both": ["по таймеру", "без референса", "в негативном пространстве", "закрытыми глазами первые 10 сек", "только прямые/только кривые линии"]
};

const SOURCES = {
  "Drawing": ["Drawabox Lesson 1-3", "Proko Figure Basics", "Michael Hampton Figure Drawing", "Scott Robertson HTDRAW"],
  "Anatomy": ["Bridgman Constructive Anatomy", "Michael Hampton", "Christopher Hart", "Atlas of Human Anatomy"],
  "Animation": ["Richard Williams Animator's Survival Kit", "Animation Mentor", "12 Principles Disney", "Alan Becker Tutorials"],
  "Effects": ["Elemental Magic Vol 1-2", "FX Animation Guide", "Ufotable/Trigger Breakdowns", "Houdini for Artists"],
  "Storytelling": ["Framed Inc", "Scott McCloud Understanding Comics", "Storyboard Essentials", "Pixar Storytelling"]
};

const CATEGORY_META = {
  "Drawing": {"code": "DRA", "icon": "🎨", "color": "#6366f1"},
  "Anatomy": {"code": "ANA", "icon": "🦴", "color": "#ec4899"},
  "Animation": {"code": "ANM", "icon": "🎬", "color": "#10b981"},
  "Effects": {"code": "EFF", "icon": "✨", "color": "#f59e0b"},
  "Storytelling": {"code": "STR", "icon": "📖", "color": "#8b5cf6"}
};

const DIFFICULTY_CONFIG = {
  "novice":       {"xp_base": 50,  "time_base": 18, "mult": 1.0},
  "intermediate": {"xp_base": 80,  "time_base": 28, "mult": 1.3},
  "advanced":     {"xp_base": 140, "time_base": 42, "mult": 1.7},
  "master":       {"xp_base": 200, "time_base": 60, "mult": 2.1},
  "expert":       {"xp_base": 250, "time_base": 85, "mult": 2.5}
};

const EXERCISE_TEMPLATES = {
  "Drawing": {
    "novice": [
      {"t_ru": "Быстрый жест: {0} ({1} сек)", "t_en": "Quick gesture: {0} ({1} sec)", "d_ru": "Захвати линию действия и общую форму. Не рисуй детали.", "d_en": "Capture the line of action and overall shape. Don't draw details.", "tags": ["gesture"], "m": "both", "rep": false},
      {"t_ru": "Контурный рисунок {0} вслепую", "t_en": "Contour drawing of {0} blindly", "d_ru": "Гляди только на объект. Развивай зрительно-моторную связь.", "d_en": "Just look at the object. Develop your visual-motor connection.", "tags": ["contour"], "m": "traditional", "rep": false},
    ],
    "intermediate": [
      {"t_ru": "Конструктивный {0} в 3/4", "t_en": "Constructive {0} in 3/4 view", "d_ru": "Вращай форму в пространстве. Проверь эллипсы и перспективу.", "d_en": "Rotate form in space. Check ellipses and perspective.", "tags": ["construction"], "m": "both", "rep": false}
    ]
  },
  "Anatomy": {
    "novice": [
      {"t_ru": "Жестовые наброски фигуры ({1} сек)", "t_en": "Gesture sketches of figure ({1} sec)", "d_ru": "Поиск линии действия, центра тяжести и общей динамики.", "d_en": "Search for line of action, center of gravity and overall dynamism.", "tags": ["gesture"], "m": "both", "rep": false}
    ]
  }
};

function seededRandom(seed) {
  return function() {
    seed = (seed * 1664525 + 1013904223) >>> 0;
    return seed / 0xFFFFFFFF;
  };
}

function generateQuests(count = 1000, seed = DEFAULT_SEED) {
  const random = seededRandom(seed);
  const quests = [];
  const seenKeys = new Set();
  let globalId = 1;
  let skipped = 0;

  for (const cat in EXERCISE_TEMPLATES) {
    const templatesByDiff = EXERCISE_TEMPLATES[cat];
    const difficulties = Object.keys(templatesByDiff);
    
    for (const diff of difficulties) {
      const templates = templatesByDiff[diff];
      const cfg = DIFFICULTY_CONFIG[diff];
      const meta = CATEGORY_META[cat];

      let generatedForDiff = 0;

      while (generatedForDiff < QUESTS_PER_DIFF) {
        const tmpl = templates[Math.floor(random() * templates.length)];
        const subjects = SUBJECTS[cat] || ["объекта"];
        const subject = subjects[Math.floor(random() * subjects.length)];
        const medium = tmpl.m || "both";
        const constraint = CONSTRAINTS[medium][Math.floor(random() * CONSTRAINTS[medium].length)];
        
        const hasSec = (tmpl.t_ru || '').includes("{1}") || (tmpl.t_en || '').includes("{1}");
        const sec = hasSec ? Math.floor(random() * 15) + 15 : "";
        
        // Generate BOTH Russian and English versions
        const title_ru = (tmpl.t_ru || '').replace("{0}", subject).replace("{1}", sec);
        const title_en = (tmpl.t_en || '').replace("{0}", subject).replace("{1}", sec);
        const desc_ru = `${tmpl.d_ru || ''} Ограничение: ${constraint}. Референс: ${SOURCES[cat][Math.floor(random() * SOURCES[cat].length)]}.`;
        const desc_en = `${tmpl.d_en || ''} Constraint: ${constraint}. Source: ${SOURCES[cat][Math.floor(random() * SOURCES[cat].length)]}.`;
        
        const xp = Math.floor(cfg.xp_base * cfg.mult * (0.9 + random() * 0.2));
        const time = Math.floor(cfg.time_base * cfg.mult * (0.8 + random() * 0.4));

        const q = {
          id: globalId,
          code: `${meta.code}-${String(globalId).padStart(4, '0')}`,
          title: { ru: title_ru.trim(), en: title_en.trim() },
          category: cat,
          difficulty: diff,
          description: { ru: desc_ru.trim(), en: desc_en.trim() },
          xp: xp,
          estimatedTime: time,
          source: SOURCES[cat][Math.floor(random() * SOURCES[cat].length)],
          icon: meta.icon,
          color: meta.color,
          tags: tmpl.tags || [],
          prerequisites: [],
          medium: medium,
          is_repeatable: tmpl.rep || false,
          review_after_days: tmpl.rev || 0,
          streak_bonus: ["advanced", "master", "expert"].includes(diff) ? 1.1 : 1.0
        };

        const key = `${q.title.ru.toLowerCase().trim()}|${q.title.en.toLowerCase().trim()}`;
        
        if (seenKeys.has(key)) {
          skipped++;
          if (skipped > 500) break;
          continue;
        }

        seenKeys.add(key);
        quests.push(q);
        generatedForDiff++;
        globalId++;
      }
    }
  }

  console.log(`\n✅ Сгенерировано: ${quests.length} | Пропущено дублей: ${skipped}`);
  
  return quests;
}

const quests = generateQuests(1000, 42);

const outputDir = path.join(__dirname, '..', 'src', 'renderer', 'data');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'quests.json');
fs.writeFileSync(outputPath, JSON.stringify(quests, null, 2), 'utf-8');
console.log(`📄 ${outputPath}`);

const manifest = {
  version: "2.0",
  total: quests.length,
  categories: Object.fromEntries(
    Object.keys(EXERCISE_TEMPLATES).map(cat => [cat, quests.filter(q => q.category === cat).length])
  ),
  seed: 42,
  generated_at: Date.now()
};
fs.writeFileSync(path.join(outputDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf-8');
console.log(`📋 manifest.json создан`);
console.log(`✨ Готово!`);
