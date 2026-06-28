const fs = require('fs');

const EXERCISE_POOLS = {
    "Drawing": {
        "novice": [
            {"t": "Digital block-in: {}", "d": "Построй форму из примитивов на отдельном слое. Фокус на пропорции, не детали.", "tags": ["blocking", "construction"], "m": "digital"},
            {"t": "Line art: {} (со стабилизацией)", "d": "Создай чистый лайнарт. Используй streamline/stabilizer кисти.", "tags": ["lineart", "cleanliness"], "m": "digital"},
            {"t": "Flat colors: {}", "d": "Залей базовыми цветами на отдельных слоях. Без теней и градиентов.", "tags": ["coloring", "layers"], "m": "digital"},
            {"t": "Value study: {} (3 тона)", "d": "Передай объём только через тёмный/средний/светлый. Работай на grayscale слое.", "tags": ["value", "form"], "m": "digital"},
            {"t": "Perspective grid: {} в 1-2 точках", "d": "Используй цифровую перспективную сетку. Проверь сходимость линий.", "tags": ["perspective", "spatial"], "m": "digital"},
            {"t": "Copy reference: {} (digital tracing)", "d": "Сделай оверлей референса 30% opacity. Тренируй точность линий.", "tags": ["observation", "accuracy"], "m": "digital"}
        ],
        "intermediate": [
            {"t": "Soft brush rendering: {}", "d": "Используй мягкие кисти для плавных переходов. Слой с умножением для теней.", "tags": ["rendering", "shading"], "m": "digital"},
            {"t": "Layer masking: {} (недеструктивно)", "d": "Используй маски вместо ластика. Сохрани PSD с редактируемыми слоями.", "tags": ["masking", "workflow"], "m": "digital"},
            {"t": "Blend modes: {} (multiply/overlay)", "d": "Примени blend modes для света и тени. Не рисуй поверх базового цвета.", "tags": ["lighting", "modes"], "m": "digital"},
            {"t": "Texture overlay: {}", "d": "Добавь текстуры через overlay/soft light слои. Настрой opacity под материал.", "tags": ["texture", "detail"], "m": "digital"},
            {"t": "Speedpaint: {} (45 мин)", "d": "Быстрый рендер с таймером. Фокус на главное, игнорируй второстепенное.", "tags": ["speed", "composition"], "m": "digital"},
            {"t": "Color adjustment: {} (curves/levels)", "d": "Скорректируй палитру через adjustment layers. Сохрани баланс тонов.", "tags": ["color", "grading"], "m": "digital"}
        ],
        "advanced": [
            {"t": "Custom brush creation: {} для рендера", "d": "Создай кисть под задачу (текстура, scatter, dynamics). Протестируй на объекте.", "tags": ["tools", "customization"], "m": "digital"},
            {"t": "Non-destructive workflow: {}", "d": "Полная работа через smart objects, masks, adjustment layers. 0 прямых правок.", "tags": ["pipeline", "professional"], "m": "digital"},
            {"t": "Material study: {} (металл/стекло/ткань)", "d": "Передай разные материалы цифровыми кистями и blend modes. Фокус на отражениях.", "tags": ["materials", "rendering"], "m": "digital"},
            {"t": "Light study: {} (3 источника)", "d": "Покажи 3 разных освещения на отдельных слоях. Сравни влияние на форму.", "tags": ["lighting", "study"], "m": "digital"},
            {"t": "Digital painting from imagination: {}", "d": "Без референса. Проверь визуальную библиотеку и конструктивное мышление.", "tags": ["imagination", "library"], "m": "digital"},
            {"t": "Complex composition: {}", "d": "Используй rule of thirds, leading lines, visual weight. Баланс пустот и масс.", "tags": ["composition", "design"], "m": "digital"}
        ],
        "master": [
            {"t": "Full render: {} (10+ слоёв)", "d": "Профессиональный рендер с деталями, коррекцией цвета и финальной полировкой.", "tags": ["render", "polish"], "m": "digital"},
            {"t": "Environment painting: {}", "d": "Цифровая живопись окружения. Атмосферная перспектива, глубина, масштаб.", "tags": ["environment", "depth"], "m": "digital"},
            {"t": "Atmospheric perspective: {} в пространстве", "d": "Передай удалённость через снижение контраста, сдвиг в холодные тона, размытие.", "tags": ["atmosphere", "space"], "m": "digital"},
            {"t": "Professional compositing: {}", "d": "Сборка финального кадра: интеграция объектов, света, эффектов, цветокоррекция.", "tags": ["compositing", "final"], "m": "digital"},
            {"t": "Stylized rendering: {} в выбранной манере", "d": "Адаптируй реализм под конкретный арт-стиль (аниме, полуреализм, графика).", "tags": ["stylization", "style"], "m": "digital"},
            {"t": "Lighting for mood: {}", "d": "Как свет создаёт напряжение, безопасность, тайну или надежду. Управление эмоцией.", "tags": ["lighting", "story"], "m": "digital"}
        ],
        "expert": [
            {"t": "Portfolio-ready piece: {}", "d": "Финальная работа для портфолио. Чистота, цельность, соответствие индустриальным стандартам.", "tags": ["portfolio", "industry"], "m": "digital"},
            {"t": "Industry brief execution: {}", "d": "Работа по ТЗ: стиль, сроки, читаемость, экспорт в нужном формате.", "tags": ["brief", "deadline"], "m": "digital"},
            {"t": "Visual development pass: {}", "d": "Создание 3-5 вариантов дизайна/окружения для выбора арт-директором.", "tags": ["dev", "iteration"], "m": "digital"},
            {"t": "Cinematic lighting setup: {}", "d": "Кинематографичное освещение с контролем фокуса, контраста и цветовой температуры.", "tags": ["cinematic", "lighting"], "m": "digital"},
            {"t": "Final polish & export: {}", "d": "Микро-детализация, sharpening, color grading, подготовка к печати/вебу.", "tags": ["polish", "export"], "m": "digital"},
            {"t": "Speed challenge: {} (2 часа)", "d": "Интеграция всех навыков в сжатые сроки. Фокус на читаемости и сильном силуэте.", "tags": ["speed", "challenge"], "m": "digital"}
        ]
    },
    "Anatomy": {
        "novice": [
            {"t": "Digital gesture: {} (30-60 сек)", "d": "Быстрые жесты на планшете. Линия действия, общая динамика, без деталей.", "tags": ["gesture", "speed"], "m": "digital"},
            {"t": "Proportions grid: {} (8 голов)", "d": "Построй сетку пропорций. Используй направляющие и выравнивание слоёв.", "tags": ["proportions", "grid"], "m": "digital"},
            {"t": "Simplified anatomy: {} (block figure)", "d": "Замени сложные формы на цифровые примитивы. Пойми массу до мышц.", "tags": ["construction", "mass"], "m": "digital"},
            {"t": "Hand/Foot study: {} (разные ракурсы)", "d": "Нарисуй кисть/стопу с 3 ракурсов. Отдельные слои, чистый лайнарт.", "tags": ["extremities", "study"], "m": "digital"},
            {"t": "Bony landmarks: {}", "d": "Отметь ключевые точки, видимые под кожей. Используй цветовой оверлей.", "tags": ["landmarks", "reference"], "m": "digital"},
            {"t": "Basic muscle groups: {}", "d": "Изучи форму и направление основных мышечных масс. Слой с умножением.", "tags": ["muscles", "mapping"], "m": "digital"}
        ],
        "intermediate": [
            {"t": "Muscle mapping: {} в движении", "d": "Покажи основные мышцы на отдельных слоях. Следи за растяжением/сокращением.", "tags": ["muscles", "dynamic"], "m": "digital"},
            {"t": "Dynamic pose: {} с весом", "d": "Передай баланс и напряжение. Используй референс и линию действия.", "tags": ["pose", "balance"], "m": "digital"},
            {"t": "Facial expressions: {} (5 эмоций)", "d": "Создай sheet с эмоциями. Отдельные слои, контроль мимики через мышцы.", "tags": ["face", "expression"], "m": "digital"},
            {"t": "Anatomy in clothing: {}", "d": "Чтение костных и мышечных форм сквозь ткань разной плотности.", "tags": ["drapery", "underlying"], "m": "digital"},
            {"t": "Perspective anatomy: {} (foreshortening)", "d": "Работа с формой, направленной на зрителя. Сохрани пропорции в сокращении.", "tags": ["foreshortening", "depth"], "m": "digital"},
            {"t": "Quick anatomy: {} за 5 мин", "d": "Синтез жеста, конструкции и основных мышц в сжатые сроки.", "tags": ["speed", "integration"], "m": "digital"}
        ],
        "advanced": [
            {"t": "Foreshortening extremes: {}", "d": "Сильное перспективное сокращение. Проверка пропорций через оверлей сетки.", "tags": ["foreshortening", "advanced"], "m": "digital"},
            {"t": "Anatomy for animation: {}", "d": "Упрощенная анатомия для быстрого построения и чтения в движении.", "tags": ["animation-ready", "simplification"], "m": "digital"},
            {"t": "Weight distribution: {} на опорах", "d": "Как тело компенсирует нагрузку, наклон и инерцию. Центр тяжести.", "tags": ["weight", "balance"], "m": "digital"},
            {"t": "Complex overlapping poses: {}", "d": "Работа с перекрытием конечностей, скручиванием и балансом.", "tags": ["overlap", "complexity"], "m": "digital"},
            {"t": "Age/Body type variations: {}", "d": "Адаптация пропорций и мышечного рельефа под разные типы телосложения.", "tags": ["variation", "types"], "m": "digital"},
            {"t": "Anatomical acting: {} через позу", "d": "Передача намерения, эмоции и характера только через анатомию и жест.", "tags": ["acting", "character"], "m": "digital"}
        ],
        "master": [
            {"t": "Medical cross-section: {} в разрезе", "d": "Точное отображение слоёв: кость → мышца → жир → кожа. Цифровая схема.", "tags": ["medical", "layers"], "m": "digital"},
            {"t": "Stylized anatomy: {} (аниме/картун)", "d": "Упрощение или преувеличение анатомии под конкретный стиль.", "tags": ["stylization", "design"], "m": "digital"},
            {"t": "Turnaround sheet: {} (3 вида)", "d": "Спереди/сбоку/сзади. Единые пропорции, направляющие, чистый лайнарт.", "tags": ["turnaround", "consistency"], "m": "digital"},
            {"t": "Anatomy breakdown for rigging: {}", "d": "Подготовка листа для 3D/2D риггинга. Суставы, оси вращения, деформация.", "tags": ["rigging", "technical"], "m": "digital"},
            {"t": "Creature biomechanics: {} на основе реальных", "d": "Конструирование биомеханики вымышленного персонажа. Логика движения.", "tags": ["creature", "design"], "m": "digital"},
            {"t": "Master anatomy analysis: {}", "d": "Разбор как классические и современные художники решали анатомические задачи.", "tags": ["study", "analysis"], "m": "digital"}
        ],
        "expert": [
            {"t": "Portfolio anatomy piece: {}", "d": "Профессиональный уровень: точность, экспрессия, чистота, индустриальное качество.", "tags": ["portfolio", "final"], "m": "digital"},
            {"t": "Production model sheet: {}", "d": "Полный пак для студии: пропорции, эмоции, позы, одежда, заметки.", "tags": ["production", "brief"], "m": "digital"},
            {"t": "Anatomical storytelling: {}", "d": "Как анатомия и поза рассказывают историю без слов. Характер через тело.", "tags": ["story", "character"], "m": "digital"},
            {"t": "Extreme dynamic anatomy: {}", "d": "Анатомия в экстремальном действии. Сохранение логики при деформации.", "tags": ["action", "logic"], "m": "digital"},
            {"t": "Industry anatomy challenge: {}", "d": "Работа по ТЗ студии: стиль, сроки, читаемость, готовность к продакшену.", "tags": ["industry", "deadline"], "m": "digital"},
            {"t": "Anatomy speed run: {} (1 час)", "d": "Интеграция всех навыков в сжатые сроки. Фокус на конструкции и весе.", "tags": ["speed", "mastery"], "m": "digital"}
        ]
    },
    "Animation": {
        "novice": [
            {"t": "Bouncing ball: {} (timing)", "d": "Анимируй отскок. Графики движения, ускорение/замедление.", "tags": ["timing", "physics"], "m": "digital"},
            {"t": "Squash & stretch: {}", "d": "Примени принцип сжатия/растяжения. Сохраняй объём формы.", "tags": ["squash-stretch", "volume"], "m": "digital"},
            {"t": "Motion arcs: {} через ключевые кадры", "d": "Плавность траекторий. Избегай механических прямых линий.", "tags": ["arcs", "flow"], "m": "digital"},
            {"t": "Slow in/out: {}", "d": "Имитация инерции через распределение кадров (spacing).", "tags": ["spacing", "inertia"], "m": "digital"},
            {"t": "Simple cycle: {} (8 кадров)", "d": "Бесшовный цикл. Onion skinning, проверка петлевого перехода.", "tags": ["cycle", "loop"], "m": "digital"},
            {"t": "Pose-to-pose workflow: {}", "d": "Создание ключевых кадров перед прорисовкой промежуточных.", "tags": ["workflow", "planning"], "m": "digital"}
        ],
        "intermediate": [
            {"t": "Walk cycle: {} (12 кадров)", "d": "Полный цикл ходьбы. Контакт, проход, перенос веса, противофаза рук.", "tags": ["walk", "weight"], "m": "digital"},
            {"t": "Run cycle: {} с фазой полёта", "d": "Динамика, наклон корпуса, работа ног в противофазе.", "tags": ["run", "dynamics"], "m": "digital"},
            {"t": "Secondary animation: {} (одежда/волосы)", "d": "Follow-through и overlapping action. Задержка относительно основного движения.", "tags": ["secondary", "overlap"], "m": "digital"},
            {"t": "Weight transfer: {} (тяжёлый/лёгкий объект)", "d": "Как масса влияет на тайминг, деформацию и реакцию тела.", "tags": ["weight", "mass"], "m": "digital"},
            {"t": "Anticipation: {} перед действием", "d": "Подготовка зрителя к движению через обратное движение или задержку.", "tags": ["anticipation", "readiness"], "m": "digital"},
            {"t": "Lip sync basics: {} (5 сек)", "d": "Синхронизация губ с аудио. Разбивка на формы рта (visemes).", "tags": ["lip-sync", "audio"], "m": "digital"}
        ],
        "advanced": [
            {"t": "Jump & landing: {} с амортизацией", "d": "Сжатие перед стартом, фаза полёта, поглощение удара при приземлении.", "tags": ["jump", "physics"], "m": "digital"},
            {"t": "Object interaction: {}", "d": "Как тело и объект влияют на движение друг друга. Сила и реакция.", "tags": ["interaction", "force"], "m": "digital"},
            {"t": "Pantomime acting: {} (10-15 сек)", "d": "Передача намерения и эмоции через чистое движение. Без слов.", "tags": ["acting", "pantomime"], "m": "digital"},
            {"t": "Camera movement sync: {} (пан/зум)", "d": "Синхронизация движения камеры с действием в кадре. Параллакс.", "tags": ["camera", "composition"], "m": "digital"},
            {"t": "Complex cycle: {} (существо/механизм)", "d": "Нестандартная биомеханика. Проверка баланса и логики движения.", "tags": ["cycle", "mechanics"], "m": "digital"},
            {"t": "Graph editor refinement: {}", "d": "Тонкая настройка кривых скорости. Убираем линейность, добавляем organic feel.", "tags": ["curves", "polish"], "m": "digital"}
        ],
        "master": [
            {"t": "Dialogue scene: {} с подтекстом", "d": "Синхронизация анимации с речью, эмоцией и скрытым смыслом.", "tags": ["dialogue", "subtext"], "m": "digital"},
            {"t": "Multi-character interaction: {}", "d": "Распределение фокуса, тайминг реакций, зрительная связь между персонажами.", "tags": ["multi-char", "focus"], "m": "digital"},
            {"t": "Stylized motion: {} (аниме/картун)", "d": "Преувеличение, ломка физики под стиль. Сохранение читаемости.", "tags": ["stylization", "exaggeration"], "m": "digital"},
            {"t": "Animatic pacing: {} (ритм и монтаж)", "d": "Тестирование тайминга, переходов и эмоциональной дуги через раскладки.", "tags": ["animatic", "editing"], "m": "digital"},
            {"t": "Final polish: {} (spacing/curves)", "d": "Финальная доводка: чистота линий, точность дуг, микро-анимация глаз/дыхание.", "tags": ["polish", "details"], "m": "digital"},
            {"t": "Reel-ready scene: {} (проф уровень)", "d": "Соответствие индустриальным стандартам: вес, характер, полировка, экспорт.", "tags": ["reel", "industry"], "m": "digital"}
        ],
        "expert": [
            {"t": "Game-ready cycle: {} (оптимизация)", "d": "Адаптация под реал-тайм: петли, blend tree, вес, LOD анимации.", "tags": ["game-dev", "optimization"], "m": "digital"},
            {"t": "Mocap cleanup: {} (сохранение характера)", "d": "Усиление читаемости, удаление шума, добавление стиля поверх данных.", "tags": ["mocap", "cleanup"], "m": "digital"},
            {"t": "FX animation integration: {}", "d": "Тайминг энергии, сохранение объёма, слоистая анимация эффектов.", "tags": ["fx-animation", "energy"], "m": "digital"},
            {"t": "Director's shot planning: {}", "d": "Композиция, камера, свет и движение как единое повествование.", "tags": ["direction", "story"], "m": "digital"},
            {"t": "24h animation challenge: {}", "d": "Интеграция всех навыков в сжатые сроки. Фокус на читаемости и весе.", "tags": ["speed", "challenge"], "m": "digital"},
            {"t": "Full pipeline production: {}", "d": "От скетча до финала: тест, полировка, звук, экспорт, документация.", "tags": ["pipeline", "production"], "m": "digital"}
        ]
    },
    "Effects": {
        "novice": [
            {"t": "Basic shape & flow: {}", "d": "Изучение силуэта, направления энергии и основных масс эффекта.", "tags": ["shape", "flow"], "m": "digital"},
            {"t": "Simple timing: {} (разгон/спад)", "d": "Понимание как эффект набирает силу и затухает. Спacing кадров.", "tags": ["timing", "life-cycle"], "m": "digital"},
            {"t": "2-layer effect: {} (основа + детали)", "d": "Разделение на основной объём и мелкие элементы. Слой с Screen/Add.", "tags": ["layers", "separation"], "m": "digital"},
            {"t": "Reference matching: {}", "d": "Точное воспроизведение наблюдаемого эффекта без упрощений. Цифровой пейнт.", "tags": ["reference", "accuracy"], "m": "digital"},
            {"t": "Energy direction: {} от источника", "d": "Визуализация движения силы через пространство. Векторы и поток.", "tags": ["direction", "vectors"], "m": "digital"},
            {"t": "Simple composition: {} на фоне", "d": "Размещение эффекта в пространстве с учётом освещения и масштаба.", "tags": ["composition", "placement"], "m": "digital"}
        ],
        "intermediate": [
            {"t": "Volume retention: {} при деформации", "d": "Эффект не должен 'схлопываться' или терять массу в движении.", "tags": ["volume", "mass"], "m": "digital"},
            {"t": "Turbulence control: {} (завихрения)", "d": "Добавление хаотичности, контролируемой основным направлением.", "tags": ["turbulence", "chaos"], "m": "digital"},
            {"t": "Surface interaction: {}", "d": "Как эффект растекается, отскакивает или разрушает объект. Физика.", "tags": ["collision", "physics"], "m": "digital"},
            {"t": "Color temperature gradient: {}", "d": "Переход температуры/насыщенности от ядра к краям. Heat map логика.", "tags": ["color", "temperature"], "m": "digital"},
            {"t": "Secondary particles: {} (искры/пыль)", "d": "Добавление сопутствующих элементов для усиления читаемости и масштаба.", "tags": ["particles", "detail"], "m": "digital"},
            {"t": "Timing chart: {} (кадр за кадром)", "d": "Планирование разгона, пика и затухания через spacing и hold frames.", "tags": ["chart", "planning"], "m": "digital"}
        ],
        "advanced": [
            {"t": "Multi-layer breakdown: {} (3-5 слоёв)", "d": "Разделение на: ядро, свечение, частицы, дым/пыль. Контроль opacity.", "tags": ["breakdown", "control"], "m": "digital"},
            {"t": "Physics-based simulation: {}", "d": "Имитация реального поведения вещества (жидкость/газ) в упрощённой форме.", "tags": ["simulation", "realism"], "m": "digital"},
            {"t": "Stylized FX: {} (аниме/комикс)", "d": "Преобразование физического явления под визуальный стиль проекта.", "tags": ["stylization", "design"], "m": "digital"},
            {"t": "Atmospheric effect: {} (туман/дождь)", "d": "Создание глубины и настроения через плотность, параллакс и освещение.", "tags": ["atmosphere", "depth"], "m": "digital"},
            {"t": "Impact frame: {} (вспышка/деформация)", "d": "Кульминация эффекта: максимальная энергия, читаемость, тайминг удара.", "tags": ["impact", "climax"], "m": "digital"},
            {"t": "Seamless loop: {} (бесшовный цикл)", "d": "Создание непрерывного эффекта без видимых стыков кадров. Crossfade.", "tags": ["loop", "cycle"], "m": "digital"}
        ],
        "master": [
            {"t": "Cinematic scale & drama: {}", "d": "Работа с масштабом, контрастом, светом и эмоциональным весом эффекта.", "tags": ["cinematic", "scale"], "m": "digital"},
            {"t": "Compositing with environment: {}", "d": "Сборка финального кадра: интеграция эффекта с окружением, светом, тенями.", "tags": ["compositing", "integration"], "m": "digital"},
            {"t": "Procedural generation rules: {}", "d": "Понимание алгоритмов генерации эффекта для создания вариаций без повторов.", "tags": ["procedural", "rules"], "m": "digital"},
            {"t": "FX storytelling: {}", "d": "Как форма, цвет и движение эффекта передают характер сцены/персонажа.", "tags": ["story", "symbolism"], "m": "digital"},
            {"t": "Optimization for performance: {}", "d": "Баланс между качеством и производительностью. Упрощение без потери читаемости.", "tags": ["optimization", "tech"], "m": "digital"},
            {"t": "Studio style analysis: {} (Ufotable/Pixar)", "d": "Разбор техники, слоёв, тайминга и стилистики профессиональных студий.", "tags": ["study", "industry"], "m": "digital"}
        ],
        "expert": [
            {"t": "Final VFX shot pipeline: {}", "d": "От референса до композита: тайминг, слои, свет, полировка, экспорт.", "tags": ["pipeline", "final"], "m": "digital"},
            {"t": "Real-time adaptation: {} (частицы/шейдеры)", "d": "Адаптация под игровые движки: LOD, спрайты, производительность, ограничения.", "tags": ["realtime", "game-dev"], "m": "digital"},
            {"t": "FX direction & focus control: {}", "d": "Управление вниманием зрителя через масштаб, цвет, движение и контраст.", "tags": ["direction", "focus"], "m": "digital"},
            {"t": "Multi-FX scene composition: {}", "d": "Взаимодействие разных эффектов в одном кадре без визуального шума.", "tags": ["multi-fx", "balance"], "m": "digital"},
            {"t": "Speed FX challenge: {} (2-4 часа)", "d": "Индустриальный спид: выбор главного, упрощение второстепенного, читаемость.", "tags": ["speed", "industry"], "m": "digital"},
            {"t": "Industry brief execution: {}", "d": "Профессиональная работа: соответствие ТЗ, полировка, готовность к продакшену.", "tags": ["brief", "production"], "m": "digital"}
        ]
    },
    "Storytelling": {
        "intermediate": [
            {"t": "Camera angles & power: {}", "d": "Как наклон камеры влияет на восприятие силы/слабости/напряжения.", "tags": ["angles", "psychology"], "m": "digital"},
            {"t": "Depth layering: {} (передний/задний план)", "d": "Создание пространства через перекрытие, тон, детализацию и параллакс.", "tags": ["depth", "space"], "m": "digital"},
            {"t": "Color mood palettes: {} (тепло/холод)", "d": "Использование палитры для передачи эмоции или времени суток.", "tags": ["color", "mood"], "m": "digital"},
            {"t": "Visual pacing & rhythm: {}", "d": "Управление вниманием через размер кадра, плотность деталей и паузы.", "tags": ["pacing", "rhythm"], "m": "digital"},
            {"t": "180° rule continuity: {}", "d": "Сохранение пространственной логики между кадрами. Ось действия.", "tags": ["continuity", "axis"], "m": "digital"},
            {"t": "Thumbnail exploration: {} (5 вариантов)", "d": "Быстрый поиск сильной композиции перед финальной прорисовкой.", "tags": ["thumbnails", "iteration"], "m": "digital"}
        ],
        "advanced": [
            {"t": "3-5 frame storyboard: {}", "d": "Последовательность: установка, конфликт, развитие, разрешение.", "tags": ["storyboard", "narrative"], "m": "digital"},
            {"t": "Emotional framing: {}", "d": "Использование пространства вокруг персонажа для передачи чувства.", "tags": ["emotion", "framing"], "m": "digital"},
            {"t": "Visual metaphors: {} (символы)", "d": "Передача подтекста через композицию, предметы, свет, а не диалог.", "tags": ["metaphor", "subtext"], "m": "digital"},
            {"t": "Dynamic camera movement: {}", "d": "Трекинг/пан в кадре как часть повествования, а не украшение.", "tags": ["camera", "motion"], "m": "digital"},
            {"t": "Color script: {} (эмоциональная дуга)", "d": "Планирование изменения палитры от начала сцены к кульминации.", "tags": ["color-script", "arc"], "m": "digital"},
            {"t": "Scene blocking: {} (расстановка)", "d": "Организация пространства для ясности действия, фокуса и чтения.", "tags": ["blocking", "staging"], "m": "digital"}
        ],
        "master": [
            {"t": "Professional storyboard: {}", "d": "Чёткие ракурсы, тайминг, переходы, технические заметки для команды.", "tags": ["pro-board", "pipeline"], "m": "digital"},
            {"t": "Animatic timing: {} (ритм и паузы)", "d": "Тестирование монтажа и эмоционального воздействия через тайминг раскладок.", "tags": ["animatic", "editing"], "m": "digital"},
            {"t": "Character-driven composition: {}", "d": "Кадр строится вокруг внутреннего состояния, а не внешней красоты.", "tags": ["character", "psychology"], "m": "digital"},
            {"t": "Environmental storytelling: {}", "d": "Детали фона, свет, разрушение и следы передают историю без слов.", "tags": ["environment", "lore"], "m": "digital"},
            {"t": "Lighting for narrative: {}", "d": "Как свет создаёт напряжение, безопасность, тайну или надежду в кадре.", "tags": ["lighting", "mood"], "m": "digital"},
            {"t": "Portfolio presentation: {}", "d": "Профессиональное оформление сцены: композиция, подписи, экспорт для питча.", "tags": ["presentation", "pitch"], "m": "digital"}
        ],
        "expert": [
            {"t": "Pitch sequence: {} (убеждение визуалом)", "d": "Компактная сцена, демонстрирующая стиль, ритм, историю и продакшен-готовность.", "tags": ["pitch", "reel"], "m": "digital"},
            {"t": "Level art & navigation: {}", "d": "Дизайн пространства для геймплея и эмоционального опыта. Фокусы, пути.", "tags": ["level-design", "navigation"], "m": "digital"},
            {"t": "Multi-scene continuity: {}", "d": "Сохранение визуального языка, цвета и ритма через несколько сцен.", "tags": ["continuity", "series"], "m": "digital"},
            {"t": "Director's shot planning: {}", "d": "Полный контроль над кадром как единым повествовательным инструментом.", "tags": ["direction", "control"], "m": "digital"},
            {"t": "Visual language development: {}", "d": "Создание уникальной системы формы, цвета и композиции для проекта.", "tags": ["visual-language", "design"], "m": "digital"},
            {"t": "Industry brief execution: {}", "d": "Работа по ТЗ: аудитория, стиль, технические рамки, полировка, сдача.", "tags": ["brief", "production"], "m": "digital"}
        ]
    }
};

// SUBJECTS per category
const SUBJECTS = {
    "Drawing": ["куба", "сферы", "цилиндра", "персонажа", "портрета", "натюрморта", "пейзажа", "архитектуры", "предметов", "животных", "транспорта", "интерьера", "экстерьера", "механизма", "растения", "одежды"],
    "Anatomy": ["жестов фигуры", "пропорций тела", "кисти руки", "стопы", "головы", "торса", "лица", "мышц", "скелетной системы", "динамической позы", "лицевой мимики", "экстремальных ракурсов", "существа"],
    "Animation": ["мяча с отскоком", "персонажа в ходьбе", "бега с полётом", "прыжка с приземлением", "эмоциональной реакции", "простого цикла", "вторичной анимации", "объекта с весом", "пантомимы", "диалога"],
    "Effects": ["огня", "дыма", "воды с брызгами", "взрыва", "магической энергии", "электричества", "частиц", "атмосферы", "разрушения", "жидкости"],
    "Storytelling": ["простой сцены", "эмоционального момента", "боевой сцены", "кульминации", "диалога", "монтажной последовательности", "пространства", "персонажа в кадре"]
};

const SOURCES = {
    "Drawing": ["Ctrl+Paint Digital", "Proko Digital", "FZD School", "Drawabox Digital"],
    "Anatomy": ["Proko Anatomy", "Michael Hampton", "3D.sk", "Atlas of Human Anatomy"],
    "Animation": ["Animation Mentor", "12 Principles", "Richard Williams", "Blender Animation"],
    "Effects": ["Elemental Magic", "The VFX Handbook", "Nuke Compositing", "After Effects Guide"],
    "Storytelling": ["Framed Inc", "Visual Story", "Storytelling for Animation", "Cinematography"]
};

const CATEGORY_META = {
    "Drawing": {"code": "DRA", "icon": "🎨", "color": "#6366f1"},
    "Anatomy": {"code": "ANA", "icon": "🦴", "color": "#ec4899"},
    "Animation": {"code": "ANM", "icon": "🎬", "color": "#10b981"},
    "Effects": {"code": "VFX", "icon": "✨", "color": "#f59e0b"},
    "Storytelling": {"code": "STY", "icon": "📖", "color": "#8b5cf6"}
};

// Level to difficulty mapping
const DIFFICULTY_MAP = {
    1: "novice", 2: "novice", 3: "novice", 4: "novice", 5: "novice",
    6: "intermediate", 7: "intermediate", 8: "intermediate", 9: "intermediate", 10: "intermediate",
    11: "intermediate", 12: "intermediate", 13: "intermediate", 14: "intermediate", 15: "intermediate",
    16: "advanced", 17: "advanced", 18: "advanced", 19: "advanced", 20: "advanced",
    21: "advanced", 22: "advanced", 23: "advanced", 24: "advanced", 25: "advanced",
    26: "advanced", 27: "advanced", 28: "advanced", 29: "advanced", 30: "advanced",
    31: "master", 32: "master", 33: "master", 34: "master", 35: "master",
    36: "master", 37: "master", 38: "master", 39: "master", 40: "master",
    41: "expert", 42: "expert", 43: "expert", 44: "expert", 45: "expert",
    46: "expert", 47: "expert", 48: "expert", 49: "expert", 50: "expert"
};

const XP_MAP = {"novice": 45, "intermediate": 95, "advanced": 190, "master": 320, "expert": 500};
const TIME_MAP = {
    "novice": [15, 30], "intermediate": [30, 50], "advanced": [50, 80],
    "master": [80, 120], "expert": [120, 180]
};

// Categories per difficulty level
const CATEGORIES_PER_LEVEL = {
    "novice": ["Drawing", "Anatomy", "Animation"],
    "intermediate": ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"],
    "advanced": ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"],
    "master": ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"],
    "expert": ["Drawing", "Anatomy", "Animation", "Effects", "Storytelling"]
};

// Distribution of quests per level
const LEVEL_DISTRIBUTION = {
    1: 30, 2: 30, 3: 30, 4: 30, 5: 30,
    6: 25, 7: 25, 8: 25, 9: 25, 10: 25,
    11: 20, 12: 20, 13: 20, 14: 20, 15: 20,
    16: 15, 17: 15, 18: 15, 19: 15, 20: 15,
    21: 15, 22: 15, 23: 15, 24: 15, 25: 15,
    26: 12, 27: 12, 28: 12, 29: 12, 30: 12,
    31: 10, 32: 10, 33: 10, 34: 10, 35: 10,
    36: 10, 37: 10, 38: 10, 39: 10, 40: 10,
    41: 8, 42: 8, 43: 8, 44: 8, 45: 8,
    46: 8, 47: 8, 48: 8, 49: 8, 50: 8
};

function rand(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randRange(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; }

// Level mapping for min_level field
const DIFFICULTY_LEVEL_MAP = {
    "novice": {"min_level": 1, "max_level": 5},
    "intermediate": {"min_level": 6, "max_level": 12},
    "advanced": {"min_level": 13, "max_level": 20},
    "master": {"min_level": 21, "max_level": 30},
    "expert": {"min_level": 31, "max_level": 99}
};

const RU_EN = {
    "Построй форму": "Build form", "Создай чистый": "Create clean", "Залей базовыми": "Fill with base", 
    "Передай объём": "Convey volume", "Используй цифровую": "Use digital", "Сделай оверлей": "Make overlay",
    "Используй мягкие": "Use soft brushes", "Примени blend modes": "Apply blend modes",
    "Добавь текстуры": "Add textures", "Быстрый рендер": "Quick render", "Скорректируй палитру": "Adjust palette",
    "Покажи 3 разных": "Show 3 different", "Без референса": "Without reference",
    "Профессиональный рендер": "Professional render", "Цифровая живопись": "Digital painting",
    "Передай удалённость": "Convey distance", "Адаптируй реализм": "Adapt realism",
    "Как свет создаёт": "How light creates", "Финальная работа": "Final work",
    "По ТЗ": "To spec", "Создание вариантов": "Creating variations",
    "Кинематографичное освещение": "Cinematic lighting", "Подготовка к печати": "Print preparation",
    "Быстрые жесты": "Quick gestures", "Построй сетку": "Build grid",
    "Замени сложные формы": "Replace complex forms", "Нарисуй кисть": "Draw hand",
    "Отметь ключевые точки": "Mark key points", "Изучи форму": "Study form",
    "Покажи основные мышцы": "Show main muscles", "Передай баланс": "Convey balance",
    "Создай sheet": "Create sheet", "Чтение форм": "Reading forms",
    "Работа с формой": "Work with form", "Синтез жеста": "Gesture synthesis",
    "Сильное перспективное": "Strong perspective", "Упрощенная анатомия": "Simplified anatomy",
    "Центр тяжести": "Center of gravity", "Перекрытие конечностей": "Limb overlap",
    "Адаптация пропорций": "Proportion adaptation", "Передача намерения": "Conveying intention",
    "Точное отображение": "Accurate representation", "Упрощение анатомии": "Anatomy simplification",
    "Единые пропорции": "Consistent proportions", "Подготовка листа": "Sheet preparation",
    "Конструирование биомеханики": "Biomechanics construction", "Разбор классических": "Classic analysis",
    "Полный пак для студии": "Full studio package", "Анатомия в действии": "Anatomy in action",
    "Работа по ТЗ студии": "Work to studio brief", "Интеграция навыков": "Skills integration",
    "Анимируй отскок": "Animate bounce", "Примени принцип": "Apply principle",
    "Плавность траекторий": "Trajectory smoothness", "Имитация инерции": "Inertia simulation",
    "Бесшовный цикл": "Seamless cycle", "Ключевых кадров": "Key frames",
    "Полный цикл ходьбы": "Full walk cycle", "Динамика": "Dynamics",
    "Задержка относительно": "Delay relative to", "Как масса влияет": "How mass affects",
    "Подготовка зрителя": "Audience preparation", "Синхронизация губ": "Lip synchronization",
    "Поглощение удара": "Impact absorption", "Как тело влияет": "How body affects",
    "Передача намерения": "Intent transmission", "Синхронизация движения": "Movement sync",
    "Нестандартная биомеханика": "Non-standard biomechanics", "Тонкая настройка": "Fine tuning",
    "Синхронизация анимации": "Animation sync", "Распределение фокуса": "Focus distribution",
    "Преувеличение физики": "Physics exaggeration", "Тестирование тайминга": "Timing test",
    "Чистота линий": "Line cleanliness", "Соответствие стандартам": "Standards compliance",
    "Адаптация под реал-тайм": "Real-time adaptation", "Усиление читаемости": "Readability enhancement",
    "Тайминг энергии": "Energy timing", "Композиция камеры": "Camera composition",
    "Интеграция всех навыков": "All skills integration", "От скетча до финала": "From sketch to final"
};

function translateToEn(text) {
    let result = text;
    for (const [ru, en] of Object.entries(RU_EN)) {
        result = result.replace(new RegExp(ru, 'g'), en);
    }
    return result;
}

function generateQuest(globalId) {
    const level = randRange(1, 50);
    const difficulty = DIFFICULTY_MAP[level];
    const categories = CATEGORIES_PER_LEVEL[difficulty];
    
    // Storytelling locked until level 15
    const availableCategories = categories.filter(c => {
        if (c === "Storytelling" && level < 15) return false;
        return true;
    });
    
    const category = rand(availableCategories);
    const meta = CATEGORY_META[category];
    
    // Get exercise template
    const exerciseTemplates = EXERCISE_POOLS[category][difficulty];
    const template = rand(exerciseTemplates);
    const subject = rand(SUBJECTS[category]);
    
    const title = template.t.replace("{}", subject);
    const description = template.d;
    
    // XP and time with ±10% randomization
    const baseXp = XP_MAP[difficulty];
    const baseTime = TIME_MAP[difficulty];
    const xp = Math.floor(baseXp * (0.9 + Math.random() * 0.2));
    const time = randRange(
        Math.floor(baseTime[0] * 0.9),
        Math.ceil(baseTime[1] * 1.1)
    );
    
    // Tags from template
    const tags = [...template.tags, difficulty, category.toLowerCase(), "digital"];
    
    const levelInfo = DIFFICULTY_LEVEL_MAP[difficulty];
    
    return {
        id: globalId,
        code: `${meta['code']}-${String(globalId).padStart(5, '0')}`,
        title: { "ru": title, "en": translateToEn(title) },
        category: category.toLowerCase(),
        difficulty: difficulty,
        description: { "ru": description, "en": translateToEn(description) },
        xp: xp,
        estimatedTime: time,
        source: rand(SOURCES[category]),
        icon: meta.icon,
        color: meta.color,
        min_level: levelInfo.min_level,
        tags: tags,
        prerequisites: [],
        medium: "digital",
        is_repeatable: difficulty === "expert",
        review_after_days: difficulty === "advanced" ? 7 : (difficulty === "master" || difficulty === "expert" ? 14 : 0),
        streak_bonus: difficulty === "master" || difficulty === "expert" ? 1.2 : 1.0
    };
}

// Generate quests
const quests = [];
let globalId = 1;

for (const [level, count] of Object.entries(LEVEL_DISTRIBUTION)) {
    for (let i = 0; i < count; i++) {
        quests.push(generateQuest(globalId));
        globalId++;
    }
}

fs.writeFileSync('src/renderer/src/data/quests.json', JSON.stringify(quests, null, 2), 'utf8');

console.log(`✅ Сгенерировано ${quests.length} квестов!`);

const counts = { novice: 0, intermediate: 0, advanced: 0, master: 0, expert: 0 };
quests.forEach(q => counts[q.difficulty]++);
console.log(`📊 novice=${counts.novice}, intermediate=${counts.intermediate}, advanced=${counts.advanced}, master=${counts.master}, expert=${counts.expert}`);