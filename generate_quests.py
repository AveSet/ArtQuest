#!/usr/bin/env python3
"""
ArtQuest Quest Generator v2.0
==============================
Генератор 1000 педагогически выверенных квестов для ArtQuest.
Основан на реальных учебных программах: Drawabox, Proko, Animator's Survival Kit, 
Elemental Magic, Framed Inc, Pixar Storytelling.

Функции:
- 5 категорий × 5 сложностей × 40 квестов = 1000 уникальных заданий
- Дедупликация по хешу (title+description)
- Medium-aware ограничения (traditional/digital/both)
- Теги, пререквизиты, spaced repetition, streak bonus
- CLI: --count, --seed, --split, --fmt, --out
- Вывод: TypeScript или JSON + manifest.json
- Полностью самодостаточный (stdlib only)

Использование:
  python generate_quests.py
  python generate_quests.py --count 1000 --split --fmt ts --out src/data
"""

import argparse
import json
import os
import random
import textwrap
import hashlib
from dataclasses import dataclass, field, asdict
from typing import List, Dict, Set, Optional

# 🔧 КОНФИГУРАЦИЯ
QUESTS_PER_DIFF = 40
DEFAULT_SEED = 42

# 📊 МОДЕЛЬ КВЕСТА
@dataclass
class Quest:
    id: int
    code: str
    title: str
    category: str
    difficulty: str
    description: str
    xp: int
    estimatedTime: int
    source: str
    icon: str
    color: str
    tags: List[str] = field(default_factory=list)
    prerequisites: List[str] = field(default_factory=list)
    medium: str = "both"  # traditional | digital | both
    is_repeatable: bool = False
    review_after_days: int = 0
    streak_bonus: float = 1.0

    def to_dict(self) -> dict:
        return asdict(self)

    @property
    def unique_key(self) -> str:
        """Ключ для дедупликации"""
        raw = f"{self.title.lower().strip()}|{self.description.lower().strip()}"
        return hashlib.md5(raw.encode("utf-8")).hexdigest()

# 📚 БАЗЫ ДАННЫХ
SUBJECTS = {
    "Drawing": ["куба", "сферы", "цилиндра", "руки в жесте", "портрета в 3/4", "натюрморта", "драпировки", "пейзажа", "персонажа", "архитектурного фрагмента"],
    "Anatomy": ["торса", "кисти", "стопы", "головы в анфас", "фигуры в движении", "скелета таза", "плечевого пояса", "лицевой мимики", "позвоночника", "мускулатуры ног"],
    "Animation": ["мяча с отскоком", "фигуры в шаге", "персонажа в прыжке", "хвоста животного", "ткани на ветру", "камеры с панорамой", "объекта с весом", "диалоговой сцены", "цикла бега", "реакции персонажа"],
    "Effects": ["огня", "дыма", "воды с брызгами", "магической энергии", "взрывной волны", "дождя", "искр", "тумана", "лавы", "электрической дуги"],
    "Storytelling": ["сцены погони", "диалога", "момента открытия", "тихой сцены", "кульминации", "флешбэка", "перехода между локациями", "эмоционального пика", "завязки", "развязки"]
}

CONSTRAINTS = {
    "traditional": ["без ластика", "только уголь/карандаш", "ограничение 3 оттенками серого", "одним инструментом", "без растушевки"],
    "digital": ["без ctrl+z", "только 1 кисть", "ограничение палитры 5 цветов", "слой только для скетча", "без blending modes"],
    "both": ["по таймеру", "без референса", "в негативном пространстве", "закрытыми глазами первые 10 сек", "только прямые/только кривые линии"]
}

SOURCES = {
    "Drawing": ["Drawabox Lesson 1-3", "Proko Figure Basics", "Michael Hampton Figure Drawing", "Scott Robertson HTDRAW"],
    "Anatomy": ["Bridgman Constructive Anatomy", "Michael Hampton", "Christopher Hart", "Atlas of Human Anatomy"],
    "Animation": ["Richard Williams Animator's Survival Kit", "Animation Mentor", "12 Principles Disney", "Alan Becker Tutorials"],
    "Effects": ["Elemental Magic Vol 1-2", "FX Animation Guide", "Ufotable/Trigger Breakdowns", "Houdini for Artists"],
    "Storytelling": ["Framed Inc", "Scott McCloud Understanding Comics", "Storyboard Essentials", "Pixar Storytelling"]
}

CATEGORY_META = {
    "Drawing": {"code": "DRA", "icon": "🎨", "color": "#6366f1"},
    "Anatomy": {"code": "ANA", "icon": "🦴", "color": "#ec4899"},
    "Animation": {"code": "ANM", "icon": "🎬", "color": "#10b981"},
    "Effects": {"code": "EFF", "icon": "✨", "color": "#f59e0b"},
    "Storytelling": {"code": "STR", "icon": "📖", "color": "#8b5cf6"}
}

DIFFICULTY_CONFIG = {
    "novice":       {"xp_base": 50,  "time_base": 18, "mult": 1.0},
    "intermediate": {"xp_base": 80,  "time_base": 28, "mult": 1.3},
    "advanced":     {"xp_base": 140, "time_base": 42, "mult": 1.7},
    "master":       {"xp_base": 200, "time_base": 60, "mult": 2.1},
    "expert":       {"xp_base": 250, "time_base": 85, "mult": 2.5}
}

# 📖 ПЕДАГОГИЧЕСКИЕ ТЕМПЛЕЙТЫ (все 5 категорий × 5 сложностей)
EXERCISE_POOLS: Dict[str, Dict[str, List[dict]]] = {
    "Drawing": {
        "novice": [
            {"t": "Быстрый жест: {} ({} сек)", "d": "Захвати линию действия и общую форму. Не рисуй детали.", "tags": ["gesture", "speed"], "m": "both"},
            {"t": "Контурный рисунок {} вслепую", "d": "Гляди только на объект. Развивай зрительно-моторную связь.", "tags": ["contour", "focus"], "m": "traditional"},
            {"t": "Построй {} из примитивов", "d": "Разложи на сферы/кубы/цилиндры. Пойми объём до штриховки.", "tags": ["construction", "3d-thinking"], "m": "both"},
            {"t": "Тональная шкала {} ступеней", "d": "Контролируй нажим. Плавный переход от белого к чёрному.", "tags": ["value", "control"], "m": "traditional"},
            {"t": "Цифровой блок-аут: {} (flat colors)", "d": "Залей формы базовыми цветами. Без теней и текстур.", "tags": ["digital", "blocking"], "m": "digital"},
            {"t": "Копия простого референса: {}", "d": "Наблюдательный рисунок с акцентом на пропорции.", "tags": ["observation", "accuracy"], "m": "both"}
        ],
        "intermediate": [
            {"t": "Конструктивный {} в 3/4", "d": "Вращай форму в пространстве. Проверь эллипсы и перспективу.", "tags": ["construction", "rotation"], "m": "both"},
            {"t": "Светотеневое моделирование {}", "d": "Ядро тени, полутень, блик, рефлекс. 1 источник света.", "tags": ["shading", "lighting"], "m": "both"},
            {"t": "Драпировка на {}: 5 типов складок", "d": "Трубчатые, зигзаг, инертные, диагональные, составные.", "tags": ["drapery", "observation"], "m": "both"},
            {"t": "Двухточечная перспектива: {}", "d": "Угловой объект. Проверь сходимость и масштаб.", "tags": ["perspective", "spatial"], "m": "both"},
            {"t": "Спид-скетч {}: {} мин/шт", "d": "Выбери главное. Отбрось детали. Тренируй композицию.", "tags": ["speed", "composition"], "m": "both"},
            {"t": "Анализ формы у мастеров: {}", "d": "Разбери как профессионалы упрощают сложные объекты.", "tags": ["master-study", "analysis"], "m": "both"}
        ],
        "advanced": [
            {"t": "Ценностный этюд {}: 3 тона", "d": "Передай форму только через тёмный/средний/светлый.", "tags": ["value-study", "simplification"], "m": "both"},
            {"t": "Перспективное сокращение: {}", "d": "Форма идёт прямо на зрителя. Сохрани пропорции.", "tags": ["foreshortening", "depth"], "m": "both"},
            {"t": "Текстурное исследование: {}", "d": "Передай тактильность через штрих, тон и края.", "tags": ["texture", "rendering"], "m": "both"},
            {"t": "Освещение {}: 3 сценария", "d": "Верхний, боковой, контровой. Сравни влияние на форму.", "tags": ["lighting", "study"], "m": "both"},
            {"t": "Рисунок {} по памяти", "d": "Без референса. Проверь визуальную библиотеку.", "tags": ["memory", "imagination"], "m": "both", "rep": True},
            {"t": "Комплексная штриховка: {}", "d": "Смешай перекрёстную, точечную и мягкую растушёвку.", "tags": ["technique", "hybrid"], "m": "traditional"}
        ],
        "master": [
            {"t": "Копия {}: ан��лиз техники", "d": "Разбери язык художника: ритм, края, экономия средств.", "tags": ["master-study", "technique"], "m": "both"},
            {"t": "Композиционный поиск: {} (5 тумбнейлов)", "d": "Правило третей, ведущие линии, визуальный вес.", "tags": ["composition", "thumbnails"], "m": "both"},
            {"t": "Портрет {}: пропорции + характер", "d": "Синтез анатомии и личности. Избегай 'кукольности'.", "tags": ["portrait", "expression"], "m": "both"},
            {"t": "Эскиз окружения: {} с глубиной", "d": "Атмосферная перспектива, масштаб, перекрытие.", "tags": ["environment", "depth"], "m": "both"},
            {"t": "Глобальное освещение: {} в интерьере", "d": "Отражённый свет, цветовые рефлексы, мягкие тени.", "tags": ["lighting", "interior"], "m": "digital"},
            {"t": "Стилизация формы: {}", "d": "Преувеличение/упрощение под конкретный арт-стиль.", "tags": ["stylization", "design"], "m": "both"}
        ],
        "expert": [
            {"t": "Финальная работа: {} для портфолио", "d": "Проф-уровень: чистота, цельность, полировка.", "tags": ["portfolio", "final"], "m": "both"},
            {"t": "Стилизация {}: поиск языка", "d": "Переработай академические основы в авторскую манеру.", "tags": ["style-dev", "creative"], "m": "both", "rep": True, "rev": 7},
            {"t": "Многофигурная сцена: {}", "d": "Пространство, ритм, фокусы, повествование в кадре.", "tags": ["scene", "storytelling"], "m": "both"},
            {"t": "Технический разбор: {} в разрезе", "d": "Анатомическая/конструктивная точность для продакшена.", "tags": ["technical", "breakdown"], "m": "both"},
            {"t": "Марафон: {} (5 итераций)", "d": "Самоанализ → правка → выход на новый уровень.", "tags": ["challenge", "growth"], "m": "both", "rep": True, "rev": 3},
            {"t": "Индустриальный бриф: {}", "d": "Работа по ТЗ: стиль, сроки, читаемость, экспорт.", "tags": ["industry", "deadline"], "m": "both"}
        ]
    },
    "Anatomy": {
        "novice": [
            {"t": "Жестовые наброски фигуры ({} сек)", "d": "Поиск линии действия, центра тяжести и общей динамики.", "tags": ["gesture", "rhythm"], "m": "both"},
            {"t": "Пропорции тела: метод {} голов", "d": "Базовое построение фигуры с использованием канонических пропорций.", "tags": ["proportions", "canonical"], "m": "both"},
            {"t": "Упрощённый скелет: {} и таз", "d": "Понимание костных ориентиров и их влияния на форму тела.", "tags": ["skeleton", "landmarks"], "m": "both"},
            {"t": "Блочная фигура: {} как объём", "d": "Замена мышц на коробку, цилиндр и сферу для понимания 3D.", "tags": ["construction", "mass"], "m": "both"},
            {"t": "Костные ориентиры: {}", "d": "Отметка ключевых точек, видимых под кожей в любой позе.", "tags": ["anatomy", "reference"], "m": "both"},
            {"t": "Основные группы мышц: {}", "d": "Изучение формы и направления основных мышечных масс.", "tags": ["muscles", "mapping"], "m": "both"}
        ],
        "intermediate": [
            {"t": "Торс: вращение грудной клетки и таза", "d": "Анализ скручивания, наклона и связи позвоночника с позой.", "tags": ["torso", "twist"], "m": "both"},
            {"t": "Руки/Ноги: суставы и рычаги", "d": "Построение конечностей через цилиндры, эллипсы и точки сгиба.", "tags": ["limbs", "joints"], "m": "both"},
            {"t": "Кисть: ладонь как форма, пальцы как цилиндры", "d": "Упрощение сложной структуры для быстрого и точного рисунка.", "tags": ["hands", "construction"], "m": "both"},
            {"t": "Голова: метод Люмиса/Райли", "d": "Построение черепа в разных ракурсах с разметкой лица.", "tags": ["head", "proportions"], "m": "both"},
            {"t": "Динамичная поза: {} с весом", "d": "Передача опоры, баланса и напряжения через линию действия.", "tags": ["pose", "balance"], "m": "both"},
            {"t": "Карта мышц: {} в статике", "d": "Наложение анатомических форм на упрощённый манекен.", "tags": ["muscle", "layering"], "m": "both"}
        ],
        "advanced": [
            {"t": "Перспективное сокращение: {}", "d": "Работа с формой, направленной прямо на зрителя или от него.", "tags": ["foreshortening", "depth"], "m": "both"},
            {"t": "Функция мышц: {} при действии", "d": "Как мышцы сокращаются/растягиваются в конкретных движениях.", "tags": ["kinetics", "function"], "m": "both"},
            {"t": "Анатомия под одеждой: {}", "d": "Чтение костных и мышечных форм сквозь ткань разной плотности.", "tags": ["drapery", "underlying"], "m": "both"},
            {"t": "Вариации: {} (возраст/пол/тип фигуры)", "d": "Адаптация пропорций и мышечного рельефа под разные типы.", "tags": ["variation", "body-types"], "m": "both"},
            {"t": "Мимика: {} через мышцы лица", "d": "Связь сухожилий, кожи и костей в выражении эмоций.", "tags": ["expression", "face"], "m": "both"},
            {"t": "Быстрая анатомия: {} за 5 мин", "d": "Синтез жеста, конструкции и основных мышц в сжатые сроки.", "tags": ["speed", "integration"], "m": "both"}
        ],
        "master": [
            {"t": "Анатомический разбор: {} в разрезе", "d": "Точное отображение слоёв: кость → мышца → жир → кожа.", "tags": ["medical", "layers"], "m": "both"},
            {"t": "Стилизация: {} (аниме/картун/реализм)", "d": "Упрощение или преувеличение анатомии под конкретный стиль.", "tags": ["stylization", "design"], "m": "both"},
            {"t": "Распределение веса: {} на опорах", "d": "Как тело компенсирует нагрузку, наклон и инерцию.", "tags": ["weight", "balance"], "m": "both"},
            {"t": "Сложная поза: {} с перекрещиванием", "d": "Работа с перекрытием конечностей, скручиванием и балансом.", "tags": ["complex-pose", "overlap"], "m": "both"},
            {"t": "Турнарот персонажа: {} (вид сбоку/спереди)", "d": "Единообразие пропорций и анатомии во всех ракурсах.", "tags": ["turnaround", "consistency"], "m": "both"},
            {"t": "Анализ анатомии у мастеров: {}", "d": "Разбор как классические художники решали анатомические задачи.", "tags": ["master-study", "analysis"], "m": "both"}
        ],
        "expert": [
            {"t": "Фигурная работа для портфолио: {}", "d": "Профессиональный уровень: точность, экспрессия, чистота.", "tags": ["portfolio", "final"], "m": "both"},
            {"t": "Анатомия для анимации: {}", "d": "Упрощение форм для быстрого построения и чтения в движении.", "tags": ["animation-ready", "simplification"], "m": "both", "rep": True},
            {"t": "Анатомия существа: {} на основе реальных", "d": "Конструирование биомеханики вымышленного персонажа.", "tags": ["creature", "design"], "m": "both"},
            {"t": "Телесное актёрство: {} через позу", "d": "Передача намерения, эмоции и характера только через анатомию.", "tags": ["acting", "character"], "m": "both"},
            {"t": "Технический чертёж: {} с размерами", "d": "Подготовка листа для моделирования/риггинга.", "tags": ["technical", "production"], "m": "both"},
            {"t": "Индустриальное задание: {} по ТЗ", "d": "Соответствие тр��бованиям студии: читаемость, стиль, сроки.", "tags": ["industry", "brief"], "m": "both"}
        ]
    },
    "Animation": {
        "novice": [
            {"t": "Тайминг-чарт: отскок мяча ({} кадров)", "d": "Базовое упражнение на ускорение/замедление и дуги движения.", "tags": ["timing", "arcs"], "m": "both"},
            {"t": "Сжатие и растяжение: {}", "d": "Сохранение объёма при деформации формы в движении.", "tags": ["squash-stretch", "volume"], "m": "both"},
            {"t": "Дуги движения: {} через ключевые кадры", "d": "Плавность траекторий и избегание механических прямых линий.", "tags": ["arcs", "flow"], "m": "both"},
            {"t": "Замедление в начале/конце: {}", "d": "Имитация инерции через распределение кадров (spacing).", "tags": ["slow-in-out", "inertia"], "m": "both"},
            {"t": "Флипбук: простой цикл ({} кадров)", "d": "Понимание последовательности, ритма и замкнутости движения.", "tags": ["cycle", "flipbook"], "m": "traditional"},
            {"t": "От позы к позе: {}", "d": "Создание ключевых кадров перед прорисовкой промежуточных.", "tags": ["pose-to-pose", "planning"], "m": "both"}
        ],
        "intermediate": [
            {"t": "Цикл шага: {} (4 ключевые фазы)", "d": "Контакт, отталкивание, проход, опускание. Перенос веса.", "tags": ["walk-cycle", "weight"], "m": "both"},
            {"t": "Цикл бега: {} с фазой полёта", "d": "Динамика, наклон корпуса, работа рук и ног в противофазе.", "tags": ["run-cycle", "dynamics"], "m": "both"},
            {"t": "Вторичная анимация: {} (волосы/одежда/хвост)", "d": "Follow-through и overlapping action для реализма.", "tags": ["secondary", "overlap"], "m": "both"},
            {"t": "Передача веса: {} (тяжёлый/лёгкий объект)", "d": "Как масса влияет на тайминг, деформацию и реакцию тела.", "tags": ["weight", "mass"], "m": "both"},
            {"t": "Предвосхищение: {} перед действием", "d": "Подготовка зрителя к движению через обратное движение.", "tags": ["anticipation", "readiness"], "m": "both"},
            {"t": "Синхронизация губ: {} (гласные/согласные)", "d": "Базовая разбивка речи на формы рта и тайминг.", "tags": ["lip-sync", "mouth-shapes"], "m": "both"}
        ],
        "advanced": [
            {"t": "Прыжок: {} с приземлением и отскоком", "d": "Сжатие перед стартом, фаза полёта, амортизация.", "tags": ["jump", "physics"], "m": "both"},
            {"t": "Взаимодействие с объектом: {}", "d": "Как тело и объект влияют на движение друг друга.", "tags": ["interaction", "force"], "m": "both"},
            {"t": "Пантомима: {} без слов (10-15 сек)", "d": "Передача намерения и эмоции через чистое движение.", "tags": ["pantomime", "acting"], "m": "both"},
            {"t": "Анимация камеры: {} (пан/зум/трекинг)", "d": "Синхронизация движения камеры с действием в кадре.", "tags": ["camera", "composition"], "m": "both"},
            {"t": "Сложный цикл: {} (животное/механизм)", "d": "Нестандартная биомеханика или техническая последовательность.", "tags": ["complex-cycle", "mechanics"], "m": "both"},
            {"t": "Актерская поза: {} с характером", "d": "Выбор сильной, читаемой позы, раскрывающей намерение.", "tags": ["acting", "pose"], "m": "both"}
        ],
        "master": [
            {"t": "Диалоговая сцена: {} с интонацией", "d": "Синхронизация анимации с речью, эмоцией и подтекстом.", "tags": ["dialogue", "subtext"], "m": "both"},
            {"t": "Взаимодействие 2+ персонажей: {}", "d": "Распределение фокуса, тайминг реакций и зрительная связь.", "tags": ["multi-char", "focus"], "m": "both"},
            {"t": "Стилизация движения: {}", "d": "Преувеличение, ломка физики под стиль (аниме/картун).", "tags": ["stylization", "exaggeration"], "m": "both"},
            {"t": "Аниматик сцену: {} (ритм и монтаж)", "d": "Тестирование тайминга, переходов и эмоциональной дуги.", "tags": ["animatic", "pacing"], "m": "both"},
            {"t": "Полировка сцены: {} (spacing/curves)", "d": "Финальная доводка: чистота линий, точность дуг, микро-анимация.", "tags": ["polish", "curves"], "m": "digital"},
            {"t": "Сцена для шоурила: {} (проф уровень)", "d": "Соответствие индустриальным стандартам: вес, характер, полировка.", "tags": ["reel", "industry"], "m": "both"}
        ],
        "expert": [
            {"t": "Игровой цикл: {} (оптимизация, blend)", "d": "Адаптация под реал-тайм: петли, переходы, вес.", "tags": ["game-ready", "optimization"], "m": "digital", "rep": True},
            {"t": "Правка мокапа: {} (сохранение характера)", "d": "Усиление читаемости, удаление шума, добавление стиля.", "tags": ["mocap", "cleanup"], "m": "digital"},
            {"t": "Анимация FX: {} (огонь/вода/магия)", "d": "Тайминг энергии, сохранение объёма, слоистая а��имация.", "tags": ["fx-animation", "energy"], "m": "both"},
            {"t": "Режиссёрский кадр: {} с визуальной историей", "d": "Композиция, камера, свет и движение как единое повествование.", "tags": ["direction", "story"], "m": "both"},
            {"t": "Анимация за 24 часа: {}", "d": "Интеграция всех навыков в сжатые сроки с фокусом на читаемость.", "tags": ["speed", "challenge"], "m": "both", "rev": 3},
            {"t": "Финальная сцена: {} (полный цикл)", "d": "От скетча до финала: тест, полировка, звук, экспорт.", "tags": ["production", "pipeline"], "m": "both"}
        ]
    },
    "Effects": {
        "novice": [
            {"t": "Базовая форма эффекта: {}", "d": "Изучение силуэта, направления энергии и основных масс.", "tags": ["shape", "energy"], "m": "both"},
            {"t": "Тайминг простого эффекта: {} (разгон/спад)", "d": "Понимание как эффект набирает силу и затухает.", "tags": ["timing", "life-cycle"], "m": "both"},
            {"t": "2-слойный эффект: {} (основа + детали)", "d": "Разделение на основной объём и мелкие элементы.", "tags": ["layers", "separation"], "m": "digital"},
            {"t": "Копия референса: {} (форма + направление)", "d": "Точное воспроизведение наблюдаемого эффекта без упрощений.", "tags": ["reference", "accuracy"], "m": "both"},
            {"t": "Поток энергии: {} (от источника к рассеиванию)", "d": "Визуализация движения силы через пространство.", "tags": ["flow", "direction"], "m": "both"},
            {"t": "Простая композиция: {} на фоне", "d": "Размещение эффекта в пространстве с учётом освещения.", "tags": ["composition", "placement"], "m": "both"}
        ],
        "intermediate": [
            {"t": "Сохранение объёма: {} при деформации", "d": "Эффект не должен 'схлопываться' или терять массу.", "tags": ["volume", "mass-retention"], "m": "both"},
            {"t": "Турбулентность: {} (завихрения/разломы)", "d": "Добавление хаотичности, контролируемой основным направлением.", "tags": ["turbulence", "chaos-control"], "m": "both"},
            {"t": "Взаимодействие с поверхностью: {}", "d": "Как эффект растекается, отскакивает или разрушает объект.", "tags": ["collision", "interaction"], "m": "both"},
            {"t": "Цветовой градиент: {} (ядро → края)", "d": "Переход температуры/насыщенности от источника к периферии.", "tags": ["color", "temperature"], "m": "digital"},
            {"t": "Вторичный эффект: {} (искры/дым/пыль)", "d": "Добавление сопутствующих элементов для усиления читаемости.", "tags": ["secondary", "detail"], "m": "both"},
            {"t": "Тайминг-чарт эффекта: {} (кадр за кадром)", "d": "Планирование разгона, пика и затухания через spacing.", "tags": ["timing-chart", "planning"], "m": "both"}
        ],
        "advanced": [
            {"t": "Многослойный эффект: {} (3-5 слоёв)", "d": "Разделение на: ядро, свечение, частицы, дым/пыль.", "tags": ["multi-layer", "breakdown"], "m": "digital"},
            {"t": "На основе физики: {} (жидкость/газ/твёрдое)", "d": "Имитация реального поведения вещества в упрощённой форме.", "tags": ["physics", "simulation"], "m": "both"},
            {"t": "Стилизация эффекта: {} (аниме/комикс)", "d": "Преобразование физического явления под визуальный стиль.", "tags": ["stylization", "design"], "m": "both"},
            {"t": "Атмосферный эффект: {} (туман/дождь)", "d": "Создание глубины и настроения через плотность и освещение.", "tags": ["atmosphere", "mood"], "m": "both"},
            {"t": "Кадр удара: {} (вспышка/деформация)", "d": "Кульминация эффекта: максимальная энергия, читаемость.", "tags": ["impact", "climax"], "m": "both"},
            {"t": "Зацикленный эффект: {} (бесшовный цикл)", "d": "Создание непрерывного эффекта без видимых стыков кадров.", "tags": ["loop", "seamless"], "m": "both"}
        ],
        "master": [
            {"t": "Кинематографичный эффект: {} (масштаб + драма)", "d": "Работа с масштабом, контрастом, светом и эмоциональным весом.", "tags": ["cinematic", "scale"], "m": "both"},
            {"t": "Композитинг эффекта: {} (слои + свечение)", "d": "Сборка финального кадра: взаимодействие с окружением.", "tags": ["compositing", "final"], "m": "digital"},
            {"t": "Процедурное изучение: {} (алгоритм + вариации)", "d": "Понимание правил генерации эффекта для создания вариаций.", "tags": ["procedural", "rules"], "m": "both"},
            {"t": "Эффект как повествование: {}", "d": "Как форма, цвет и движение эффекта передают характер.", "tags": ["storytelling", "symbolism"], "m": "both"},
            {"t": "Оптимизация: {} (снижение детализации)", "d": "Баланс между качеством и производительностью для продакшена.", "tags": ["optimization", "readability"], "m": "both"},
            {"t": "Копия эффекта от студий: {} (Ufotable/Pixar)", "d": "Разбор техники, слоёв, тайминга и стилистики профессионалов.", "tags": ["master-study", "industry"], "m": "both"}
        ],
        "expert": [
            {"t": "Финальный FX-шот: {} (полный цикл)", "d": "От референса до композита: тайминг, слои, свет, полировка.", "tags": ["portfolio", "pipeline"], "m": "both"},
            {"t": "Реал-тайм эффект: {} (частицы, шейдеры)", "d": "Адаптация под игровые движки: LOD, спрайты, производительность.", "tags": ["realtime", "game-dev"], "m": "digital", "rep": True},
            {"t": "Режиссура FX: {} (контроль фокуса и ритма)", "d": "Управление вниманием зрителя через масштаб, цвет и движение.", "tags": ["direction", "focus"], "m": "both"},
            {"t": "Сцена с несколькими эффектами: {}", "d": "Взаимодействие разных эффектов без визуального шума.", "tags": ["multi-fx", "composition"], "m": "both"},
            {"t": "Быстрый FX: {} (2-4 часа, читаемость)", "d": "Индустриальный спид: выбор главного, упрощение второстепенного.", "tags": ["speed", "industry"], "m": "both"},
            {"t": "Задание по брифу: {} (технические рамки)", "d": "Профессиональная работа: соответствие ТЗ, полировка, экспорт.", "tags": ["brief", "production"], "m": "both"}
        ]
    },
    "Storytelling": {
        "novice": [
            {"t": "Кадрирование: {} (правило третей)", "d": "Размещение объекта в сильных точках пересечения линий.", "tags": ["framing", "rule-of-thirds"], "m": "both"},
            {"t": "Силуэт: {} (читаемость формы)", "d": "Проверка: узнаётся ли объект/поза в чёрном контуре?", "tags": ["silhouette", "readability"], "m": "both"},
            {"t": "Группировка тонов: {} (свет/среднее/тень)", "d": "Упрощение сцены до 3-4 тональных масс для ясности.", "tags": ["value-grouping", "simplification"], "m": "both"},
            {"t": "Ведущие линии: {} к фокусу", "d": "Направление взгляда зрителя через архитектуру, свет или позы.", "tags": ["leading-lines", "focus"], "m": "both"},
            {"t": "Тип кадра: {} (общий/средний/крупный)", "d": "Выбор дистанции камеры для передачи масштаба или эмоции.", "tags": ["shot-type", "distance"], "m": "both"},
            {"t": "Простая раскладка: {} (2-3 панели)", "d": "Базовая последовательность: установление, действие, реакция.", "tags": ["layout", "sequence"], "m": "both"}
        ],
        "intermediate": [
            {"t": "��акурс камеры: {} (верхний/нижний/уровень)", "d": "Как наклон камеры влияет на восприятие силы/слабости.", "tags": ["angle", "perspective"], "m": "both"},
            {"t": "Слои глубины: {} (передний/средний/задний)", "d": "Создание пространства через перекрытие, тон и детализацию.", "tags": ["depth", "layering"], "m": "both"},
            {"t": "Цветовое настроение: {} (тепло/холод)", "d": "Использование палитры для передачи эмоции или времени суток.", "tags": ["color", "mood"], "m": "digital"},
            {"t": "Визуальный ритм: {} (чередование планов)", "d": "Управление вниманием через размер кадра и плотность деталей.", "tags": ["pacing", "rhythm"], "m": "both"},
            {"t": "Преемственность: {} (линия действия, 180°)", "d": "Сохранение пространственной логики между кадрами.", "tags": ["continuity", "180-rule"], "m": "both"},
            {"t": "Тумбнейлы: {} (5 вариантов композиции)", "d": "Быстрый поиск сильной композиции перед финальной прорисовкой.", "tags": ["thumbnails", "exploration"], "m": "both"}
        ],
        "advanced": [
            {"t": "Раскадровка: {} (3-5 кадров с действием)", "d": "Последовательность: установка, конфликт, развитие, разрешение.", "tags": ["storyboard", "sequence"], "m": "both"},
            {"t": "Эмоциональное кадрирование: {}", "d": "Использование пространства вокруг персонажа для передачи чувства.", "tags": ["emotion", "framing"], "m": "both"},
            {"t": "Визуальная метафора: {} (символ в кадре)", "d": "Передача подтекста через композицию, а не диалог.", "tags": ["metaphor", "subtext"], "m": "both"},
            {"t": "Динамичная камера: {} (трекинг/пан в кадре)", "d": "Движение камеры как часть повествования, а не украшение.", "tags": ["camera-move", "narrative"], "m": "both"},
            {"t": "Цветовой скрипт: {} (эмоциональная дуга)", "d": "Планирование изменения палитры от начала к кульминации.", "tags": ["color-script", "arc"], "m": "digital"},
            {"t": "Блокинг сцены: {} (расстановка и камера)", "d": "Организация пространства для ясности действия и фокуса.", "tags": ["blocking", "staging"], "m": "both"}
        ],
        "master": [
            {"t": "Профессиональная раскадровка: {}", "d": "Чёткие ракурсы, тайминг, переходы, заметки для аниматоров.", "tags": ["pro-storyboard", "pipeline"], "m": "both"},
            {"t": "Аниматик: {} (ритм, паузы, акценты)", "d": "Тестирование монтажа и эмоционального воздействия через тайминг.", "tags": ["animatic", "timing"], "m": "both"},
            {"t": "Композиция от характера: {}", "d": "Кадр строится вокруг внутреннего состояния, а не внешней красоты.", "tags": ["character-driven", "psychology"], "m": "both"},
            {"t": "Окружение как рассказчик: {}", "d": "Детали фона, свет и разрушение передают историю без слов.", "tags": ["environmental", "worldbuilding"], "m": "both"},
            {"t": "Освещение для настроения: {}", "d": "Как свет создаёт напряжение, безопасность, тайну или надежду.", "tags": ["lighting", "atmosphere"], "m": "both"},
            {"t": "Подача работы: {} (композиция, экспорт)", "d": "Профессиональное оформление для портфолио или питча.", "tags": ["presentation", "portfolio"], "m": "both"}
        ],
        "expert": [
            {"t": "Питч-последовательность: {} (убеждение через визуал)", "d": "Компактная сцена, демонстрирующая стиль, ритм и историю.", "tags": ["pitch", "reel"], "m": "both"},
            {"t": "Левел-арт: {} (навигация, фокусы)", "d": "Дизайн пространства для геймплея и эмоционального опыта.", "tags": ["level-design", "navigation"], "m": "both"},
            {"t": "Многосценичная непрерывность: {}", "d": "Сохранение визуального языка, цвета и ритма через сцены.", "tags": ["continuity", "series"], "m": "both"},
            {"t": "Режиссёрское планирование: {} (камера, свет)", "d": "Полный контроль над кадром как единым повествовательным инструментом.", "tags": ["direction", "control"], "m": "both"},
            {"t": "Разработка визуального языка: {}", "d": "Создание уникальной системы формы, цвета и композиции для проекта.", "tags": ["visual-language", "design-system"], "m": "both", "rep": True, "rev": 14},
            {"t": "Задание по брифу: {} (аудитория, рамки)", "d": "Профессиональная работа: соответствие ТЗ, полировка, готовность.", "tags": ["industry", "brief"], "m": "both"}
        ]
    }
}

# 🛠️ ГЕНЕРАЦИЯ
def generate_quests(count: int, seed: int, split: bool, fmt: str, output_dir: str):
    random.seed(seed)
    all_quests: List[Quest] = []
    global_id = 1
    seen_keys: Set[str] = set()
    skipped = 0

    for cat in EXERCISE_POOLS:
        for diff, templates in EXERCISE_POOLS[cat].items():
            cfg = DIFFICULTY_CONFIG[diff]
            meta = CATEGORY_META[cat]
            subjects = SUBJECTS.get(cat, ["объекта"])
            generated_for_diff = 0

            while generated_for_diff < QUESTS_PER_DIFF:
                tmpl = random.choice(templates)
                subject = random.choice(subjects)
                medium = tmpl.get("m", "both")
                constraint = random.choice(CONSTRAINTS[medium])
                sec = random.randint(15, 30) if "{} сек" in tmpl.get("t", "") else ""

                title = tmpl["t"].format(subject, sec)
                desc = f"{tmpl['d']} Ограничение: {constraint}. Референс: {random.choice(SOURCES[cat])}."
                
                xp = int(cfg["xp_base"] * cfg["mult"] * random.uniform(0.9, 1.1))
                time = int(cfg["time_base"] * cfg["mult"] * random.uniform(0.8, 1.2))

                q = Quest(
                    id=global_id,
                    code=f"{meta['code']}-{global_id:04d}",
                    title=title.strip(),
                    category=cat,
                    difficulty=diff,
                    description=desc.strip(),
                    xp=xp,
                    estimatedTime=time,
                    source=random.choice(SOURCES[cat]),
                    icon=meta["icon"],
                    color=meta["color"],
                    tags=tmpl.get("tags", []),
                    medium=medium,
                    is_repeatable=tmpl.get("rep", False),
                    review_after_days=tmpl.get("rev", 0),
                    streak_bonus=1.1 if diff in ["advanced", "master", "expert"] else 1.0
                )

                key = q.unique_key
                if key in seen_keys:
                    skipped += 1
                    if skipped > 500:
                        break  # Safety break
                    continue
                    
                seen_keys.add(key)
                all_quests.append(q)
                generated_for_diff += 1
                global_id += 1

    # Валидация
    print(f"\n✅ Сгенерировано: {len(all_quests)} | Пропущено дублей: {skipped}")
    assert len(all_quests) >= count, f"Ожидалось >= {count}, получено {len(all_quests)}. Проверьте шаблоны."

    os.makedirs(output_dir, exist_ok=True)
    
    if split:
        for cat in EXERCISE_POOLS:
            cat_quests = [q for q in all_quests if q.category == cat]
            path = os.path.join(output_dir, f"quests_{cat.lower()}.{fmt}")
            _save(cat_quests, path, fmt)
            print(f"📂 {path}")
    else:
        path = os.path.join(output_dir, f"quests.{fmt}")
        _save(all_quests, path, fmt)
        print(f"📄 {path}")

    # Манифест
    manifest = {
        "version": "2.0",
        "total": len(all_quests),
        "categories": {cat: len([q for q in all_quests if q.category == cat]) for cat in EXERCISE_POOLS},
        "seed": seed,
        "generated_at": random.getrandbits(32)
    }
    with open(os.path.join(output_dir, "manifest.json"), "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2, ensure_ascii=False)
    print("📋 manifest.json создан")

def _safe_str(s: str) -> str:
    """Экранирует строку для безопасной вставки в TS/JSON"""
    return s.replace('\\', '\\\\').replace('"', '\\"').replace('\n', ' ')

def _save(quests: List[Quest], path: str, fmt: str):
    if fmt == "json":
        with open(path, "w", encoding="utf-8") as f:
            json.dump([q.to_dict() for q in quests], f, indent=2, ensure_ascii=False)
    else:
        header = textwrap.dedent(f"""\
        // Auto-generated | ArtQuest v2.0 | {len(quests)} quests
        // DO NOT EDIT MANUALLY - run `python generate_quests.py` to regenerate
        export interface Quest {{
          id: number; code: string; title: string; category: string; difficulty: string;
          description: string; xp: number; estimatedTime: number; source: string;
          icon: string; color: string; tags: string[]; prerequisites: string[];
          medium: string; is_repeatable: boolean; review_after_days: number; streak_bonus: number;
        }}
        export const QUESTS: Quest[] = [
        """)
        footer = "];\n"
        items = []
        for q in quests:
            d = q.to_dict()
            items.append(f"  {{\n    id: {d['id']},\n    code: \"{_safe_str(d['code'])}\",\n    title: \"{_safe_str(d['title'])}\",\n    category: \"{_safe_str(d['category'])}\",\n    difficulty: \"{_safe_str(d['difficulty'])}\",\n    description: \"{_safe_str(d['description'])}\",\n    xp: {d['xp']},\n    estimatedTime: {d['estimatedTime']},\n    source: \"{_safe_str(d['source'])}\",\n    icon: \"{d['icon']}\",\n    color: \"{d['color']}\",\n    tags: {json.dumps(d['tags'], ensure_ascii=False)},\n    prerequisites: [],\n    medium: \"{d['medium']}\",\n    is_repeatable: {str(d['is_repeatable']).lower()},\n    review_after_days: {d['review_after_days']},\n    streak_bonus: {d['streak_bonus']}\n  }}")
        with open(path, "w", encoding="utf-8") as f:
            f.write(header + ",\n".join(items) + "\n" + footer)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="ArtQuest Professional Quest Generator v2.0")
    parser.add_argument("--count", type=int, default=1000, help="Total quests to generate")
    parser.add_argument("--seed", type=int, default=DEFAULT_SEED, help="Random seed for reproducibility")
    parser.add_argument("--split", action="store_true", help="Split output by category (lazy-loading ready)")
    parser.add_argument("--fmt", choices=["ts", "json"], default="ts", help="Output format")
    parser.add_argument("--out", default="src/data", help="Output directory")
    args = parser.parse_args()

    print(f"🎨 ArtQuest Quest Generator v2.0")
    print(f"📊 Конфигурация: {args.count} квестов | seed={args.seed} | fmt={args.fmt} | out={args.out}")
    generate_quests(args.count, args.seed, args.split, args.fmt, args.out)
    print("✨ Готово!")