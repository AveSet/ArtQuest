import type { QuestCategory } from '@/data/skillTree'

export type ComplexityCue = {
  re: RegExp
  weight: number
  categories?: QuestCategory[]
  /** Short label for “program understands you” hints */
  hint?: { ru: string; en: string }
}

/** Catalog title prefixes (RU + EN) — strong alignment with built-in quest naming. */
export const TITLE_TEMPLATE_CUES: ComplexityCue[] = [
  // Drawing / fundamentals
  { re: /(силуэт|silhouette)/i, weight: 3, categories: ['drawing', 'character_design'], hint: { ru: 'силуэт', en: 'silhouette' } },
  { re: /(перспектив|perspective|foreshortening|ракурс)/i, weight: 4, categories: ['drawing', 'environment'], hint: { ru: 'перспектива', en: 'perspective' } },
  { re: /(композици|composition|кадрирован|framing)/i, weight: 4, hint: { ru: 'композиция', en: 'composition' } },
  { re: /(тоновый|value study|светотень|chiaroscuro)/i, weight: 3, categories: ['drawing'], hint: { ru: 'светотень', en: 'value study' } },
  { re: /(линейный|line drawing|контур|contour)/i, weight: 2, categories: ['drawing'], hint: { ru: 'линейный рисунок', en: 'line drawing' } },
  { re: /(плоская заливка|flat fill|заливк)/i, weight: 2, categories: ['drawing'], hint: { ru: 'заливка', en: 'flat fill' } },
  { re: /(язык форм|shape language)/i, weight: 4, categories: ['drawing', 'character_design'], hint: { ru: 'язык форм', en: 'shape language' } },
  { re: /(копия референса|reference copy)/i, weight: 2, hint: { ru: 'копия референса', en: 'reference copy' } },

  // Anatomy
  { re: /(пропорци|proportions|пропорции)/i, weight: 4, categories: ['anatomy', 'character_design'], hint: { ru: 'пропорции', en: 'proportions' } },
  { re: /(мимик|facial expressions|expression sheet)/i, weight: 4, categories: ['anatomy', 'animation'], hint: { ru: 'мимика', en: 'expressions' } },
  { re: /(пантомим|pantomime|acting)/i, weight: 4, categories: ['anatomy', 'animation', 'storytelling'], hint: { ru: 'актёрская пластика', en: 'acting' } },
  { re: /(мышц|muscle|скелет|skeleton|кости|bones)/i, weight: 4, categories: ['anatomy'], hint: { ru: 'анатомия', en: 'anatomy' } },
  { re: /(рук|hands|кист|ладон)/i, weight: 3, categories: ['anatomy'], hint: { ru: 'руки', en: 'hands' } },
  { re: /(ног|feet|стоп|foot)/i, weight: 3, categories: ['anatomy'], hint: { ru: 'стопы', en: 'feet' } },

  // Animation
  { re: /(цикл ходьбы|walk cycle|ходьб)/i, weight: 5, categories: ['animation'], hint: { ru: 'цикл ходьбы', en: 'walk cycle' } },
  { re: /(цикл бега|run cycle|бег)/i, weight: 5, categories: ['animation'], hint: { ru: 'цикл бега', en: 'run cycle' } },
  { re: /(антиципац|anticipation|овершут|overshoot|follow[- ]?through|отскок|bounce)/i, weight: 4, categories: ['animation'], hint: { ru: 'принципы анимации', en: 'animation principles' } },
  { re: /(диалоговая сцена|dialogue scene)/i, weight: 6, categories: ['animation', 'storytelling'], hint: { ru: 'диалоговая сцена', en: 'dialogue scene' } },
  { re: /(многоперсонаж|multi[- ]?character|multi[- ]?layer breakdown)/i, weight: 6, categories: ['animation'], hint: { ru: 'несколько персонажей', en: 'multi-character' } },
  { re: /(раскадров|storyboard|аниматик|animatic)/i, weight: 4, categories: ['animation', 'storytelling'], hint: { ru: 'раскадровка', en: 'storyboard' } },

  // Effects
  { re: /(частиц|particle|vfx|визуальн.*эффект)/i, weight: 4, categories: ['effects'], hint: { ru: 'частицы / VFX', en: 'particles / VFX' } },
  { re: /(шейдер|shader|material|материал)/i, weight: 5, categories: ['effects'], hint: { ru: 'шейдеры', en: 'shaders' } },
  { re: /(симуляц|simulation|физик|physics|fluid|жидкост)/i, weight: 5, categories: ['effects'], hint: { ru: 'симуляция', en: 'simulation' } },
  { re: /(композитинг|compositing|слои|layers)/i, weight: 4, categories: ['effects', 'environment'], hint: { ru: 'композитинг', en: 'compositing' } },

  // Storytelling
  { re: /(визуальн.*метафор|visual metaphors)/i, weight: 4, categories: ['storytelling'], hint: { ru: 'визуальные метафоры', en: 'visual metaphors' } },
  { re: /(режиссёрск|director.?s shot|планирование кадра)/i, weight: 5, categories: ['storytelling'], hint: { ru: 'режиссура кадра', en: 'shot planning' } },
  { re: /(подтекст|subtext|нарратив|narrative)/i, weight: 4, categories: ['storytelling'], hint: { ru: 'нарратив', en: 'narrative' } },
  { re: /(комикс|comic|панел|panel)/i, weight: 3, categories: ['storytelling'], hint: { ru: 'комикс / панели', en: 'comic panels' } },

  // Character design
  { re: /(разворот|turnaround|model sheet|лист модели)/i, weight: 5, categories: ['character_design'], hint: { ru: 'разворот персонажа', en: 'turnaround' } },
  { re: /(дизайн костюма|costume design|костюм|outfit)/i, weight: 4, categories: ['character_design'], hint: { ru: 'костюм', en: 'costume' } },
  { re: /(существо|creature|механик|mechanical design)/i, weight: 5, categories: ['character_design'], hint: { ru: 'дизайн существа', en: 'creature design' } },
  { re: /(вариации возраста|age.*body|телосложен)/i, weight: 4, categories: ['character_design', 'anatomy'], hint: { ru: 'вариации тела', en: 'body variations' } },

  // Environment
  { re: /(матовая живопись|matte painting)/i, weight: 6, categories: ['environment'], hint: { ru: 'matte painting', en: 'matte painting' } },
  { re: /(архитектур|architecture|здани|building)/i, weight: 4, categories: ['environment'], hint: { ru: 'архитектура', en: 'architecture' } },
  { re: /(интерьер|interior|природ|nature scene|пейзаж|landscape)/i, weight: 4, categories: ['environment'], hint: { ru: 'окружение', en: 'environment' } },
  { re: /(освещени|lighting|атмосфер|atmosphere)/i, weight: 4, categories: ['environment', 'drawing'], hint: { ru: 'освещение / атмосфера', en: 'lighting / mood' } },
  { re: /(предмет|prop design|реквизит|props)/i, weight: 3, categories: ['environment'], hint: { ru: 'реквизит', en: 'props' } },

  // Production tier (catalog tags)
  { re: /(производственн|production brief|industry brief|бриф|brief)/i, weight: 5, hint: { ru: 'продакшн-бриф', en: 'production brief' } },
  { re: /(портфолио|portfolio|showreel|демо[- ]?ролик)/i, weight: 5, hint: { ru: 'портфолио', en: 'portfolio' } },
  { re: /(готов.*к игре|game[- ]?ready|pipeline|пайплайн)/i, weight: 6, hint: { ru: 'game-ready', en: 'game-ready' } },
  { re: /(24\s*h|24ч|челлендж|challenge)/i, weight: 5, hint: { ru: 'челлендж', en: 'challenge' } },
]

/** Tag-like concepts inferred from wording (mirrors catalog tags). */
export const TAG_SEMANTIC_CUES: ComplexityCue[] = [
  { re: /(master|мастер|экспертн.*уровень)/i, weight: 5, hint: { ru: 'уровень master', en: 'master tier' } },
  { re: /(expert|эксперт)/i, weight: 4, hint: { ru: 'уровень expert', en: 'expert tier' } },
  { re: /(advanced|продвинут|сложн)/i, weight: 3, hint: { ru: 'продвинутый уровень', en: 'advanced' } },
  { re: /(industry|индустри|студийн|studio)/i, weight: 4, hint: { ru: 'индустриальный уровень', en: 'industry' } },
  { re: /(portfolio|портфолио)/i, weight: 4, hint: { ru: 'портфолио', en: 'portfolio' } },
  { re: /(production|производств)/i, weight: 4, hint: { ru: 'продакшн', en: 'production' } },
  { re: /(detail|детализац|детальн)/i, weight: 3, hint: { ru: 'детализация', en: 'detail' } },
  { re: /(speed|скоростн|быстр.*скетч)/i, weight: -1, hint: { ru: 'скорость', en: 'speed study' } },
  { re: /(study|этюд|studies|упражнен)/i, weight: -1, hint: { ru: 'учебный этюд', en: 'study' } },
  { re: /(basics|основы|fundamentals|базов)/i, weight: -2, hint: { ru: 'основы', en: 'basics' } },
  { re: /(novice|нович|beginner|intro|введен)/i, weight: -3, hint: { ru: 'для новичков', en: 'beginner' } },
  { re: /(traditional|традиционн|бумаг|paper)/i, weight: 0, hint: { ru: 'традиционная техника', en: 'traditional' } },
  { re: /(stylization|стилизац)/i, weight: 2, hint: { ru: 'стилизация', en: 'stylization' } },
  { re: /(mood|настроени|атмосфер)/i, weight: 2, hint: { ru: 'настроение', en: 'mood' } },
  { re: /(both|двусторон|two[- ]?sided)/i, weight: 1 },
]

/** Global workload cues (any category). */
export const GLOBAL_COMPLEXITY_CUES: ComplexityCue[] = [
  { re: /(двух|двое|двумя|троих|четвер|нескольк|пара\b|couple|two\s+people|multi[- ]?character|многоперсонаж)/i, weight: 5, hint: { ru: 'несколько персонажей', en: 'multiple characters' } },
  { re: /(взаимодейств|interaction|диалог|dialogue|сцена|scene|постановк|blocking)/i, weight: 4, hint: { ru: 'взаимодействие', en: 'interaction' } },
  { re: /(люд[иейя]|people|persons|персонаж|characters|фигур|figures|геро)/i, weight: 3, hint: { ru: 'персонажи', en: 'characters' } },
  { re: /(танец|танц|dance|хореограф|choreograph)/i, weight: 5, categories: ['animation'], hint: { ru: 'танец', en: 'dance' } },
  { re: /(боев|fight|combat|схватк|duel|битв|melee)/i, weight: 5, hint: { ru: 'боёвка', en: 'combat' } },
  { re: /(акробат|acrobatic|прыжк|jump|flip|переворот|parkour)/i, weight: 4, categories: ['animation'], hint: { ru: 'акробатика', en: 'acrobatics' } },
  { re: /(эмоци|emotion|подтекст|subtext)/i, weight: 3, hint: { ru: 'эмоции', en: 'emotion' } },
  { re: /(анимир|animate|animation|полный|full\s+cycle|цикл|cycle)/i, weight: 3, categories: ['animation'], hint: { ru: 'анимация', en: 'animation' } },
  { re: /(кинематограф|cinematic|камера|camera|движени.*камер)/i, weight: 4, hint: { ru: 'кинематография', en: 'cinematic' } },
  { re: /(финал|final|polish|полировк|рендер|render)/i, weight: 4, hint: { ru: 'финальная полировка', en: 'final polish' } },
  { re: /(сложн|complex|детальн|detailed|гипер|hyper)/i, weight: 4, hint: { ru: 'высокая сложность', en: 'high complexity' } },
  { re: /(реалист|realistic|фотореал|photoreal)/i, weight: 3, hint: { ru: 'реализм', en: 'realism' } },
  { re: /(стилиз|stylized|cartoon|мультяш)/i, weight: 1 },
  { re: /(нарисовать|рисовать|создать|сделать|draw|paint|animate|анимир|смоделир|design|скульпт)/i, weight: 2, hint: { ru: 'творческая задача', en: 'creative brief' } },
  { re: /(простой|simple|быстр|quick|разминк|warm[- ]?up)/i, weight: -3, hint: { ru: 'простая задача', en: 'simple task' } },
  { re: /(набросок|sketch|эскиз|doodle|один\s+кадр|single\s+frame|thumbnail)/i, weight: -2, hint: { ru: 'набросок', en: 'sketch' } },
  { re: /(повтор|repeat|копир|copy|тренировк|drill)/i, weight: -1 },
  { re: /(оптимизац|optimiz|лоу[- ]?поли|low\s*poly|uv|текстур|texture\s+atlas)/i, weight: 4, hint: { ru: 'технический пайплайн', en: 'technical pipeline' } },
]

export const CATEGORY_COMPLEXITY_CUES: Record<QuestCategory, ComplexityCue[]> = {
  drawing: [
    { re: /(куб|cube|цилиндр|cylinder|геометр)/i, weight: 2, hint: { ru: 'форма', en: 'form' } },
    { re: /(цвет|color|палитр|palette)/i, weight: 2, hint: { ru: 'цвет', en: 'color' } },
    { re: /(цифр|digital|photoshop|krita|procreate|clip\s*studio)/i, weight: 1 },
    { re: /(воображен|imagination|from\s+imagination)/i, weight: 3, hint: { ru: 'из воображения', en: 'from imagination' } },
    { re: /(экстремальн|extreme|foreshortening)/i, weight: 4, hint: { ru: 'экстремальная перспектива', en: 'foreshortening' } },
  ],
  anatomy: [
    { re: /(динамичн|dynamic\s+pose|action\s+pose)/i, weight: 3, hint: { ru: 'динамичная поза', en: 'dynamic pose' } },
    { re: /(стоя|сидя|лежа|standing|sitting|lying)/i, weight: 1 },
    { re: /(торс|torso|плеч|shoulder|таз|pelvis)/i, weight: 2 },
    { re: /(сравнен|comparison|turnaround\s+study)/i, weight: 3 },
  ],
  animation: [
    { re: /(тайминг|timing|спейсинг|spacing|ease|easing)/i, weight: 3, hint: { ru: 'тайминг', en: 'timing' } },
    { re: /(лип\s*синк|lip\s*sync|фонет|phoneme)/i, weight: 5, hint: { ru: 'липсинк', en: 'lip sync' } },
    { re: /(idle|ожидани|стояние\s+на\s+месте)/i, weight: 2 },
    { re: /(атак|attack|удар|strike|combo)/i, weight: 4, hint: { ru: 'боевое движение', en: 'attack animation' } },
    { re: /(переход|transition|blend|смешиван)/i, weight: 3, hint: { ru: 'переходы', en: 'transitions' } },
    { re: /(2d|3d|rig|риг|скелет\s+анимац)/i, weight: 3 },
  ],
  effects: [
    { re: /(маг|magic|заклин|spell|аура|aura)/i, weight: 3, hint: { ru: 'магия', en: 'magic' } },
    { re: /(огн|fire|пламя|flame|дым|smoke)/i, weight: 3, hint: { ru: 'огонь / дым', en: 'fire / smoke' } },
    { re: /(взрыв|explosion|удар|impact|shockwave)/i, weight: 4, hint: { ru: 'взрыв', en: 'explosion' } },
    { re: /(погод|weather|дожд|rain|снег|snow|ветер|wind)/i, weight: 3, hint: { ru: 'погода', en: 'weather' } },
    { re: /(электр|electric|молн|lightning|энерг)/i, weight: 3, hint: { ru: 'энергия', en: 'energy' } },
    { re: /(разрушен|destruction|фрагмент|debris)/i, weight: 4 },
  ],
  storytelling: [
    { re: /(истори|story|сюжет|plot)/i, weight: 3, hint: { ru: 'история', en: 'story' } },
    { re: /(последовательност|sequence|beat|ритм|pacing)/i, weight: 3, hint: { ru: 'ритм', en: 'pacing' } },
    { re: /(контраст|contrast|фокус|focus)/i, weight: 2 },
    { re: /(тип\s+кадра|shot\s+type|close[- ]?up|wide\s+shot)/i, weight: 3, hint: { ru: 'тип кадра', en: 'shot type' } },
  ],
  character_design: [
    { re: /(личност|personality|характер|character\s+trait)/i, weight: 3, hint: { ru: 'характер', en: 'personality' } },
    { re: /(разнообраз|variety|вариант|variants)/i, weight: 3 },
    { re: /(фэнтез|fantasy|sci[- ]?fi|научн.*фантаст)/i, weight: 2 },
    { re: /(оружи|weapon|аксессуар|accessories)/i, weight: 2 },
  ],
  environment: [
    { re: /(город|city|улиц|street|urban)/i, weight: 3, hint: { ru: 'город', en: 'urban' } },
    { re: /(лес|forest|джунгл|jungle|скал|rock)/i, weight: 3 },
    { re: /(вода|water|река|river|океан|ocean)/i, weight: 3 },
    { re: /(день|ночь|day|night|закат|sunset)/i, weight: 2 },
    { re: /(масштаб|scale|панорам|panorama)/i, weight: 3, hint: { ru: 'масштаб сцены', en: 'scene scale' } },
  ],
}

/** All cues in evaluation order. */
export function allComplexityCues(category: QuestCategory): ComplexityCue[] {
  return [
    ...TITLE_TEMPLATE_CUES,
    ...TAG_SEMANTIC_CUES,
    ...GLOBAL_COMPLEXITY_CUES,
    ...(CATEGORY_COMPLEXITY_CUES[category] ?? []),
  ]
}
