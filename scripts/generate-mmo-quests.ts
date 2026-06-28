/**
 * Append MMO-style volume/diversity quests to category JSON files.
 * Idempotent: skips if id 9701 already exists.
 *
 * Usage: npx tsx scripts/generate-mmo-quests.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '../src/renderer/data')

type Category =
  | 'drawing'
  | 'anatomy'
  | 'animation'
  | 'effects'
  | 'storytelling'
  | 'character_design'
  | 'environment'

type Difficulty = 'novice' | 'intermediate' | 'advanced' | 'master' | 'expert'
type Medium = 'traditional' | 'digital' | 'both'

interface QuestDraft {
  id: number
  category: Category
  difficulty: Difficulty
  title: { en: string; ru: string }
  description: { en: string; ru: string }
  xp: number
  estimatedTime: number
  min_level: number
  tags: string[]
  medium: Medium
  is_repeatable: boolean
  review_after_days: number
  source?: string
}

const CAT_META: Record<
  Category,
  { code: string; icon: string; color: string; file: string; source: string }
> = {
  drawing: { code: 'DRW', icon: '🎨', color: '#6366f1', file: 'quests_drawing.json', source: 'ArtQuest Drills' },
  anatomy: { code: 'ANA', icon: '🦴', color: '#ec4899', file: 'quests_anatomy.json', source: 'Proko / Hampton' },
  animation: { code: 'ANM', icon: '🎬', color: '#10b981', file: 'quests_animation.json', source: '12 Principles' },
  effects: { code: 'VFX', icon: '✨', color: '#f59e0b', file: 'quests_effects.json', source: 'Elemental Magic' },
  storytelling: { code: 'STY', icon: '📖', color: '#8b5cf6', file: 'quests_storytelling.json', source: 'Storytelling for Artists' },
  character_design: { code: 'CDN', icon: '🎭', color: '#06b6d4', file: 'quests_character_design.json', source: 'Character Design Tips' },
  environment: { code: 'ENV', icon: '🏞️', color: '#84cc16', file: 'quests_environment.json', source: 'FZD / Plein Air' },
}

const DRAFTS: QuestDraft[] = [
  // —— Drawing: volume & form drills ——
  {
    id: 9701, category: 'drawing', difficulty: 'novice',
    title: { en: '50 Cylinders in Different Perspectives', ru: '50 цилиндров в разной перспективе' },
    description: {
      en: 'Draw 50 cylinders on one or two pages. Vary tilt, foreshortening, and vanishing points. Label 5 favorites.',
      ru: 'Нарисуйте 50 цилиндров на одной-двух страницах. Меняйте наклон, сокращение и точки схода. Отметьте 5 лучших.',
    },
    xp: 72, estimatedTime: 55, min_level: 1,
    tags: ['volume', 'perspective', 'quantity', 'cylinder', 'drawing', 'traditional'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9702, category: 'drawing', difficulty: 'novice',
    title: { en: '30 Rotating Cubes', ru: '30 повёрнутых кубов' },
    description: {
      en: 'Sketch 30 cubes at different rotations. Use light construction lines; keep each under 2 minutes.',
      ru: 'Набросайте 30 кубов под разными углами. Лёгкие построительные линии; на каждый — до 2 минут.',
    },
    xp: 58, estimatedTime: 45, min_level: 1,
    tags: ['form', 'construction', 'quantity', 'cube', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9703, category: 'drawing', difficulty: 'novice',
    title: { en: '100 Gesture Lines Warmup', ru: '100 жестовых линий — разминка' },
    description: {
      en: 'Fill a page with 100 loose gesture strokes (figures, objects, or abstract). No erasing — speed over polish.',
      ru: 'Заполните страницу 100 свободными жестовыми штрихами (фигуры, предметы или абстракция). Без ластика — скорость важнее.',
    },
    xp: 45, estimatedTime: 20, min_level: 1,
    tags: ['gesture', 'warmup', 'quantity', 'line', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 0,
  },
  {
    id: 9704, category: 'drawing', difficulty: 'novice',
    title: { en: '20 Ellipses at Different Angles', ru: '20 эллипсов под разными углами' },
    description: {
      en: 'Draw 20 ellipses representing circles in space — top, side, steep tilt. Aim for smooth, closed shapes.',
      ru: 'Нарисуйте 20 эллипсов — круги в пространстве: сверху, сбоку, сильный наклон. Плавные замкнутые формы.',
    },
    xp: 50, estimatedTime: 25, min_level: 1,
    tags: ['ellipse', 'perspective', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9705, category: 'drawing', difficulty: 'intermediate',
    title: { en: '15 Coffee Cups from Life', ru: '15 чашек с натуры' },
    description: {
      en: 'Draw 15 coffee mugs or cups from observation. Change angle every 2–3 drawings. Note handle ellipse.',
      ru: 'Нарисуйте 15 чашек с натуры. Меняйте ракурс каждые 2–3 рисунка. Обратите внимание на эллипс ручки.',
    },
    xp: 88, estimatedTime: 50, min_level: 4,
    tags: ['observation', 'still-life', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9706, category: 'drawing', difficulty: 'intermediate',
    title: { en: '25 Hand Thumbnails', ru: '25 эскизов рук' },
    description: {
      en: 'Draw 25 small hand studies (your own or reference). Focus on finger grouping and wrist angle.',
      ru: '25 мини-эскизов рук (свои или по референсу). Группировка пальцев и угол запястья.',
    },
    xp: 95, estimatedTime: 55, min_level: 5,
    tags: ['hands', 'anatomy', 'quantity', 'thumbnail', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9707, category: 'drawing', difficulty: 'intermediate',
    title: { en: '40 Sphere Value Studies', ru: '40 тоновых сфер' },
    description: {
      en: 'Shade 40 spheres with a single light source. Vary size and contrast; keep highlight placement consistent.',
      ru: '40 тоновых сфер с одним источником света. Разный размер и контраст; блик на одном месте.',
    },
    xp: 92, estimatedTime: 60, min_level: 5,
    tags: ['value', 'shading', 'quantity', 'form', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9708, category: 'drawing', difficulty: 'novice',
    title: { en: '10 Still-Life Objects on One Page', ru: '10 предметов натюрморта на одной странице' },
    description: {
      en: 'Arrange and draw 10 small household objects on one sheet. Simple outlines + one shadow direction.',
      ru: '10 мелких предметов на одном листе. Простой контур + одно направление тени.',
    },
    xp: 55, estimatedTime: 30, min_level: 1,
    tags: ['still-life', 'observation', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9709, category: 'drawing', difficulty: 'novice',
    title: { en: '20 Shaded Cones', ru: '20 тоновых конусов' },
    description: {
      en: 'Draw 20 cones with core shadow and cast shadow. Mix steep and shallow angles.',
      ru: '20 конусов с собственной и падающей тенью. Крутые и пологие углы.',
    },
    xp: 60, estimatedTime: 35, min_level: 2,
    tags: ['form', 'shading', 'quantity', 'cone', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9710, category: 'drawing', difficulty: 'intermediate',
    title: { en: '50 Boxes in Two-Point Perspective', ru: '50 коробок в двухточечной перспективе' },
    description: {
      en: 'Draw 50 boxes floating at different heights and rotations in 2-point perspective. Light construction only.',
      ru: '50 коробок на разной высоте и повороте в двухточечной перспективе. Лёгкие построения.',
    },
    xp: 85, estimatedTime: 50, min_level: 4,
    tags: ['perspective', 'box', 'quantity', 'construction', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9711, category: 'drawing', difficulty: 'novice',
    title: { en: 'Page of 100 Circles', ru: 'Страница из 100 кругов' },
    description: {
      en: 'Fill one page with 100 circles freehand. Track how roundness improves from top-left to bottom-right.',
      ru: 'Страница из 100 кругов от руки. Заметьте, как округлость улучшается по листу.',
    },
    xp: 40, estimatedTime: 15, min_level: 1,
    tags: ['warmup', 'line-control', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 0,
  },
  {
    id: 9712, category: 'drawing', difficulty: 'intermediate',
    title: { en: '12 Everyday Object Silhouettes', ru: '12 силуэтов бытовых предметов' },
    description: {
      en: 'Draw 12 black silhouettes of tools, utensils, or gadgets. Readable shape at thumbnail size.',
      ru: '12 чёрных силуэтов инструментов или гаджетов. Читаемая форма в миниатюре.',
    },
    xp: 78, estimatedTime: 40, min_level: 4,
    tags: ['silhouette', 'design', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9713, category: 'drawing', difficulty: 'advanced',
    title: { en: '24 Head Angles Block-In', ru: '24 ракурса головы — блокинг' },
    description: {
      en: 'Block in 24 head rotations using Loomis or box method. No details — plane breaks only.',
      ru: '24 поворота головы методом Loomis или коробки. Без деталей — только плоскости.',
    },
    xp: 130, estimatedTime: 70, min_level: 10,
    tags: ['head', 'construction', 'quantity', 'advanced', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9714, category: 'drawing', difficulty: 'novice',
    title: { en: '50 Pencil Pressure Strokes', ru: '50 штрихов с разным нажимом' },
    description: {
      en: 'Practice 50 strokes from hairline to heavy pressure on one strip. Keep direction consistent.',
      ru: '50 штрихов от еле видимого до сильного нажима. Одно направление.',
    },
    xp: 42, estimatedTime: 15, min_level: 1,
    tags: ['line-control', 'warmup', 'quantity', 'drawing'],
    medium: 'traditional', is_repeatable: true, review_after_days: 0,
  },
  {
    id: 9715, category: 'drawing', difficulty: 'advanced',
    title: { en: '20 Folded Fabric Studies', ru: '20 зарисовок складок ткани' },
    description: {
      en: 'Draw 20 fabric folds from reference or draped cloth. Focus on tension vs compression.',
      ru: '20 складок ткани по референсу или с натуры. Натяжение vs сжатие.',
    },
    xp: 140, estimatedTime: 75, min_level: 11,
    tags: ['fabric', 'form', 'quantity', 'advanced', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9716, category: 'drawing', difficulty: 'intermediate',
    title: { en: '30 Kitchen Utensil Drawings', ru: '30 зарисовок кухонных предметов' },
    description: {
      en: 'Draw 30 spoons, knives, peelers, or jars. Mix contour and simple value.',
      ru: '30 ложек, ножей, овощечисток или банок. Контур и простой тон.',
    },
    xp: 82, estimatedTime: 45, min_level: 4,
    tags: ['observation', 'still-life', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9717, category: 'drawing', difficulty: 'intermediate',
    title: { en: '15 Bottle Shape Variations', ru: '15 вариаций формы бутылки' },
    description: {
      en: 'Design and draw 15 bottle silhouettes — slim, wide, square, organic. One light source each.',
      ru: '15 силуэтов бутылок — узкие, широкие, квадратные, органические. Один источник света.',
    },
    xp: 80, estimatedTime: 42, min_level: 4,
    tags: ['design', 'form', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9718, category: 'drawing', difficulty: 'novice',
    title: { en: '20 Organic Blob Shadows', ru: '20 органических пятен с тенью' },
    description: {
      en: 'Draw 20 random organic blobs and add one cast shadow each. Experiment with light direction.',
      ru: '20 органических пятен с одной падающей тенью. Экспериментируйте с направлением света.',
    },
    xp: 52, estimatedTime: 28, min_level: 1,
    tags: ['form', 'shading', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9719, category: 'drawing', difficulty: 'intermediate',
    title: { en: '30 Cross-Contour Lines', ru: '30 линий перекрёстного контура' },
    description: {
      en: 'On 30 simple forms (fruit, limbs, props), wrap cross-contour lines to show volume.',
      ru: 'На 30 простых формах (фрукты, конечности, реквизит) — линии перекрёстного контура для объёма.',
    },
    xp: 75, estimatedTime: 38, min_level: 5,
    tags: ['contour', 'form', 'quantity', 'drawing'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9720, category: 'drawing', difficulty: 'master',
    title: { en: 'Portfolio Spread: 12 Form Studies', ru: 'Разворот портфолио: 12 формовых этюдов' },
    description: {
      en: 'Layout one portfolio page with 12 polished form studies (any mix of primitives). Unified lighting.',
      ru: 'Разворот портфолио: 12 отполированных формовых этюдов (примитивы на выбор). Единое освещение.',
    },
    xp: 220, estimatedTime: 120, min_level: 18,
    tags: ['portfolio', 'polish', 'form', 'master', 'drawing'],
    medium: 'both', is_repeatable: false, review_after_days: 30,
  },

  // —— Anatomy ——
  {
    id: 9801, category: 'anatomy', difficulty: 'intermediate',
    title: { en: 'Dog Hind Leg Muscles', ru: 'Мышцы задней ноги собаки' },
    description: {
      en: 'Draw a dog hind leg with simplified muscle groups labeled (gluteal, hamstring, gastrocnemius). Side and rear view.',
      ru: 'Задняя нога собаки с упрощёнными мышечными группами (ягодичные, бiceps бедра, икроножная). Вид сбоку и сзади.',
    },
    xp: 105, estimatedTime: 50, min_level: 5,
    tags: ['dog', 'muscles', 'legs', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9802, category: 'anatomy', difficulty: 'novice',
    title: { en: 'Cat Paw Structure', ru: 'Строение лапы кошки' },
    description: {
      en: 'Study and draw a cat paw — pads, toe bones, fur direction. Top and bottom view.',
      ru: 'Лапа кошки — подушечки, кости пальцев, направление шерсти. Вид сверху и снизу.',
    },
    xp: 58, estimatedTime: 30, min_level: 1,
    tags: ['cat', 'paw', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9803, category: 'anatomy', difficulty: 'advanced',
    title: { en: 'Horse Shoulder Muscles', ru: 'Мышцы плеча лошади' },
    description: {
      en: 'Draw horse shoulder and chest muscles in 3 angles. Show how mass wraps around scapula.',
      ru: 'Мышцы плеча и груди лошади в 3 ракурсах. Как масса обхватывает лопатку.',
    },
    xp: 155, estimatedTime: 65, min_level: 12,
    tags: ['horse', 'muscles', 'animal', 'advanced', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9804, category: 'anatomy', difficulty: 'intermediate',
    title: { en: 'Bird Wing Bone Structure', ru: 'Костная структура крыла птицы' },
    description: {
      en: 'Diagram a bird wing skeleton with feather groups mapped. Spread and folded positions.',
      ru: 'Скелет крыла птицы с группами перьев. Разложенное и сложенное положение.',
    },
    xp: 98, estimatedTime: 48, min_level: 6,
    tags: ['bird', 'wing', 'skeleton', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9805, category: 'anatomy', difficulty: 'intermediate',
    title: { en: 'Human Foot Bones Overlay', ru: 'Кости стопы человека — наложение' },
    description: {
      en: 'Draw a foot in 3 poses with simplified bone overlay on top. Note arch and toe spacing.',
      ru: 'Стопа в 3 позах с упрощённым скелетом поверх. Свод и расстояние между пальцами.',
    },
    xp: 90, estimatedTime: 45, min_level: 5,
    tags: ['foot', 'skeleton', 'human', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9806, category: 'anatomy', difficulty: 'intermediate',
    title: { en: '10 Skull Angles', ru: '10 ракурсов черепа' },
    description: {
      en: 'Draw the same skull from 10 different angles. Focus on proportions, not texture.',
      ru: 'Один череп в 10 ракурсах. Пропорции, без текстуры.',
    },
    xp: 95, estimatedTime: 55, min_level: 6,
    tags: ['skull', 'construction', 'quantity', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9807, category: 'anatomy', difficulty: 'intermediate',
    title: { en: 'Forearm Muscle Groups', ru: 'Мышечные группы предплечья' },
    description: {
      en: 'Draw flexed and relaxed forearm with extensor/flexor masses labeled. Pronation and supination.',
      ru: 'Предплечье в сгибе и расслаблении — разгибатели и сгибатели. Пронация и супинация.',
    },
    xp: 100, estimatedTime: 50, min_level: 6,
    tags: ['arm', 'muscles', 'human', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9808, category: 'anatomy', difficulty: 'advanced',
    title: { en: 'Torso Muscle Map', ru: 'Карта мышц торса' },
    description: {
      en: 'Front, side, and back torso with major muscle groups (pecs, lats, abs, traps). Simplified ecorche.',
      ru: 'Торс спереди, сбоку и сзади — основные группы (грудные, широчайшие, пресс, трапеции). Упрощённый экорше.',
    },
    xp: 160, estimatedTime: 70, min_level: 11,
    tags: ['torso', 'muscles', 'ecorche', 'advanced', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9809, category: 'anatomy', difficulty: 'novice',
    title: { en: 'Rabbit Ear Structure', ru: 'Строение уха кролика' },
    description: {
      en: 'Draw rabbit ears — cartilage flow, fur clumps, inside vs outside. Two ear positions.',
      ru: 'Уши кролика — хрящ, clumps шерсти, внутренняя и внешняя сторона. Два положения.',
    },
    xp: 55, estimatedTime: 28, min_level: 1,
    tags: ['rabbit', 'ears', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9810, category: 'anatomy', difficulty: 'novice',
    title: { en: 'Fish Fin Anatomy', ru: 'Анатомия плавника рыбы' },
    description: {
      en: 'Draw dorsal, caudal, and pectoral fins with ray structure. One species, three fin types.',
      ru: 'Спинной, хвостовой и грудной плавники с лучами. Один вид, три типа плавников.',
    },
    xp: 52, estimatedTime: 25, min_level: 1,
    tags: ['fish', 'fins', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9811, category: 'anatomy', difficulty: 'master',
    title: { en: 'Elephant Leg Mass Study', ru: 'Масса ноги слона' },
    description: {
      en: 'Full elephant leg with skin folds, tendon paths, and weight distribution. Front and side.',
      ru: 'Нога слона целиком — складки кожи, сухожилия, распределение веса. Спереди и сбоку.',
    },
    xp: 280, estimatedTime: 100, min_level: 20,
    tags: ['elephant', 'legs', 'animal', 'master', 'anatomy'],
    medium: 'both', is_repeatable: false, review_after_days: 30,
  },
  {
    id: 9812, category: 'anatomy', difficulty: 'intermediate',
    title: { en: '20 Eye Studies', ru: '20 этюдов глаза' },
    description: {
      en: 'Draw 20 eyes — human and animal mix. Include lid fold, tear duct, and iris plane.',
      ru: '20 глаз — люди и животные. Складка века, слёзный канал, плоскость радужки.',
    },
    xp: 88, estimatedTime: 50, min_level: 5,
    tags: ['eye', 'face', 'quantity', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9813, category: 'anatomy', difficulty: 'advanced',
    title: { en: 'Hand Tendons Overlay', ru: 'Сухожилия кисти — наложение' },
    description: {
      en: 'Draw an open hand with simplified tendon paths on top. Flat, fist, and pinching poses.',
      ru: 'Открытая кисть с упрощёнными сухожилиями. Плоская, кулак, щипок.',
    },
    xp: 145, estimatedTime: 60, min_level: 10,
    tags: ['hand', 'tendons', 'advanced', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9814, category: 'anatomy', difficulty: 'intermediate',
    title: { en: 'Dog Head Muscle Layer', ru: 'Мышечный слой головы собаки' },
    description: {
      en: 'Side view dog head — skull, then muscle layer, then fur mass. Label jaw and ear muscles.',
      ru: 'Голова собаки сбоку — череп, мышцы, масса шерсти. Челюстные и ушные мышцы.',
    },
    xp: 102, estimatedTime: 52, min_level: 6,
    tags: ['dog', 'head', 'muscles', 'animal', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9815, category: 'anatomy', difficulty: 'novice',
    title: { en: '15 Gesture Skeletons', ru: '15 жестовых скелетов' },
    description: {
      en: 'Draw 15 quick stick-figure skeletons from photo reference. 2 minutes each max.',
      ru: '15 быстрых скелетов по фото. Не более 2 минут на каждый.',
    },
    xp: 60, estimatedTime: 35, min_level: 1,
    tags: ['skeleton', 'gesture', 'quantity', 'anatomy'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },

  // —— Animation ——
  {
    id: 9901, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Two Balls Colliding', ru: 'Столкновение двух шаров' },
    description: {
      en: 'Animate two balls crashing into each other — approach, impact squash, rebound, settle. 24–36 frames loop or shot.',
      ru: 'Анимация столкновения двух шаров — сближение, squash при ударе, отскок, остановка. 24–36 кадров.',
    },
    xp: 110, estimatedTime: 55, min_level: 6,
    tags: ['physics', 'collision', 'squash-stretch', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9902, category: 'animation', difficulty: 'novice',
    title: { en: 'Bouncing Ball: 3 Heights', ru: 'Прыгающий мяч: 3 высоты' },
    description: {
      en: 'Animate one ball bouncing at low, medium, and high energy. Same timing chart, different spacing.',
      ru: 'Мяч прыгает с низкой, средней и высокой энергией. Один timing chart, разный spacing.',
    },
    xp: 65, estimatedTime: 35, min_level: 1,
    tags: ['bounce', 'timing', 'spacing', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9903, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Pendulum Swing Loop', ru: 'Цикл маятника' },
    description: {
      en: 'Create a seamless pendulum loop. Ease in/out at extremes; optional secondary object on string.',
      ru: 'Бесшовный цикл маятника. Ease на крайних точках; опционально — объект на нити.',
    },
    xp: 95, estimatedTime: 45, min_level: 5,
    tags: ['loop', 'timing', 'physics', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9904, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Flag Wave Cycle', ru: 'Цикл развевающегося флага' },
    description: {
      en: 'Loop a flag or banner waving in wind. Overlapping action on cloth edges.',
      ru: 'Цикл флага или баннера на ветру. Overlapping action на краях ткани.',
    },
    xp: 100, estimatedTime: 50, min_level: 6,
    tags: ['cloth', 'loop', 'overlapping', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9905, category: 'animation', difficulty: 'novice',
    title: { en: 'Blink Cycle: 8 Frames', ru: 'Цикл моргания: 8 кадров' },
    description: {
      en: 'Simple character or icon blink — open, half, closed, half, open. Hold open frames.',
      ru: 'Простое моргание — открыт, полу, закрыт, полу, открыт. Удержание открытых кадров.',
    },
    xp: 55, estimatedTime: 25, min_level: 1,
    tags: ['face', 'blink', 'cycle', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9906, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Walk Cycle: Contact Poses Only', ru: 'Пошаговый цикл: только contact poses' },
    description: {
      en: 'Draw 4 contact poses for a walk cycle (no in-betweens). Clear weight on planted foot.',
      ru: '4 contact pose для walk cycle (без промежуточных). Вес на опорной ноге.',
    },
    xp: 92, estimatedTime: 48, min_level: 5,
    tags: ['walk-cycle', 'pose', 'animation', 'digital'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9907, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Exploding Ball Squash & Stretch', ru: 'Взрыв шара: squash & stretch' },
    description: {
      en: 'Ball inflates, pops, fragments scatter with stretch on motion. 20–30 frames.',
      ru: 'Шар надувается, лопается, осколки разлетаются со stretch. 20–30 кадров.',
    },
    xp: 105, estimatedTime: 52, min_level: 6,
    tags: ['squash-stretch', 'impact', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9908, category: 'animation', difficulty: 'advanced',
    title: { en: 'Rough Character Turnaround', ru: 'Черновой turnaround персонажа' },
    description: {
      en: 'Animate or pose sheet: front, 3/4, side, back — consistent proportions. 4 key poses minimum.',
      ru: 'Turnaround: фронт, 3/4, профиль, спина — единые пропорции. Минимум 4 ключевых позы.',
    },
    xp: 165, estimatedTime: 75, min_level: 12,
    tags: ['character', 'turnaround', 'advanced', 'animation'],
    medium: 'both', is_repeatable: false, review_after_days: 21,
  },
  {
    id: 9909, category: 'animation', difficulty: 'novice',
    title: { en: 'Brick Drop Weight Test', ru: 'Тест веса: падающий кирпич' },
    description: {
      en: 'Animate a brick falling and landing — acceleration, small bounce, dust optional.',
      ru: 'Падающий кирпич — ускорение, лёгкий отскок, пыль по желанию.',
    },
    xp: 58, estimatedTime: 30, min_level: 2,
    tags: ['weight', 'gravity', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9910, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Overlapping Action: Ponytail', ru: 'Overlapping action: хвост/коса' },
    description: {
      en: 'Head turn with ponytail or braid lagging and settling. 12–18 frames.',
      ru: 'Поворот головы — хвост или коса догоняет и оседает. 12–18 кадров.',
    },
    xp: 98, estimatedTime: 48, min_level: 6,
    tags: ['overlapping', 'hair', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9911, category: 'animation', difficulty: 'novice',
    title: { en: 'Tail Wag Loop', ru: 'Цикл виляния хвостом' },
    description: {
      en: 'Simple dog or cat tail wag loop. Base fixed; tip leads motion.',
      ru: 'Простой цикл виляния хвостом. Основание фиксировано; кончик ведёт движение.',
    },
    xp: 52, estimatedTime: 28, min_level: 1,
    tags: ['loop', 'animal', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9912, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Particle Burst: 24 Frames', ru: 'Всплеск частиц: 24 кадра' },
    description: {
      en: 'Animate a burst of 8–12 particles from a point — slow out, gravity, fade.',
      ru: '8–12 частиц из точки — slow out, гравитация, затухание. 24 кадра.',
    },
    xp: 90, estimatedTime: 45, min_level: 5,
    tags: ['particles', 'effects', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 9913, category: 'animation', difficulty: 'advanced',
    title: { en: 'Car Brake Anticipation', ru: 'Антиципация торможения машины' },
    description: {
      en: 'Car skids to stop — anticipation lean, tire smoke optional, settle bounce.',
      ru: 'Машина тормозит — антиципация наклона, дым от шин, лёгкий bounce в конце.',
    },
    xp: 150, estimatedTime: 65, min_level: 11,
    tags: ['vehicle', 'anticipation', 'advanced', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 9914, category: 'animation', difficulty: 'novice',
    title: { en: 'Jelly Wobble Loop', ru: 'Цикл дрожащего желе' },
    description: {
      en: 'Soft body wobble after a poke — squash, oscillate, rest. Seamless loop.',
      ru: 'Желе дрожит после тычка — squash, колебание, покой. Бесшовный цикл.',
    },
    xp: 60, estimatedTime: 32, min_level: 2,
    tags: ['squash-stretch', 'loop', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 9915, category: 'animation', difficulty: 'intermediate',
    title: { en: 'Sword Slash Arc', ru: 'Дуга удара мечом' },
    description: {
      en: 'Single sword slash — anticipation backswing, fast arc, follow-through, recovery.',
      ru: 'Один удар мечом — антиципация, быстрая дуга, follow-through, возврат.',
    },
    xp: 102, estimatedTime: 50, min_level: 6,
    tags: ['action', 'arc', 'anticipation', 'animation', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },

  // —— Effects ——
  {
    id: 10001, category: 'effects', difficulty: 'novice',
    title: { en: '20 Spark Variations', ru: '20 вариаций искр' },
    description: {
      en: 'Draw or animate 20 different spark shapes — star, streak, pop, trail. One color theme.',
      ru: '20 форм искр — звезда, штрих, вспышка, шлейф. Одна цветовая тема.',
    },
    xp: 62, estimatedTime: 35, min_level: 1,
    tags: ['spark', 'quantity', 'design', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10002, category: 'effects', difficulty: 'intermediate',
    title: { en: 'Smoke Puff: 8 Frames', ru: 'Дымовой puff: 8 кадров' },
    description: {
      en: 'Cartoon smoke puff expanding and dissipating. Round → wispy → transparent.',
      ru: 'Мультяшный дым — расширение и рассеивание. Круг → wispy → прозрачность.',
    },
    xp: 88, estimatedTime: 42, min_level: 5,
    tags: ['smoke', 'cycle', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10003, category: 'effects', difficulty: 'intermediate',
    title: { en: 'Layered Magic Circle', ru: 'Многослойный магический круг' },
    description: {
      en: 'Design a magic circle with 3 rotating layers — runes, geometry, glow rim.',
      ru: 'Магический круг с 3 вращающимися слоями — руны, геометрия, свечение по краю.',
    },
    xp: 95, estimatedTime: 48, min_level: 6,
    tags: ['magic', 'design', 'layers', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10004, category: 'effects', difficulty: 'novice',
    title: { en: 'Rain Sheet Overlay', ru: 'Наложение дождевой пелены' },
    description: {
      en: 'Draw rain streaks on a simple scene — angle, density, depth layers.',
      ru: 'Дождевые полосы на простой сцене — угол, плотность, слои глубины.',
    },
    xp: 55, estimatedTime: 30, min_level: 2,
    tags: ['rain', 'weather', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10005, category: 'effects', difficulty: 'advanced',
    title: { en: 'Torch Fire Loop', ru: 'Цикл огня факела' },
    description: {
      en: 'Looping torch flame — 6–8 drawings or frames. Core, outer flame, embers.',
      ru: 'Цикл пламени факела — 6–8 рисунков или кадров. Ядро, внешнее пламя, угольки.',
    },
    xp: 140, estimatedTime: 60, min_level: 10,
    tags: ['fire', 'loop', 'advanced', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 10006, category: 'effects', difficulty: 'intermediate',
    title: { en: 'Dust Kick: 12 Frames', ru: 'Пыль от удара: 12 кадров' },
    description: {
      en: 'Foot stomp or impact kicks dust — puff, settle, lingering particles.',
      ru: 'Удар ногой поднимает пыль — puff, оседание, остаточные частицы.',
    },
    xp: 85, estimatedTime: 40, min_level: 5,
    tags: ['dust', 'impact', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10007, category: 'effects', difficulty: 'intermediate',
    title: { en: '5 Lightning Branch Variants', ru: '5 вариантов разветвлённой молнии' },
    description: {
      en: 'Draw 5 lightning bolt designs — different branch patterns and glow cores.',
      ru: '5 дизайнов молнии — разные ветвления и светящееся ядро.',
    },
    xp: 80, estimatedTime: 38, min_level: 5,
    tags: ['lightning', 'design', 'quantity', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10008, category: 'effects', difficulty: 'advanced',
    title: { en: 'Explosion Shockwave Ring', ru: 'Ударная волна взрыва' },
    description: {
      en: 'Animate expanding shockwave ring + debris — 16–24 frames.',
      ru: 'Расширяющееся кольцо ударной волны + обломки — 16–24 кадра.',
    },
    xp: 155, estimatedTime: 65, min_level: 11,
    tags: ['explosion', 'shockwave', 'advanced', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 10009, category: 'effects', difficulty: 'novice',
    title: { en: 'Healing Sparkles', ru: 'Искры исцеления' },
    description: {
      en: 'Design 12 sparkle motifs for a heal effect — rise, twinkle, fade.',
      ru: '12 мотивов искр для heal-эффекта — подъём, мерцание, затухание.',
    },
    xp: 58, estimatedTime: 32, min_level: 1,
    tags: ['sparkle', 'magic', 'design', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10010, category: 'effects', difficulty: 'advanced',
    title: { en: 'Water Splash: 16 Frames', ru: 'Брызги воды: 16 кадров' },
    description: {
      en: 'Object hits water — crown splash, droplets, ripple. Timing chart included.',
      ru: 'Предмет падает в воду — crown splash, капли, рipple. Timing chart.',
    },
    xp: 148, estimatedTime: 62, min_level: 10,
    tags: ['water', 'splash', 'advanced', 'effects', 'digital'],
    medium: 'digital', is_repeatable: true, review_after_days: 21,
  },

  // —— Storytelling ——
  {
    id: 10101, category: 'storytelling', difficulty: 'novice',
    title: { en: '3-Panel Silent Story', ru: '3-панельная история без слов' },
    description: {
      en: 'Tell a mini story in 3 panels — setup, conflict, punchline. No dialogue.',
      ru: 'Мини-история в 3 панелях — завязка, конфликт, развязка. Без диалога.',
    },
    xp: 65, estimatedTime: 35, min_level: 1,
    tags: ['comic', 'sequence', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10102, category: 'storytelling', difficulty: 'intermediate',
    title: { en: 'Emotion Swap: Same Pose', ru: 'Смена эмоции: та же поза' },
    description: {
      en: 'Draw one pose with 4 different emotions — joy, anger, fear, calm. Body language shifts.',
      ru: 'Одна поза с 4 эмоциями — радость, злость, страх, спокойствие. Язык тела меняется.',
    },
    xp: 90, estimatedTime: 45, min_level: 5,
    tags: ['emotion', 'pose', 'character', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10103, category: 'storytelling', difficulty: 'intermediate',
    title: { en: 'Before / After Character Arc', ru: 'До / после: дуга персонажа' },
    description: {
      en: 'Two illustrations — same character before and after a major event. Costume and posture change.',
      ru: 'Два рисунка — персонаж до и после ключевого события. Костюм и осанка меняются.',
    },
    xp: 95, estimatedTime: 50, min_level: 6,
    tags: ['character-arc', 'contrast', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10104, category: 'storytelling', difficulty: 'advanced',
    title: { en: '6-Panel Chase Sequence', ru: '6-панельная погоня' },
    description: {
      en: 'Storyboard a chase — 6 panels with clear screen direction and escalating stakes.',
      ru: 'Раскадровка погони — 6 панелей, направление движения, нарастающие stakes.',
    },
    xp: 145, estimatedTime: 65, min_level: 10,
    tags: ['storyboard', 'action', 'advanced', 'storytelling'],
    medium: 'both', is_repeatable: false, review_after_days: 21,
  },
  {
    id: 10105, category: 'storytelling', difficulty: 'intermediate',
    title: { en: 'Visual Metaphor Page', ru: 'Страница визуальной метафоры' },
    description: {
      en: 'One scene where an object symbolizes an emotion (e.g. storm = anger). Caption optional.',
      ru: 'Сцена, где предмет символизирует эмоцию (буря = гнев). Подпись опционально.',
    },
    xp: 85, estimatedTime: 42, min_level: 5,
    tags: ['metaphor', 'symbolism', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10106, category: 'storytelling', difficulty: 'novice',
    title: { en: 'Dialogue-Free Conflict', ru: 'Конфликт без диалога' },
    description: {
      en: 'Two characters disagree — show conflict through pose and expression only.',
      ru: 'Два персонажа спорят — конфликт только через позу и мимику.',
    },
    xp: 60, estimatedTime: 32, min_level: 2,
    tags: ['conflict', 'body-language', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10107, category: 'storytelling', difficulty: 'intermediate',
    title: { en: 'Prop That Tells a Story', ru: 'Реквизит, который рассказывает историю' },
    description: {
      en: 'Draw one worn object (sword, teddy, letter) that implies backstory without characters.',
      ru: 'Один изношенный предмет (меч, игрушка, письмо), намекающий на историю без персонажей.',
    },
    xp: 78, estimatedTime: 40, min_level: 4,
    tags: ['prop', 'narrative', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10108, category: 'storytelling', difficulty: 'advanced',
    title: { en: 'Montage: 9 Thumbnails', ru: 'Монтаж: 9 эскизов' },
    description: {
      en: 'Nine tiny panels showing a day-in-the-life montage. Readable at thumbnail size.',
      ru: '9 мини-панелей — montage одного дня. Читаемо в миниатюре.',
    },
    xp: 130, estimatedTime: 58, min_level: 9,
    tags: ['montage', 'thumbnail', 'advanced', 'storytelling'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },

  // —— Character design ——
  {
    id: 10201, category: 'character_design', difficulty: 'intermediate',
    title: { en: '20 Silhouettes: One Theme', ru: '20 силуэтов одной темы' },
    description: {
      en: 'Pick a theme (knights, robots, fishfolk) and draw 20 black silhouettes. Variety in shape.',
      ru: 'Тема (рыцари, роботы, рыболюди) — 20 чёрных силуэтов. Разнообразие форм.',
    },
    xp: 92, estimatedTime: 50, min_level: 5,
    tags: ['silhouette', 'quantity', 'design', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10202, category: 'character_design', difficulty: 'novice',
    title: { en: '10 Fantasy Class Icons', ru: '10 иконок классов фэнтези' },
    description: {
      en: 'Design 10 readable class icons — warrior, mage, rogue, etc. Square format.',
      ru: '10 читаемых иконок классов — воин, маг, разбойник и т.д. Квадратный формат.',
    },
    xp: 62, estimatedTime: 35, min_level: 1,
    tags: ['icon', 'fantasy', 'quantity', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10203, category: 'character_design', difficulty: 'intermediate',
    title: { en: '15 NPC Face Generator', ru: '15 лиц NPC' },
    description: {
      en: 'Draw 15 distinct NPC faces — age, gender, and mood variety. Same head size.',
      ru: '15 разных лиц NPC — возраст, пол, настроение. Один размер головы.',
    },
    xp: 88, estimatedTime: 48, min_level: 5,
    tags: ['face', 'npc', 'quantity', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10204, category: 'character_design', difficulty: 'intermediate',
    title: { en: 'Outfit Layer Breakdown', ru: 'Разбор слоёв костюма' },
    description: {
      en: 'One character — underwear, base clothes, armor, accessories on separate layers.',
      ru: 'Один персонаж — бельё, базовая одежда, броня, аксессуары отдельными слоями.',
    },
    xp: 95, estimatedTime: 52, min_level: 6,
    tags: ['costume', 'layers', 'design', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10205, category: 'character_design', difficulty: 'intermediate',
    title: { en: '12 Monster Silhouettes', ru: '12 силуэтов монстров' },
    description: {
      en: '12 monster silhouettes — mix sizes and limb counts. Readable at 64px height.',
      ru: '12 силуэтов монстров — размер и число конечностей. Читаемо при высоте 64px.',
    },
    xp: 85, estimatedTime: 45, min_level: 5,
    tags: ['monster', 'silhouette', 'quantity', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10206, category: 'character_design', difficulty: 'advanced',
    title: { en: 'Color Palette: 8 Characters', ru: 'Палитра: 8 персонажей' },
    description: {
      en: '8 character color keys sharing one harmonious palette. Swatches labeled.',
      ru: '8 color key персонажей в одной гармоничной палитре. Swatches подписаны.',
    },
    xp: 135, estimatedTime: 60, min_level: 10,
    tags: ['color', 'palette', 'advanced', 'character_design'],
    medium: 'digital', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 10207, category: 'character_design', difficulty: 'intermediate',
    title: { en: 'Prop Sheet: 6 Items', ru: 'Лист реквизита: 6 предметов' },
    description: {
      en: 'Six props belonging to one character — weapon, bag, tool, trinket, etc. Turnaround optional.',
      ru: '6 предметов одного персонажа — оружие, сумка, инструмент, trinket. Turnaround опционально.',
    },
    xp: 82, estimatedTime: 44, min_level: 5,
    tags: ['prop', 'design', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10208, category: 'character_design', difficulty: 'advanced',
    title: { en: 'Age Progression: 5 Stages', ru: 'Возрастная прогрессия: 5 стадий' },
    description: {
      en: 'Same character at child, teen, adult, middle age, elder — consistent features.',
      ru: 'Один персонаж: ребёнок, подросток, взрослый, средний возраст, старость — узнаваемые черты.',
    },
    xp: 150, estimatedTime: 68, min_level: 11,
    tags: ['age', 'progression', 'advanced', 'character_design'],
    medium: 'both', is_repeatable: false, review_after_days: 21,
  },
  {
    id: 10209, category: 'character_design', difficulty: 'novice',
    title: { en: '10 Faction Emblems', ru: '10 эмблем фракций' },
    description: {
      en: 'Design 10 simple faction emblems — geometric, animal, or symbol based.',
      ru: '10 простых эмблем фракций — геометрия, животные или символы.',
    },
    xp: 58, estimatedTime: 32, min_level: 1,
    tags: ['emblem', 'logo', 'quantity', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10210, category: 'character_design', difficulty: 'intermediate',
    title: { en: 'Creature Hybrid: 3 Variants', ru: 'Гибрид существа: 3 варианта' },
    description: {
      en: 'Combine two animals into 3 hybrid creature designs. Silhouette first, then detail.',
      ru: 'Скрестите двух животных — 3 дизайна гибрида. Сначала силуэт, потом детали.',
    },
    xp: 90, estimatedTime: 48, min_level: 5,
    tags: ['creature', 'hybrid', 'design', 'character_design'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },

  // —— Environment ——
  {
    id: 10301, category: 'environment', difficulty: 'novice',
    title: { en: '20 Tree Silhouettes', ru: '20 силуэтов деревьев' },
    description: {
      en: 'Draw 20 tree silhouettes — pine, oak, willow, dead tree, fantasy shapes.',
      ru: '20 силуэтов деревьев — сосна, дуб, ива, мёртвое дерево, фэнтези-формы.',
    },
    xp: 55, estimatedTime: 30, min_level: 1,
    tags: ['tree', 'silhouette', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10302, category: 'environment', difficulty: 'novice',
    title: { en: '10 Cloud Shape Studies', ru: '10 форм облаков' },
    description: {
      en: 'Study 10 cloud formations — cumulus, stratus, storm wall. Value masses only.',
      ru: '10 форм облаков — cumulus, stratus, грозовая стена. Только массы тона.',
    },
    xp: 50, estimatedTime: 28, min_level: 1,
    tags: ['cloud', 'sky', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10303, category: 'environment', difficulty: 'intermediate',
    title: { en: '15 Rock Formations', ru: '15 скальных формаций' },
    description: {
      en: 'Draw 15 rock clusters — cliff, boulder field, canyon wall. Simple light direction.',
      ru: '15 групп камней — скала, валуны, стена кanyon. Простое освещение.',
    },
    xp: 82, estimatedTime: 45, min_level: 4,
    tags: ['rock', 'terrain', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10304, category: 'environment', difficulty: 'intermediate',
    title: { en: 'Street Corner Thumbnails', ru: 'Эскизы уличного угла' },
    description: {
      en: '12 small street-corner compositions — shop, alley, crosswalk. Perspective optional.',
      ru: '12 мини-композиций уличного угла — магазин, переулок, переход. Перспектива опционально.',
    },
    xp: 88, estimatedTime: 48, min_level: 5,
    tags: ['urban', 'thumbnail', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10305, category: 'environment', difficulty: 'intermediate',
    title: { en: '5 Rooms in One-Point Perspective', ru: '5 комнат в одноточечной перспективе' },
    description: {
      en: 'Five simple interior boxes — bedroom, kitchen, hall, studio, bathroom. Furniture blocks.',
      ru: '5 простых интерьеров — спальня, кухня, коридор, студия, ванная. Блоки мебели.',
    },
    xp: 95, estimatedTime: 55, min_level: 6,
    tags: ['interior', 'perspective', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10306, category: 'environment', difficulty: 'advanced',
    title: { en: 'Night City Silhouette', ru: 'Силуэт ночного города' },
    description: {
      en: 'City skyline at night — layered buildings, lit windows, atmospheric perspective.',
      ru: 'Городской силуэт ночью — слои зданий, окна, atmospheric perspective.',
    },
    xp: 140, estimatedTime: 65, min_level: 10,
    tags: ['city', 'night', 'silhouette', 'advanced', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 10307, category: 'environment', difficulty: 'novice',
    title: { en: '12 Foliage Clumps', ru: '12 clumps листвы' },
    description: {
      en: 'Draw 12 bush or foliage clumps — different shapes and density. Flat or simple value.',
      ru: '12 кустов или clumps листвы — разная форма и плотность. Плоско или простой тон.',
    },
    xp: 52, estimatedTime: 28, min_level: 1,
    tags: ['foliage', 'nature', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 7,
  },
  {
    id: 10308, category: 'environment', difficulty: 'intermediate',
    title: { en: 'River Bend: 5 Angles', ru: 'Изгиб реки: 5 ракурсов' },
    description: {
      en: 'Same river bend from 5 camera angles — aerial, eye level, low, opposite bank, close-up.',
      ru: 'Один изгиб реки в 5 ракурсах — сверху, уровень глаз, низко, противоположный берег, крупно.',
    },
    xp: 90, estimatedTime: 50, min_level: 5,
    tags: ['water', 'landscape', 'composition', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
  {
    id: 10309, category: 'environment', difficulty: 'advanced',
    title: { en: 'Mountain Range Layers', ru: 'Слои горного хребта' },
    description: {
      en: 'Panorama with 4+ mountain layers — value shift, lost edges, focal peak.',
      ru: 'Панорама с 4+ слоями гор — сдвиг тона, lost edges, фocal peak.',
    },
    xp: 155, estimatedTime: 70, min_level: 11,
    tags: ['mountain', 'landscape', 'advanced', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 21,
  },
  {
    id: 10310, category: 'environment', difficulty: 'intermediate',
    title: { en: 'Props Scatter: 20 Items', ru: 'Scatter реквизита: 20 предметов' },
    description: {
      en: 'Draw 20 environment props — crate, barrel, lamp post, fence, sign. Top-down or 3/4.',
      ru: '20 props окружения — ящик, бочка, фонарь, забор, вывеска. Сверху или 3/4.',
    },
    xp: 85, estimatedTime: 45, min_level: 4,
    tags: ['prop', 'scatter', 'quantity', 'environment'],
    medium: 'both', is_repeatable: true, review_after_days: 14,
  },
]

function buildQuest(draft: QuestDraft) {
  const meta = CAT_META[draft.category]
  const code = `${meta.code}-${String(draft.id).padStart(5, '0')}`
  const tags = [...new Set([...draft.tags, draft.category, draft.difficulty])]
  return {
    id: draft.id,
    code,
    title: draft.title,
    category: draft.category,
    difficulty: draft.difficulty,
    description: draft.description,
    xp: draft.xp,
    estimatedTime: draft.estimatedTime,
    source: draft.source ?? meta.source,
    icon: meta.icon,
    color: meta.color,
    min_level: draft.min_level,
    tags,
    prerequisites: [] as number[],
    medium: draft.medium,
    is_repeatable: draft.is_repeatable,
    review_after_days: draft.review_after_days,
    streak_bonus: 1,
  }
}

async function main(): Promise<void> {
  const byFile = new Map<string, ReturnType<typeof buildQuest>[]>()
  for (const draft of DRAFTS) {
    const meta = CAT_META[draft.category]
    const list = byFile.get(meta.file) ?? []
    list.push(buildQuest(draft))
    byFile.set(meta.file, list)
  }

  let added = 0
  for (const [file, newQuests] of byFile) {
    const filePath = path.join(DATA_DIR, file)
    const existing = JSON.parse(await fs.readFile(filePath, 'utf8')) as { id: number }[]
    const existingIds = new Set(existing.map((q) => q.id))
    if (existingIds.has(9701)) {
      console.log(`${file}: MMO quests already present — skip`)
      continue
    }
    for (const q of newQuests) {
      if (existingIds.has(q.id)) {
        throw new Error(`Duplicate id ${q.id} in ${file}`)
      }
    }
    const merged = [...existing, ...newQuests].sort((a, b) => a.id - b.id)
    await fs.writeFile(filePath, JSON.stringify(merged, null, 2) + '\n', 'utf8')
    added += newQuests.length
    console.log(`${file}: +${newQuests.length} MMO quests`)
  }

  console.log(`Added ${added} MMO quests (${DRAFTS.length} defined)`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
