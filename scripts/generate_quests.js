const fs = require('fs');
const path = require('path');

const QUESTS_PER_DIFF = 40;
const DEFAULT_SEED = 42;

const Quest = {
  id: 0,
  code: '',
  title: { ru: '', en: '' },
  category: '',
  difficulty: '',
  description: { ru: '', en: '' },
  xp: 0,
  estimatedTime: 0,
  source: '',
  icon: '',
  color: '',
  tags: [],
  prerequisites: [],
  medium: 'both',
  is_repeatable: false,
  review_after_days: 0,
  streak_bonus: 1.0
};

const SUBJECTS = {
  "Drawing": ["куба", "сферы", "цилиндра", "руки в жесте", "портрета в 3/4", "натюрморта", "пейзажа", "персонажа", "архитектурного фрагмента"],
  "Anatomy": ["торса", "кисти", "стопы", "головы в анфас", "фигуры в движении", "скелета таза", "плечевого пояса", "лицевой мимики", "позвоночника", "мускулатуры ног"],
  "Animation": ["мяча с отскоком", "фигуры в шаге", "персонажа в прыжке", "хвоста животного", "ткани на ветру", "камеры с панорамой", "объекта с весом", "диалоговой сцены", "цикла бега", "реакции персонажа"],
  "Effects": ["огня", "дыма", "воды с брызгами", "магической энергии", "взрывной волны", "дождя", "искр", "тумана", "лавы", "электрической дуги"],
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
      {"t_ru": "Быстрый жест: {0} ({1} сек)", "t_en": "Quick gesture: {0} ({1} sec)", "d_ru": "Захвати линию действия и общую форму. Не рисуй детали.", "d_en": "Capture the line of action and overall shape. Don't draw details.", "tags": ["gesture", "speed"], "m": "both"},
      {"t_ru": "Контурный рисунок {0} вслепую", "t_en": "Contour drawing of {0} blindly", "d_ru": "Гляди только на объект. Развивай зрительно-моторную связь.", "d_en": "Just look at the object. Develop your visual-motor connection.", "tags": ["contour", "focus"], "m": "traditional"},
      {"t_ru": "Построй {0} из примитивов", "t_en": "Build {0} from primitives", "d_ru": "Разложи на сферы/кубы/цилиндры. Пойми объём до штриховки.", "d_en": "Break down into spheres/cubes/cylinders. Understand volume before shading.", "tags": ["construction", "3d-thinking"], "m": "both"},
      {"t_ru": "Тональная шкала {0} ступеней", "t_en": "Tonal scale of {0} steps", "d_ru": "Контролируй нажим. Плавный переход от белого к чёрному.", "d_en": "Control pressure. Smooth transition from white to black.", "tags": ["value", "control"], "m": "traditional"},
      {"t_ru": "Цифровой блок-аут: {0} (flat colors)", "t_en": "Digital block-out: {0} (flat colors)", "d_ru": "Залей формы базовыми цветами. Без теней и текстур.", "d_en": "Fill shapes with basic colors. No shadows or textures.", "tags": ["digital", "blocking"], "m": "digital"},
      {"t_ru": "Копия простого референса: {0}", "t_en": "Copy of a simple reference: {0}", "d_ru": "Наблюдательный рисунок с акцентом на пропорции.", "d_en": "Observational drawing with focus on proportions.", "tags": ["observation", "accuracy"], "m": "both"}
    ],
    "intermediate": [
      {"t_ru": "Конструктивный {0} в 3/4", "t_en": "Constructive {0} in 3/4 view", "d_ru": "Вращай форму в пространстве. Проверь эллипсы и перспективу.", "d_en": "Rotate form in space. Check ellipses and perspective.", "tags": ["construction", "rotation"], "m": "both"},
      {"t_ru": "Светотеневое моделирование {0}", "t_en": "Value scale of {0}", "d_ru": "Ядро тени, полутень, блик, рефлекс. 1 источник света.", "d_en": "Core shadow, halftone, highlight, reflection. 1 light source.", "tags": ["shading", "lighting"], "m": "both"},
      {"t_ru": "Драпировка на {0}: 5 типов складок", "t_en": "Drapery on {0}: 5 fold types", "d_ru": "Трубчатые, зигзаг, инертные, диагональные, составные.", "d_en": "Pipe, zigzag, inert, diagonal, composite folds.", "tags": ["drapery", "observation"], "m": "both"},
      {"t_ru": "Двухточечная перспектива: {0}", "t_en": "Two-point perspective: {0}", "d_ru": "Угловой объект. Проверь сходимость и масштаб.", "d_en": "Angular object. Check convergence and scale.", "tags": ["perspective", "spatial"], "m": "both"},
      {"t_ru": "Спид-скетч {0}: {1} мин/шт", "t_en": "Speed sketch {0}: {1} min/sketch", "d_ru": "Выбери главное. Отбрось детали. Тренируй композицию.", "d_en": "Choose the essential. Drop details. Train composition.", "tags": ["speed", "composition"], "m": "both"},
      {"t_ru": "Анализ формы у мастеров: {0}", "t_en": "Master study: {0}", "d_ru": "Разбери как профессионалы упрощают сложные объекты.", "d_en": "Analyze how pros simplify complex objects.", "tags": ["master-study", "analysis"], "m": "both"}
    ],
    "advanced": [
      {"t_ru": "Ценностный этюд {0}: 3 тона", "t_en": "Value study {0}: 3 values", "d_ru": "Передай форму только через тёмный/средний/светлый.", "d_en": "Convey form through dark/mid/light only.", "tags": ["value-study", "simplification"], "m": "both"},
      {"t_ru": "Перспективное сокращение: {0}", "t_en": "Perspective foreshortening: {0}", "d_ru": "Форма идёт прямо на зрителя. Сохрани пропорции.", "d_en": "Form coming straight at viewer. Preserve proportions.", "tags": ["foreshortening", "depth"], "m": "both"},
      {"t_ru": "Текстурное исследование: {0}", "t_en": "Texture study: {0}", "d_ru": "Передай фактурность через штрих, тон и края.", "d_en": "Convey surface quality through stroke, tone, edge.", "tags": ["texture", "rendering"], "m": "both"},
      {"t_ru": "Освещение {0}: 3 сценария", "t_en": "Lighting study: {0} (3 setups)", "d_ru": "Верхний, боковой, контровой. Сравни влияние на форму.", "d_en": "Top, side, rim lighting. Compare form influence.", "tags": ["lighting", "study"], "m": "both"},
      {"t_ru": "Рисунок {0} по памяти", "t_en": "Draw {0} from memory", "d_ru": "Без референса. Проверь визуальную библиотеку.", "d_en": "No reference. Test visual library.", "tags": ["memory", "imagination"], "m": "both", "rep": true},
      {"t_ru": "Комплексная штриховка: {0}", "t_en": "Complex hatching: {0}", "d_ru": "Смешай перекрёстную, точечную и мягкую растушёвку.", "d_en": "Mix cross-hatching, stippling, soft blending.", "tags": ["technique", "hybrid"], "m": "traditional"}
    ],
    "master": [
      {"t_ru": "Копия {0}: анализ техники", "t_en": "Copy {0}: technique analysis", "d_ru": "Разбери язык художника: ритм, края, экономия средств.", "d_en": "Break down artist's language: rhythm, edges, economy.", "tags": ["master-study", "technique"], "m": "both"},
      {"t_ru": "Композиционный поиск: {0} (5 тумбнейлов)", "t_en": "Composition thumbs: {0} (5 thumbs)", "d_ru": "Правило третей, ведущие линии, визуальный вес.", "d_en": "Rule of thirds, leading lines, visual weight.", "tags": ["composition", "thumbnails"], "m": "both"},
      {"t_ru": "Портрет {0}: пропорции + характер", "t_en": "Portrait {0}: proportions + character", "d_ru": "Синтез анатомии и личности. Избегай 'кукольности'.", "d_en": "Synthesize anatomy and personality. Avoid 'dolliness'.", "tags": ["portrait", "expression"], "m": "both"},
      {"t_ru": "Эскиз окружения: {0} с глубиной", "t_en": "Environment sketch {0} with depth", "d_ru": "Атмосферная перспектива, масштаб, перекрытие.", "d_en": "Atmospheric perspective, scale, overlap.", "tags": ["environment", "depth"], "m": "both"},
      {"t_ru": "Глобальное освещение: {0} в интерьере", "t_en": "Global lighting {0} in interior", "d_ru": "Отражённый свет, цветовые рефлексы, мягкие тени.", "d_en": "Bounce light, color reflections, soft shadows.", "tags": ["lighting", "interior"], "m": "digital"},
      {"t_ru": "Стилизация формы: {0}", "t_en": "Stylization: {0}", "d_ru": "Преувеличение/упрощение под конкретный арт-стиль.", "d_en": "Exaggeration/simplification for specific art style.", "tags": ["stylization", "design"], "m": "both"}
    ],
    "expert": [
      {"t_ru": "Финальная работа: {0} для портфолио", "t_en": "Final piece: {0} for portfolio", "d_ru": "Проф-уровень: чистота, цельность, полировка.", "d_en": "Pro-level: cleanliness, wholeness, polish.", "tags": ["portfolio", "final"], "m": "both"},
      {"t_ru": "Стилизация {0}: поиск языка", "t_en": "Stylization: {0} - finding your voice", "d_ru": "Переработай академические основы в авторскую манеру.", "d_en": "Transform academic basics into personal style.", "tags": ["style-dev", "creative"], "m": "both", "rep": true, "rev": 7},
      {"t_ru": "Многофигурная сцена: {0}", "t_en": "Multi-figure scene: {0}", "d_ru": "Пространство, ритм, фокусы, повествование в кадре.", "d_en": "Space, rhythm, focus, storytelling in frame.", "tags": ["scene", "storytelling"], "m": "both"},
      {"t_ru": "Технический разбор: {0} в разрезе", "t_en": "Technical breakdown: {0}", "d_ru": "Анатомическая/конструктивная точность для продакшена.", "d_en": "Anatomical/constructive accuracy for production.", "tags": ["technical", "breakdown"], "m": "both"},
      {"t_ru": "Марафон: {0} (5 итераций)", "t_en": "Marathon: {0} (5 iterations)", "d_ru": "Самоанализ → правка → выход на новый уровень.", "d_en": "Self-review → correction → level up.", "tags": ["challenge", "growth"], "m": "both", "rep": true, "rev": 3},
      {"t_ru": "Индустриальный бриф: {0}", "t_en": "Industry brief: {0}", "d_ru": "Работа по ТЗ: стиль, сроки, читаемость, экспорт.", "d_en": "Work from brief: style, deadlines, legibility, export.", "tags": ["industry", "brief"], "m": "both"}
    ]
  },
  "Anatomy": {
    "novice": [
      {"t_ru": "Жестовые наброски фигуры ({1} сек)", "t_en": "Gesture sketches of figure ({1} sec)", "d_ru": "Поиск линии действия, центра тяжести и общей динамики.", "d_en": "Find line of action, center of gravity, overall dynamism.", "tags": ["gesture", "rhythm"], "m": "both"},
      {"t_ru": "Пропорции тела: метод {0} голов", "t_en": "Body proportions: {0} heads method", "d_ru": "Базовое построение фигуры с использованием канонических пропорций.", "d_en": "Basic figure construction using canonical proportions.", "tags": ["proportions", "canonical"], "m": "both"},
      {"t_ru": "Упрощённый скелет: {0} и таз", "t_en": "Simplified skeleton: {0} and pelvis", "d_ru": "Понимание костных ориентиров и их влияния на форму тела.", "d_en": "Understand bony landmarks and their influence on form.", "tags": ["skeleton", "landmarks"], "m": "both"},
      {"t_ru": "Блочная фигура: {0} как объём", "t_en": "Block figure: {0} as mass", "d_ru": "Замена мышц на коробку, цилиндр и сферу для понимания 3D.", "d_en": "Replace muscles with box, cylinder, sphere for 3D understanding.", "tags": ["construction", "mass"], "m": "both"},
      {"t_ru": "Костные ориентиры: {0}", "t_en": "Bony landmarks: {0}", "d_ru": "Отметка ключевых точек, видимых под кожей в любой позе.", "d_en": "Mark key points visible under skin in any pose.", "tags": ["anatomy", "reference"], "m": "both"},
      {"t_ru": "Основные группы мышц: {0}", "t_en": "Major muscle groups: {0}", "d_ru": "Изучение формы и направления основных мышечных масс.", "d_en": "Study form and direction of major muscle groups.", "tags": ["muscles", "mapping"], "m": "both"}
    ],
    "intermediate": [
      {"t_ru": "Торс: вращение грудной клетки и таза", "t_en": "Torso: twisting ribcage and pelvis", "d_ru": "Анализ скручивания, наклона и связи позвоночника с позой.", "d_en": "Analyze twist, tilt, and spine-pose connection.", "tags": ["torso", "twist"], "m": "both"},
      {"t_ru": "Руки/Ноги: суставы и рычаги", "t_en": "Arms/Legs: joints and levers", "d_ru": "Построение конечностей через цилиндры, эллипсы и точки сгиба.", "d_en": "Build limbs via cylinders, ellipses, flex points.", "tags": ["limbs", "joints"], "m": "both"},
      {"t_ru": "Кисть: ладонь как форма, пальцы как цилиндры", "t_en": "Hand: palm as form, fingers as cylinders", "d_ru": "Упрощение сложной структуры для быстрого и точного рисунка.", "d_en": "Simplify complex structure for quick accurate drawing.", "tags": ["hands", "construction"], "m": "both"},
      {"t_ru": "Голова: метод Люмиса/Райли", "t_en": "Head: Loomis/Reilly method", "d_ru": "Построение черепа в разных ракурсах с разметкой лица.", "d_en": "Construct skull in various angles with facial mapping.", "tags": ["head", "proportions"], "m": "both"},
      {"t_ru": "Динамичная поза: {0} с весом", "t_en": "Dynamic pose: {0} with weight", "d_ru": "Передача опоры, баланса и напряжения через линию действия.", "d_en": "Convey support, balance, tension via action line.", "tags": ["pose", "balance"], "m": "both"},
      {"t_ru": "Карта мышц: {0} в статике", "t_en": "Muscle map: {0} in static pose", "d_ru": "Наложение анатомических форм на упрощённый манекен.", "d_en": "Overlay anatomical forms onto simplified mannequin.", "tags": ["muscle", "layering"], "m": "both"}
    ],
    "advanced": [
      {"t_ru": "Перспективное сокращение: {0}", "t_en": "Perspective foreshortening: {0}", "d_ru": "Работа с формой, направленной прямо на зрителя или от него.", "d_en": "Work with form aimed straight at viewer or away.", "tags": ["foreshortening", "depth"], "m": "both"},
      {"t_ru": "Функция мышц: {0} при действии", "t_en": "Muscle function: {0} in action", "d_ru": "Как мышцы сокращаются/растягиваются в конкретных движениях.", "d_en": "How muscles contract/stretch in specific movements.", "tags": ["kinetics", "function"], "m": "both"},
      {"t_ru": "Анатомия под одеждой: {0}", "t_en": "Anatomy under clothing: {0}", "d_ru": "Чтение форм сквозь ткань разной плотности.", "d_en": "Read forms through fabrics of varying density.", "tags": ["drapery", "underlying"], "m": "both"},
      {"t_ru": "Вариации: {0} (возраст/пол/тип фигуры)", "t_en": "Variations: {0} (age/sex/body type)", "d_ru": "Адаптация пропорций и мышечного рельефа под разные типы.", "d_en": "Adapt proportions and muscle definition for types.", "tags": ["variation", "body-types"], "m": "both"},
      {"t_ru": "Мимика: {0} через мышцы лица", "t_en": "Facial expression: {0} via facial muscles", "d_ru": "Связь сухожилий, кожи и костей в выражении эмоций.", "d_en": "Connection of tendons, skin, bones in emotion.", "tags": ["expression", "face"], "m": "both"},
      {"t_ru": "Быстрая анатомия: {0} за 5 мин", "t_en": "Quick anatomy: {0} in 5 min", "d_ru": "Синтез жеста, конструкции и основных мышц в сжатые сроки.", "d_en": "Synthesize gesture, construction, major muscles fast.", "tags": ["speed", "integration"], "m": "both"}
    ],
    "master": [
      {"t_ru": "Анатомический разбор: {0} в разрезе", "t_en": "Anatomical breakdown: {0} in-depth", "d_ru": "Точное отображение слоёв: кость → мышца → жир → кожа.", "d_en": "Accurate layer display: bone → muscle → fat → skin.", "tags": ["medical", "layers"], "m": "both"},
      {"t_ru": "Стилизация: {0} (аниме/картун/реализм)", "t_en": "Stylization: {0} (anime/cartoon/realism)", "d_ru": "Упрощение или преувеличение анатомии под конкретный стиль.", "d_en": "Simplify or exaggerate anatomy for specific style.", "tags": ["stylization", "design"], "m": "both"},
      {"t_ru": "Распределение веса: {0} на опорах", "t_en": "Weight distribution: {0} on supports", "d_ru": "Как тело компенсирует нагрузку, наклон и инерцию.", "d_en": "How body compensates for load, tilt, inertia.", "tags": ["weight", "balance"], "m": "both"},
      {"t_ru": "Сложная поза: {0} с перекрытием", "t_en": "Complex pose: {0} with overlap", "d_ru": "Работа с перекрытием конечностей, скручиванием и балансом.", "d_en": "Handle limb overlap, twist, balance.", "tags": ["complex-pose", "overlap"], "m": "both"},
      {"t_ru": "Тур вращения: {0} (вид спереди/сбоку)", "t_en": "Turnaround: {0} (front/side)", "d_ru": "Единообразие пропорций и анатомии во всех ракурсах.", "d_en": "Consistent proportions and anatomy in all views.", "tags": ["turnaround", "consistency"], "m": "both"},
      {"t_ru": "Анализ анатомии у мастеров: {0}", "t_en": "Master anatomy analysis: {0}", "d_ru": "Разбор как классические художники решали анатомические задачи.", "d_en": "Analyze how classic artists solved anatomy problems.", "tags": ["master-study", "analysis"], "m": "both"}
    ],
    "expert": [
      {"t_ru": "Фигурная работа для портфолио: {0}", "t_en": "Figure portfolio piece: {0}", "d_ru": "Профессиональный уровень: точность, экспрессия, чистота.", "d_en": "Pro level: accuracy, expression, cleanliness.", "tags": ["portfolio", "final"], "m": "both"},
      {"t_ru": "Анатомия для анимации: {0}", "t_en": "Animation anatomy: {0}", "d_ru": "Упрощение форм для быстрого построения и чтения в движении.", "d_en": "Simplify forms for quick construction and reading in motion.", "tags": ["animation-ready", "simplification"], "m": "both", "rep": true},
      {"t_ru": "Анатомия существа: {0} на основе реальных", "t_en": "Creature anatomy: {0} based on real", "d_ru": "Конструирование биомеханики вымышленного персонажа.", "d_en": "Construct biometrics of imaginary character.", "tags": ["creature", "design"], "m": "both"},
      {"t_ru": "Телесное актёрство: {0} через позу", "t_en": "Body acting: {0} through pose", "d_ru": "Передача намерения, эмоции и характера только через анатомию.", "d_en": "Convey intent, emotion, character via anatomy only.", "tags": ["acting", "character"], "m": "both"},
      {"t_ru": "Технический чертёж: {0} с размерами", "t_en": "Technical drawing: {0} with measurements", "d_ru": "Подготовка листа для моделирования/риггинга.", "d_en": "Prepare sheet for modeling/rigging.", "tags": ["technical", "production"], "m": "both"},
      {"t_ru": "Индустриальное задание: {0} по ТЗ", "t_en": "Industry task: {0} from brief", "d_ru": "Соответствие требованиям студии: читаемость, стиль, сроки.", "d_en": "Meet studio requirements: legibility, style, deadlines.", "tags": ["industry", "brief"], "m": "both"}
    ]
  },
  "Animation": {
    "novice": [
      {"t_ru": "Тайминг-чарт: отскок мяча ({1} кадров)", "t_en": "Timing chart: ball bounce ({1} frames)", "d_ru": "Базовое упражнение на ускорение/замедление и дуги движения.", "d_en": "Basic exercise for acceleration/deceleration and arcs.", "tags": ["timing", "arcs"], "m": "both"},
      {"t_ru": "Сжатие и растяжение: {0}", "t_en": "Squash and stretch: {0}", "d_ru": "Сохранение объёма при деформации формы в движении.", "d_en": "Preserve volume during form deformation in motion.", "tags": ["squash-stretch", "volume"], "m": "both"},
      {"t_ru": "Дуги движения: {0} через ключевые кадры", "t_en": "Arcs of motion: {0} via keyframes", "d_ru": "Плавность траекторий и избегание механических прямых линий.", "d_en": "Smooth trajectories, avoid mechanical straight lines.", "tags": ["arcs", "flow"], "m": "both"},
      {"t_ru": "Замедление в начале/конце: {0}", "t_en": "Slow in/out: {0}", "d_ru": "Имитация инерции через распределение кадров (spacing).", "d_en": "Imitate inertia via frame distribution (spacing).", "tags": ["slow-in-out", "inertia"], "m": "both"},
      {"t_ru": "Флипбук: простой цикл ({1} кадров)", "t_en": "Flipbook: simple cycle ({1} frames)", "d_ru": "Понимание последовательности, ритма и замкнутости движения.", "d_en": "Understand sequence, rhythm, motion closure.", "tags": ["cycle", "flipbook"], "m": "traditional"},
      {"t_ru": "От позы к позе: {0}", "t_en": "From pose to pose: {0}", "d_ru": "Создание ключевых кадров перед прорисовкой промежуточных.", "d_en": "Create keyframes before inbetweening.", "tags": ["pose-to-pose", "planning"], "m": "both"}
    ],
    "intermediate": [
      {"t_ru": "Цикл шага: {0} (4 ключевые фазы)", "t_en": "Walk cycle: {0} (4 key phases)", "d_ru": "Контакт, отталкивание, проход, опускание. Перенос веса.", "d_en": "Contact, push-off, passing, down. Weight transfer.", "tags": ["walk-cycle", "weight"], "m": "both"},
      {"t_ru": "Цикл бега: {0} с фазой полёта", "t_en": "Run cycle: {0} with flight phase", "d_ru": "Динамика, наклон корпуса, работа рук и ног в противофазе.", "d_en": "Dynamics, torso tilt, arms/legs in counterphase.", "tags": ["run-cycle", "dynamics"], "m": "both"},
      {"t_ru": "Вторичная анимация: {0} (волосы/одежда/хвост)", "t_en": "Secondary animation: {0} (hair/clothes/tail)", "d_ru": "Follow-through и overlapping action для реализма.", "d_en": "Follow-through and overlapping action for realism.", "tags": ["secondary", "overlap"], "m": "both"},
      {"t_ru": "Передача веса: {0} (тяжёлый/лёгкий объект)", "t_en": "Weight transfer: {0} (heavy/light object)", "d_ru": "Как масса влияет на тайминг, деформацию и реакцию тела.", "d_en": "How mass affects timing, deformation, body reaction.", "tags": ["weight", "mass"], "m": "both"},
      {"t_ru": "Предвосхищение: {0} перед действием", "t_en": "Anticipation: {0} before action", "d_ru": "Подготовка зрителя к движению через обратное движение.", "d_en": "Prepare viewer for motion via reverse movement.", "tags": ["anticipation", "readiness"], "m": "both"},
      {"t_ru": "Синхронизация губ: {0} (гласные/согласные)", "t_en": "Lip-sync: {0} (vowels/consonants)", "d_ru": "Базовая разбивка речи на формы рта и тайминг.", "d_en": "Basic speech breakdown into mouth shapes and timing.", "tags": ["lip-sync", "mouth-shapes"], "m": "both"}
    ],
    "advanced": [
      {"t_ru": "Прыжок: {0} с приземлением и отскоком", "t_en": "Jump: {0} with landing and bounce", "d_ru": "Сжатие перед стартом, фаза полёта, амортизация.", "d_en": "Pre-compression, flight phase, amortization.", "tags": ["jump", "physics"], "m": "both"},
      {"t_ru": "Взаимодействие с объектом: {0}", "t_en": "Object interaction: {0}", "d_ru": "Как тело и объект влияют на движение друг друга.", "d_en": "How body and object influence each other's motion.", "tags": ["interaction", "force"], "m": "both"},
      {"t_ru": "Пантомима: {0} без слов (10-15 сек)", "t_en": "Pantomime: {0} no words (10-15 sec)", "d_ru": "Передача намерения и эмоции через чистое движение.", "d_en": "Convey intent and emotion via pure motion.", "tags": ["pantomime", "acting"], "m": "both"},
      {"t_ru": "Анимация камеры: {0} (пан/зум/тигр)", "t_en": "Camera animation: {0} (pan/zoom/tiger)", "d_ru": "Синхронизация движения камеры с действием в кадре.", "d_en": "Sync camera movement with on-screen action.", "tags": ["camera", "composition"], "m": "both"},
      {"t_ru": "Сложный цикл: {0} (животное/механизм)", "t_en": "Complex cycle: {0} (animal/mechanism)", "d_ru": "Нестандартная биомеханика или техническая последовательность.", "d_en": "Non-standard biomechanics or technical sequence.", "tags": ["complex-cycle", "mechanics"], "m": "both"},
      {"t_ru": "Актёрская поза: {0} с характером", "t_en": "Acting pose: {0} with character", "d_ru": "Выбор сильной, читаемой позы, раскрывающей намерение.", "d_en": "Choose strong, readable pose revealing intent.", "tags": ["acting", "pose"], "m": "both"}
    ],
    "master": [
      {"t_ru": "Диалоговая сцена: {0} с интонацией", "t_en": "Dialogue scene: {0} with inflection", "d_ru": "Синхронизация анимации с речью, эмоцией и подтекстом.", "d_en": "Sync animation with speech, emotion, subtext.", "tags": ["dialogue", "subtext"], "m": "both"},
      {"t_ru": "Взаимодействие 2+ персонажей: {0}", "t_en": "Multi-character interaction: {0}", "d_ru": "Распределение фокуса, тайминг реакций и визуальный вес.", "d_en": "Distribute focus, reaction timing, visual weight.", "tags": ["multi-char", "focus"], "m": "both"},
      {"t_ru": "Стилизация движения: {0}", "t_en": "Motion stylization: {0}", "d_ru": "Преувеличение, ломка физики под стиль (аниме/картун).", "d_en": "Exaggeration, physics breakdown for style (anime/cartoon).", "tags": ["stylization", "exaggeration"], "m": "both"},
      {"t_ru": "Аниматик сцены: {0} (ритм и монтаж)", "t_en": "Scene animatics: {0} (rhythm and edit)", "d_ru": "Тестирование тайминга, переходов и эмоциональной дуги.", "d_en": "Test timing, transitions, emotional arc.", "tags": ["animatic", "pacing"], "m": "both"},
      {"t_ru": "Полировка сцены: {0} (spacing/curves)", "t_en": "Scene polish: {0} (spacing/curves)", "d_ru": "Финальная доводка: чистота линий, точность дуг, мягкие ключи.", "d_en": "Final cleanup: line clarity, arc accuracy, soft keys.", "tags": ["polish", "curves"], "m": "digital"},
      {"t_ru": "Сцена для шоурила: {0} (проф уровень)", "t_en": "Showreel scene: {0} (pro level)", "d_ru": "Соответствие индустриальным стандартам: вес, характер, полировка.", "d_en": "Meet industry standards: weight, character, polish.", "tags": ["reel", "industry"], "m": "both"}
    ],
    "expert": [
      {"t_ru": "Игровой цикл: {0} (оптимизация, blend)", "t_en": "Game cycle: {0} (optimization, blend)", "d_ru": "Адаптация под реаль-тайм: петли, переходы, вес.", "d_en": "Adapt for real-time: loops, transitions, weight.", "tags": ["game-ready", "optimization"], "m": "digital", "rep": true},
      {"t_ru": "Прописка мокапа: {0} (сохранение характера)", "t_en": "Cleanup mocap: {0} (preserve character)", "d_ru": "Усиление читаемости, удаление шума, добавление стиля.", "d_en": "Enhance legibility, remove noise, add style.", "tags": ["mocap", "cleanup"], "m": "digital"},
      {"t_ru": "Анимация FX: {0} (огонь/вода/магия)", "t_en": "FX animation: {0} (fire/water/magic)", "d_ru": "Тайминг энергии, сохранение объёма, слоистая анимация.", "d_en": "Timing energy, preserve volume, layered animation.", "tags": ["fx-animation", "energy"], "m": "both"},
      {"t_ru": "Режиссёрский кадр: {0} с визуальной историей", "t_en": "Director's frame: {0} with visual story", "d_ru": "Композиция, камера, свет и движение как единое повествование.", "d_en": "Composition, camera, light, motion as unified story.", "tags": ["direction", "story"], "m": "both"},
      {"t_ru": "Анимация за 24 часа: {0}", "t_en": "24-hour animation: {0}", "d_ru": "Интеграция всех навыков в сжатые сроки с фокусом на читаемость.", "d_en": "Integrate all skills under time pressure, focus on readability.", "tags": ["speed", "challenge"], "m": "both", "rev": 3},
      {"t_ru": "Финальная сцена: {0} (полный цикл)", "t_en": "Final scene: {0} (full cycle)", "d_ru": "От референса до финала: тест, полировка, звук, экспорт.", "d_en": "From ref to final: test, polish, sound, export.", "tags": ["production", "pipeline"], "m": "both"}
    ]
  },
  "Effects": {
    "novice": [
      {"t_ru": "Базовая форма эффекта: {0}", "t_en": "Basic effect shape: {0}", "d_ru": "Изучение силуэта, направления энергии и основных масс.", "d_en": "Study silhouette, energy direction, major masses.", "tags": ["shape", "energy"], "m": "both"},
      {"t_ru": "Тайминг простого эффекта: {0} (разгон/спад)", "t_en": "Timing simple effect: {0} (buildup/decay)", "d_ru": "Понимание как эффект набирает силу и затухает.", "d_en": "Understand how effect builds and decays.", "tags": ["timing", "life-cycle"], "m": "both"},
      {"t_ru": "2-слойный эффект: {0} (основа + детали)", "t_en": "2-layer effect: {0} (base + details)", "d_ru": "Разделение на основной объём и мелкие элементы.", "d_en": "Separate base volume and small elements.", "tags": ["layers", "separation"], "m": "both"},
      {"t_ru": "Копия референса: {0} (форма + направление)", "t_en": "Copy reference: {0} (shape + direction)", "d_ru": "Точное воспроизведение наблюдаемого эффекта без упрощений.", "d_en": "Accurate reproduction of observed effect without simplification.", "tags": ["reference", "accuracy"], "m": "both"},
      {"t_ru": "Поток энергии: {0} (от источника к рассеиванию)", "t_en": "Energy flow: {0} (source to dissipation)", "d_ru": "Визуализация движения силы через пространство.", "d_en": "Visualize force movement through space.", "tags": ["flow", "direction"], "m": "both"},
      {"t_ru": "Простая композиция: {0} на фоне", "t_en": "Simple composition: {0} on background", "d_ru": "Размещение эффекта в пространстве с учётом освещения.", "tags": ["composition", "placement"], "m": "both"}
    ],
    "intermediate": [
      {"t_ru": "Сохранение объёма: {0} при деформации", "t_en": "Volume retention: {0} during deformation", "d_ru": "Эффект не должен 'схлопываться' или терять массу.", "d_en": "Effect must not 'squash' or lose mass.", "tags": ["volume", "mass-retention"], "m": "both"},
      {"t_ru": "Турбулентность: {0} (завихрения/разломы)", "t_en": "Turbulence: {0} (vortices/fractures)", "d_ru": "Добавление хаотичности, контролируемой основным направлением.", "d_en": "Add chaos, controlled by primary direction.", "tags": ["turbulence", "chaos-control"], "m": "both"},
      {"t_ru": "Взаимодействие с поверхностью: {0}", "t_en": "Surface interaction: {0}", "d_ru": "Как эффект растекается, отскакивает или разрушает объект.", "d_en": "How effect spreads, bounces, or destroys object.", "tags": ["collision", "interaction"], "m": "both"},
      {"t_ru": "Цветовой градиент: {0} (ядро → края)", "t_en": "Color gradient: {0} (core → edges)", "d_ru": "Переход температуры/цвета от источника к периферии.", "d_en": "Temperature/color transition from source to periphery.", "tags": ["color", "temperature"], "m": "digital"},
      {"t_ru": "Вторичный эффект: {0} (искры/дым/пыль)", "t_en": "Secondary effect: {0} (sparks/smoke/dust)", "d_ru": "Добавление сопутствующих элементов для усиления читаемости.", "tags": ["secondary", "detail"], "m": "both"},
      {"t_ru": "Тайминг-чарт эффекта: {0} (кадр за кадром)", "t_en": "Effect timing chart: {0} (frame by frame)", "d_ru": "Выбери главное. Отбрось детали. Тренируй композицию.", "d_en": "Choose the essential. Drop details. Train composition.", "tags": ["timing-chart", "planning"], "m": "both"}
    ],
    "advanced": [
      {"t_ru": "Многослойный эффект: {0} (3-5 слоёв)", "t_en": "Multi-layer effect: {0} (3-5 layers)", "d_ru": "Разделение на: ядро, свечение, частицы, дым/пыль.", "d_en": "Separation into: core, glow, particles, smoke/dust.", "tags": ["multi-layer", "breakdown"], "m": "digital"},
      {"t_ru": "На основе физики: {0} (жидкость/газ/твёрдое)", "t_en": "Physics-based: {0} (liquid/gas/solid)", "d_ru": "Имитация реального поведения в упрощённой форме.", "d_en": "Imitate real behavior in simplified form.", "tags": ["physics", "simulation"], "m": "both"},
      {"t_ru": "Стилизация эффекта: {0} (аниме/комикс)", "t_en": "Effect stylization: {0} (anime/comic)", "d_ru": "Преобразование физического явления под визуальный стиль.", "d_en": "Transform physical phenomenon into visual style.", "tags": ["stylization", "design"], "m": "both"},
      {"t_ru": "Атмосферный эффект: {0} (туман/дождь)", "t_en": "Atmospheric effect: {0} (fog/rain)", "d_ru": "Создание глубины и настроения через плотность и освещение.", "d_en": "Create depth and mood via density and lighting.", "tags": ["atmosphere", "mood"], "m": "both"},
      {"t_ru": "Кадр удара: {0} (вспышка/деформация)", "t_en": "Impact frame: {0} (flash/deformation)", "d_ru": "Кульминация эффекта: максимальная энергия, читаемость.", "d_en": "Effect climax: maximum energy, readability.", "tags": ["impact", "climax"], "m": "both"},
      {"t_ru": "Зацикленный эффект: {0} (бесшовный цикл)", "t_en": "Looping effect: {0} (seamless cycle)", "d_ru": "Создание непрерывного эффекта без видимых стыков кадров.", "d_en": "Create continuous effect without visible frame seams.", "tags": ["loop", "seamless"], "m": "both"}
    ],
    "master": [
      {"t_ru": "Кинематографичный эффект: {0} (масштаб + драма)", "t_en": "Cinematic effect: {0} (scale + drama)", "d_ru": "Работа с масштабом, контрастом, светом и эмоциональным весом.", "d_en": "Work with scale, contrast, light, emotional weight.", "tags": ["cinematic", "scale"], "m": "both"},
      {"t_ru": "Композитинг эффекта: {0} (слои + свечение)", "t_en": "Effect compositing: {0} (layers + glow)", "d_ru": "Сборка финального кадра: взаимодействие с окружением.", "d_en": "Final frame assembly: interaction with environment.", "tags": ["compositing", "final"], "m": "digital"},
      {"t_ru": "Процедурное изучение: {0} (алгоритм + вариации)", "t_en": "Procedural study: {0} (algorithm + variations)", "d_ru": "Понимание правил генерации эффекта для создания вариаций.", "d_en": "Understand rules of effect generation for creating variations.", "tags": ["procedural", "rules"], "m": "both"},
      {"t_ru": "Эффект как повествование: {0}", "t_en": "Effect as storytelling: {0}", "d_ru": "Как форма, цвет и движение эффекта передают характер.", "d_en": "How effect form, color, motion convey character.", "tags": ["storytelling", "symbolism"], "m": "both"},
      {"t_ru": "Оптимизация: {0} (снижение детализации)", "t_en": "Optimization: {0} (detail reduction)", "d_ru": "Баланс между качеством и производительностью для продакшена.", "d_en": "Balance quality and performance for production.", "tags": ["optimization", "readability"], "m": "both"},
      {"t_ru": "Копия эффекта от студий: {0} (Ufotable/Pixar)", "t_en": "Studio effect copy: {0} (Ufotable/Pixar)", "d_ru": "Разбор техник, слоёв, тайминга и стилистики профессионалов.", "d_en": "Analyze pros' techniques, layers, timing, style.", "tags": ["master-study", "industry"], "m": "both"}
    ],
    "expert": [
      {"t_ru": "Финальный FX-шот: {0} (полный цикл)", "t_en": "Final FX shot: {0} (full cycle)", "d_ru": "От референса до композита: тайминг, слои, свет, полировка.", "d_en": "From ref to composite: timing, layers, light, polish.", "tags": ["portfolio", "pipeline"], "m": "both"},
      {"t_ru": "Реал-тайм эффект: {0} (частицы, щейдеры)", "t_en": "Realtime effect: {0} (particles, shaders)", "d_ru": "Адаптация под игровые движки: LOD, спрайты, производительность.", "d_en": "Adapt for game engines: LOD, sprites, performance.", "tags": ["realtime", "game-dev"], "m": "digital", "rep": true},
      {"t_ru": "Режиссура FX: {0} (контроль фокуса и ритма)", "t_en": "FX direction: {0} (focus and rhythm control)", "d_ru": "Управление вниманием зрителя через масштаб, цвет и движение.", "d_en": "Control viewer attention via scale, color, motion.", "tags": ["direction", "focus"], "m": "both"},
      {"t_ru": "Сцена с несколькими эффектами: {0}", "t_en": "Multi-FX scene: {0}", "d_ru": "Взаимодействие разных эффектов без визуального шума.", "d_en": "Multiple effects interacting without visual noise.", "tags": ["multi-fx", "composition"], "m": "both"},
      {"t_ru": "Быстрый FX: {0} (2-4 часа, читаемость)", "t_en": "Speed FX: {0} (2-4 hours, readability)", "d_ru": "Индустриальный спид: выбор главного, упрощение второстепенного.", "d_en": "Industry speed: choose main, simplify secondary.", "tags": ["speed", "industry"], "m": "both"},
      {"t_ru": "Задание по брифу: {0} (технические рамки)", "t_en": "Brief-based task: {0} (technical constraints)", "d_ru": "Профессиональная работа: соответствие ТЗ, полировка, экспорт.", "d_en": "Pro work: meet brief, polish, export.", "tags": ["industry", "production"], "m": "both"}
    ]
  },
  "Storytelling": {
    "novice": [
      {"t_ru": "Кадрирование: {0} (правило третей)", "t_en": "Framing: {0} (rule of thirds)", "d_ru": "Размещение объекта в сильных точках пересечения линий.", "d_en": "Place subject at strong line intersection points.", "tags": ["framing", "rule-of-thirds"], "m": "both"},
      {"t_ru": "Силуэт: {0} (читаемость формы)", "t_en": "Silhouette: {0} (shape readability)", "d_ru": "Проверка: узнаётся ли объект/поза в чёрном контуре?", "d_en": "Test: can you recognize subject/pose in black silhouette?", "tags": ["silhouette", "readability"], "m": "both"},
      {"t_ru": "Группировка тонов: {0} (свет/среднее/тень)", "t_en": "Value grouping: {0} (light/mid/dark)", "d_ru": "Упрощение сцены до 3-4 тональных масс для ясности.", "d_en": "Simplify scene to 3-4 value masses for clarity.", "tags": ["value-grouping", "simplification"], "m": "both"},
      {"t_ru": "Ведущие линии: {0} к фокусу", "t_en": "Leading lines: {0} to focus", "d_ru": "Направление взгляда зрителя через архитектуру, свет или позы.", "d_en": "Direct viewer's eye via architecture, light, or poses.", "tags": ["leading-lines", "focus"], "m": "both"},
      {"t_ru": "Тип кадра: {0} (общий/средний/крупный)", "t_en": "Shot type: {0} (wide/medium/close)", "d_ru": "Выбор дистанции камеры для передачи масштаба или эмоции.", "d_en": "Choose camera distance to convey scale or emotion.", "tags": ["shot-type", "distance"], "m": "both"},
      {"t_ru": "Простая раскладка: {0} (2-3 панели)", "t_en": "Simple layout: {0} (2-3 panels)", "d_ru": "Базовая последовательность: установка, действие, реакция.", "d_en": "Basic sequence: setup, action, reaction.", "tags": ["layout", "sequence"], "m": "both"}
    ],
    "intermediate": [
      {"t_ru": "Ракурс камеры: {0} (верхний/нижний/уровень)", "t_en": "Camera angle: {0} (high/low/eye level)", "d_ru": "Как наклон камеры влияет на восприятие силы/слабости.", "d_en": "How camera tilt affects power/weakness perception.", "tags": ["angle", "perspective"], "m": "both"},
      {"t_ru": "Слои глубины: {0} (передний/средний/задний)", "t_en": "Depth layers: {0} (foreground/midground/background)", "d_ru": "Создание пространства через перекрытие, тон и детализацию.", "d_en": "Create space via overlap, value, detail.", "tags": ["depth", "layering"], "m": "both"},
      {"t_ru": "Цветовое настроение: {0} (тепло/холод)", "t_en": "Color mood: {0} (warm/cool)", "d_ru": "Использование палитры для передачи эмоции или времени суток.", "d_en": "Use palette to convey emotion or time of day.", "tags": ["color", "mood"], "m": "digital"},
      {"t_ru": "Визуальный ритм: {0} (чередование планов)", "t_en": "Visual rhythm: {0} (shot alternation)", "d_ru": "Управление вниманием через размер кадра и плотность деталей.", "d_en": "Control attention via frame size and detail density.", "tags": ["pacing", "rhythm"], "m": "both"},
      {"t_ru": "Преемственность: {0} (180° правило)", "t_en": "Continuity: {0} (180° rule)", "d_ru": "Сохранение пространственной логики между кадрами.", "d_en": "Maintain spatial logic between shots.", "tags": ["continuity", "180-rule"], "m": "both"},
      {"t_ru": "Тумбнейлы: {0} (5 вариантов композиции)", "t_en": "Thumbnails: {0} (5 composition variants)", "d_ru": "Быстрый поиск сильной композиции перед финальной прорисовкой.", "d_en": "Quick search for strong composition before final render.", "tags": ["thumbnails", "exploration"], "m": "both"}
    ],
    "advanced": [
      {"t_ru": "Перспективное сокращение: {0}", "t_en": "Perspective foreshortening: {0}", "d_ru": "Работа с формой, направленной прямо на зрителя или от него.", "d_en": "Work with form aimed straight at viewer or away.", "tags": ["foreshortening", "depth"], "m": "both"},
      {"t_ru": "Функция мышц: {0} при действии", "t_en": "Muscle function: {0} in action", "d_ru": "Как мышцы сокращаются/растягиваются в конкретных движениях.", "d_en": "How muscles contract/stretch in specific movements.", "tags": ["kinetics", "function"], "m": "both"},
      {"t_ru": "Анатомия под одеждой: {0}", "t_en": "Anatomy under clothing: {0}", "d_ru": "Чтение форм сквозь ткань разной плотности.", "d_en": "Read forms through fabrics of varying density.", "tags": ["drapery", "underlying"], "m": "both"},
      {"t_ru": "Вариации: {0} (возраст/пол/тип фигуры)", "t_en": "Variations: {0} (age/sex/body type)", "d_ru": "Адаптация пропорций и мышечного рельефа под разные типы.", "d_en": "Adapt proportions and muscle definition for types.", "tags": ["variation", "body-types"], "m": "both"},
      {"t_ru": "Мимика: {0} через мышцы лица", "t_en": "Facial expression: {0} via facial muscles", "d_ru": "Связь сухожилий, кожи и костей в выражении эмоций.", "d_en": "Connection of tendons, skin, bones in emotion.", "tags": ["expression", "face"], "m": "both"},
      {"t_ru": "Быстрая анатомия: {0} за 5 мин", "t_en": "Quick anatomy: {0} in 5 min", "d_ru": "Синтез жеста, конструкции и основных мышц в сжатые сроки.", "d_en": "Synthesize gesture, construction, major muscles fast.", "tags": ["speed", "integration"], "m": "both"}
    ],
    "master": [
      {"t_ru": "Анатомический разбор: {0} в разрезе", "t_en": "Anatomical breakdown: {0} in-depth", "d_ru": "Точное отображение слоёв: кость → мышца → жир → кожа.", "d_en": "Accurate layer display: bone → muscle → fat → skin.", "tags": ["medical", "layers"], "m": "both"},
      {"t_ru": "Стилизация: {0} (аниме/картун/реализм)", "t_en": "Stylization: {0} (anime/cartoon/realism)", "d_ru": "Упрощение или преувеличение анатомии под конкретный стиль.", "d_en": "Simplify or exaggerate anatomy for specific style.", "tags": ["stylization", "design"], "m": "both"},
      {"t_ru": "Распределение веса: {0} на опорах", "t_en": "Weight distribution: {0} on supports", "d_ru": "Как тело компенсирует нагрузку, наклон и инерцию.", "d_en": "How body compensates for load, tilt, inertia.", "tags": ["weight", "balance"], "m": "both"},
      {"t_ru": "Сложная поза: {0} с перекрытием", "t_en": "Complex pose: {0} with overlap", "d_ru": "Работа с перекрытием конечностей, скручиванием и балансом.", "d_en": "Handle limb overlap, twist, balance.", "tags": ["complex-pose", "overlap"], "m": "both"},
      {"t_ru": "Тур вращения: {0} (вид спереди/сбоку)", "t_en": "Turnaround: {0} (front/side)", "d_ru": "Единообразие пропорций и анатомии во всех ракурсах.", "d_en": "Consistent proportions and anatomy in all views.", "tags": ["turnaround", "consistency"], "m": "both"},
      {"t_ru": "Анализ анатомии у мастеров: {0}", "t_en": "Master anatomy analysis: {0}", "d_ru": "Разбор как классические художники решали анатомические задачи.", "d_en": "Analyze how classic artists solved anatomy problems.", "tags": ["master-study", "analysis"], "m": "both"}
    ],
    "expert": [
      {"t_ru": "Фигурная работа для портфолио: {0}", "t_en": "Figure portfolio piece: {0}", "d_ru": "Профессиональный уровень: точность, экспрессия, чистота.", "d_en": "Pro level: accuracy, expression, cleanliness.", "tags": ["portfolio", "final"], "m": "both"},
      {"t_ru": "Анатомия для анимации: {0}", "t_en": "Animation anatomy: {0}", "d_ru": "Упрощение форм для быстрого построения и чтения в движении.", "d_en": "Simplify forms for quick construction and reading in motion.", "tags": ["animation-ready", "simplification"], "m": "both", "rep": true},
      {"t_ru": "Анатомия существа: {0} на основе реальных", "t_en": "Creature anatomy: {0} based on real", "d_ru": "Конструирование биомеханики вымышленного персонажа.", "d_en": "Construct biometrics of imaginary character.", "tags": ["creature", "design"], "m": "both"},
      {"t_ru": "Телесное актёрство: {0} через позу", "t_en": "Body acting: {0} through pose", "d_ru": "Передача намерения, эмоции и характера только через анатомию.", "d_en": "Convey intent, emotion, character via anatomy only.", "tags": ["acting", "character"], "m": "both"},
      {"t_ru": "Технический чертёж: {0} с размерами", "t_en": "Technical drawing: {0} with measurements", "d_ru": "Подготовка листа для моделирования/риггинга.", "d_en": "Prepare sheet for modeling/rigging.", "tags": ["technical", "production"], "m": "both"},
      {"t_ru": "Индустриальное задание: {0} по ТЗ", "t_en": "Industry task: {0} from brief", "d_ru": "Соответствие требованиям студии: читаемость, стиль, сроки.", "d_en": "Meet studio requirements: legibility, style, deadlines.", "tags": ["industry", "brief"], "m": "both"}
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
        const subject = SUBJECTS[cat][Math.floor(random() * SUBJECTS[cat].length)];
        const medium = tmpl.m || "both";
        const constraint = CONSTRAINTS[medium][Math.floor(random() * CONSTRAINTS[medium].length)];
        
        const hasSec = tmpl.t_ru.includes("{1}");
        const sec = hasSec ? Math.floor(random() * 15) + 15 : "";
        
        // Generate BOTH Russian and English versions
        const title_ru = tmpl.t_ru.replace("{0}", subject).replace("{1}", sec);
        const title_en = tmpl.t_en.replace("{0}", subject).replace("{1}", sec);
        const desc_ru = `${tmpl.d_ru} Ограничение: ${constraint}. Референс: ${SOURCES[cat][Math.floor(random() * SOURCES[cat].length)]}.`;
        const desc_en = `${tmpl.d_en} Constraint: ${constraint}. Source: ${SOURCES[cat][Math.floor(random() * SOURCES[cat].length)]}.`;
        
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

        const key = `${q.title.ru.toLowerCase().trim()}|${q.description.ru.toLowerCase().trim()}`;

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

  return quests;
}

const quests = generateQuests(1000, 42);

console.log(`\n✅ Сгенерировано: ${quests.length} | Пропущено дублей: ${skipped}`);

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
console.log('📋 manifest.json создан');
console.log('✨ Готово!');
