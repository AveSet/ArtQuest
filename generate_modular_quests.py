import json
import random
from typing import List, Dict, Any

# 🔹 КАТЕГОРИИ
SUBJECTS = {
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
}

# 🔹 ТЕХНИКИ
TECHNIQUES = {
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
}

# 🔹 КОНТЕКСТЫ
CONTEXTS = {
    "lighting": ["верхний свет", "боковой контровой", "рассеянный дневной", "ночной неон", "свечение экрана", "закатное тепло", "холодный офисный", "драматичный chiaroscuro"],
    "environment": ["пустая комната", "улица города", "лесная тропа", "космическая станция", "подводный мир", "пустыня", " заснеженные горы", "фэнтези-таверна"],
    "mood": ["спокойствие", "напряжение", "радость", "меланхолия", "тревога", "торжественность", "игривость", "эпичность"],
    "time": ["утро", "полдень", "сумерки", "глубокая ночь", "рассвет", "закат", "полнолуние", "пасмурный день"]
}

# 🔹 ФОКУС ВНИМАНИЯ
FOCUS_AREAS = [
    "читаемость силуэта", "точность пропорций", "плавность переходов", 
    "баланс композиции", "передача веса/объёма", "чистота лайнарта", 
    "логика освещения", "эмоциональная подача", "техническая оптимизация", 
    "соответствие стилю", "динамика движения", "глубина пространства"
]

# 🔹 ИСТОЧНИКИ
SOURCES = {
    "Drawing": ["Drawabox Lesson 1-3", "Scott Robertson HTDRAW", "Proko Figure Basics", "Michael Hampton Figure Drawing", "Peter Boer drawing exercises"],
    "Anatomy": ["Proko Anatomy", "Michael Hampton Figure Drawing", "Bridgman Constructive Anatomy", "Atlas of Human Anatomy", "3D.sk anatomy references"],
    "Animation": ["The Animator's Survival Kit", "Richard Williams Animation Course", "12 Principles of Animation", "Blender Animation Nodes", "Unity Animation Systems"],
    "Effects": ["The VFX Handbook", "Nuke Compositing Guide", "Blender Particle Systems", "After Effects Trapcode", "Unity VFX Graph"],
    "Storytelling": ["Storytelling for Animation", "Framed Ink", "Cinematography for 3D Artists", "Visual Story by Bruck", "Directing by Sergio"
    ]
}

# 🔹 МЕТА ДЛЯ КАТЕГОРИЙ
CATEGORY_META = {
    "Drawing": {"code": "DRA", "icon": "🎨", "color": "#6366f1"},
    "Anatomy": {"code": "ANA", "icon": "🦴", "color": "#ec4899"},
    "Animation": {"code": "ANM", "icon": "🎬", "color": "#10b981"},
    "Effects": {"code": "VFX", "icon": "✨", "color": "#f59e0b"},
    "Storytelling": {"code": "STY", "icon": "📖", "color": "#8b5cf6"}
}

# 🔹 УРОВНИ СЛОЖНОСТИ
DIFFICULTY_MAP = {
    1: "beginner",
    2: "beginner",
    3: "beginner",
    4: "beginner",
    5: "beginner",
    6: "intermediate",
    7: "intermediate",
    8: "intermediate",
    9: "intermediate",
    10: "intermediate",
    11: "advanced",
    12: "advanced",
    13: "advanced",
    14: "advanced",
    15: "advanced",
    16: "expert",
    17: "expert",
    18: "expert",
    19: "expert",
    20: "expert"
}

def generate_quests(count: int = 1500) -> List[Dict]:
    quests = []
    global_id = 1
    
    # Распределение: больше базовых, меньше продвинутых
    levels_per_difficulty = {
        1: 200,   # level 1 - beginner
        2: 180,
        3: 160,
        4: 140,
        5: 120,
        6: 110,  # level 6 - intermediate
        7: 100,
        8: 90,
        9: 80,
        10: 70,
        11: 60,  # level 11 - advanced
        12: 50,
        13: 40,
        14: 30,
        15: 20,
        16: 10,  # level 16 - expert
        17: 8,
        18: 6,
        19: 4,
        20: 2
    }
    
    for level, num_quests in levels_per_difficulty.items():
        difficulty = DIFFICULTY_MAP[level]
        
        # Определяем категории для этого уровня
        if difficulty == "beginner":
            categories = ["Drawing", "Anatomy", "Animation"]
        elif difficulty == "intermediate":
            categories = ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"]
        else:
            categories = ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"]
        
        for _ in range(num_quests):
            category = random.choice(categories)
            meta = CATEGORY_META[category]
            
            # 1. Выбираем предмет по уровню
            subject = random.choice(SUBJECTS[category][difficulty])
            
            # 2. Выбираем технику
            tech_pool = TECHNIQUES[category]
            if difficulty == "beginner":
                technique = random.choice(tech_pool[:4])
            elif difficulty == "intermediate":
                technique = random.choice(tech_pool[4:8])
            else:
                technique = random.choice(tech_pool[8:])
            
            # 3. Контекст (50% шанс добавления)
            context = ""
            if random.random() > 0.5:
                context_type = random.choice(list(CONTEXTS.keys()))
                context = f" Контекст: {random.choice(CONTEXTS[context_type])}."
            
            # 4. Фокус
            focus = random.choice(FOCUS_AREAS)
            
            # 5. Собираем задание
            title = f"{technique}: {subject} ({level} ур.)"
            description = (
                f"Создай работу, используя {technique}. "
                f"{context}"
                f"Основной фокус: {focus}. "
                f"Источник: {random.choice(SOURCES[category])}."
            )
            
            # XP и время
            base_xp = {"beginner": 45, "intermediate": 95, "advanced": 190, "expert": 320}.get(difficulty, 95)
            base_time = {"beginner": (20, 35), "intermediate": (35, 55), "advanced": (55, 85), "expert": (85, 120)}.get(difficulty, (30, 50))
            
            xp = int(base_xp * random.uniform(0.9, 1.15))
            time = int(random.uniform(*base_time))
            
            # Теги
            tags = [difficulty, category.lower(), "digital"]
            if context:
                tags.append(context_type)
            
            quest = {
                "id": global_id,
                "code": f"{meta['code']}-{global_id:04d}",
                "title": {
                    "ru": title.strip(),
                    "en": title.strip().replace(" ур.", " lvl").replace("Создай работу", "Create artwork").replace(" используя ", " using ").replace("Контекст:", "Context:").replace("Основной фокус:", "Focus:").replace("Источник:", "Source:")
                },
                "category": category.lower(),
                "difficulty": difficulty,
                "description": {
                    "ru": description.strip(),
                    "en": description.strip()
                        .replace("Создай работу", "Create artwork")
                        .replace(" используя ", " using ")
                        .replace("Контекст:", "Context:")
                        .replace("Основной фокус:", "Focus:")
                        .replace("Источник:", "Source:")
                        .replace("верхний свет", "top light")
                        .replace("боковой контровой", "side rim light")
                        .replace("рассеянный дневной", "soft daylight")
                        .replace("ночной неон", "night neon")
                        .replace("пустая комната", "empty room")
                        .replace("улица города", "city street")
                        .replace("лесная тропа", "forest path")
                        .replace("спокойствие", "calm")
                        .replace("напряжение", "tension")
                        .replace("радость", "joy")
                        .replace("утро", "morning")
                        .replace("полдень", "noon")
                },
                "xp": xp,
                "estimatedTime": time,
                "source": random.choice(SOURCES[category]),
                "icon": meta["icon"],
                "color": meta["color"],
                "tags": tags,
                "prerequisites": [],
                "medium": "digital",
                "is_repeatable": difficulty == "expert",
                "review_after_days": 7 if difficulty == "advanced" else 0,
                "streak_bonus": 1.1 if difficulty in ["advanced", "expert"] else 1.0
            }
            
            quests.append(quest)
            global_id += 1
    
    return quests

# Генерируем квесты
quests = generate_quests(1500)

# Сохраняем в файл
with open('src/renderer/src/data/quests.json', 'w', encoding='utf-8') as f:
    json.dump(quests, f, ensure_ascii=False, indent=2)

print(f"✅ Сгенерировано {len(quests)} уникальных квестов!")
print(f"📊 Распределение по сложности:")
for diff in ["beginner", "intermediate", "advanced", "expert"]:
    count = sum(1 for q in quests if q["difficulty"] == diff)
    print(f"   {diff}: {count}")