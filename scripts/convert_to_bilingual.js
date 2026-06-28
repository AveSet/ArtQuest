const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';
const outputFile = 'src/renderer/src/data/quests.json';

const enSubjects = {
  "куба": "cube",
  "сферы": "sphere",
  "цилиндра": "cylinder",
  "руки в жесте": "hand gesture",
  "портрета в 3/4": "3/4 portrait",
  "натюрморта": "still life",
  "драпировки": "drapery",
  "пейзажа": "landscape",
  "персонажа": "character",
  "архитектурного фрагмента": "architectural fragment",
  "торса": "torso",
  "кисти": "hand",
  "стопы": "foot",
  "головы в анфас": "head front-facing",
  "фигуры в движении": "figure in motion",
  "скелета таза": "pelvis skeleton",
  "плечевого пояса": "shoulder girdle",
  "лицевой мимики": "facial expressions",
  "позвоночника": "spine",
  "мускулатуры ног": "leg muscles",
  "мяча с отскоком": "bouncing ball",
  "фигуры в шаге": "walking figure",
  "персонажа в прыжке": "jumping character",
  "хвоста животного": "animal tail",
  "ткани на ветру": "fabric in wind",
  "камеры с панорамой": "panning camera",
  "объекта с весом": "weighted object",
  "диалоговой сцены": "dialogue scene",
  "цикла бега": "run cycle",
  "реакции персонажа": "character reaction",
  "огня": "fire",
  "дыма": "smoke",
  "воды с брызгами": "water with splashes",
  "магической энергии": "magical energy",
  "взрывной волны": "explosion shockwave",
  "дождя": "rain",
  "искр": "sparks",
  "тумана": "fog",
  "лавы": "lava",
  "электрической дуги": "electric arc",
  "сцены погони": "chase scene",
  "диалога": "dialogue",
  "момента открытия": "discovery moment",
  "тихой сцены": "quiet scene",
  "кульминации": "climax",
  "флешбэка": "flashback",
  "перехода между локациями": "location transition",
  "эмоционального пика": "emotional peak",
  "завязки": "exposition",
  "развязки": "resolution"
};

const enTemplates = {
  "novice": [
    {t: "Быстрый жест: {} ({} сек)", d: "Захвати линию действия и общую форму. Не рисуй детали.", enT: "Quick gesture: {} ({} sec)", enD: "Capture the line of action and general shape. Don't draw details.", m: "both"},
    {t: "Контурный рисунок {} вслепую", d: "Гляди только на объект. Развивай зрительно-моторную связь.", enT: "Blind contour drawing {}", enD: "Look only at the subject. Develop visual-motor coordination.", m: "traditional"},
    {t: "Построй {} из примитивов", d: "Разложи на сферы/кубы/цилиндры. Пойми объём до штриховки.", enT: "Construct {} from primitives", enD: "Break down into spheres/cubes/cylinders. Understand volume before shading.", m: "both"},
    {t: "Тональная шкала {} ступеней", d: "Контролируй нажим. Плавный переход от белого к чёрному.", enT: "Value scale: {} steps", enD: "Control pressure. Smooth transition from white to black.", m: "traditional"},
    {t: "Цифровой блок-аут: {} (flat colors)", d: "Залей формы базовыми цветами. Без теней и текстур.", enT: "Digital block-out: {} (flat colors)", enD: "Fill with base colors. No shadows and textures.", m: "digital"},
    {t: "Копия простого референса: {}", d: "Наблюдательный рисунок с акцентом на пропорции.", enT: "Simple reference copy: {}", enD: "Observational drawing with emphasis on proportions.", m: "both"}
  ],
  "intermediate": [
    {t: "Конструктивный {} в 3/4", d: "Вращай форму в пространстве. Проверь эллипсы и перспективу.", enT: "Constructive {} in 3/4", enD: "Rotate form in space. Check ellipses and perspective.", m: "both"},
    {t: "Светотеневое моделирование {}", d: "Ядро тени, полутень, блик, рефлекс. 1 источник света.", enT: "Light and shadow modeling {}", enD: "Shadow core, halftone, highlight, reflection. 1 light source.", m: "both"},
    {t: "Драпировка на {}: 5 типов складок", d: "Трубчатые, зигзаг, инертные, диагональные, составные.", enT: "Drapery on {}: 5 types of folds", enD: "Tubular, zigzag, inert, diagonal, compound.", m: "both"},
    {t: "Двухточечная перспектива: {}", d: "Угловой объект. Проверь сходимость и масштаб.", enT: "Two-point perspective: {}", enD: "Angled object. Check convergence and scale.", m: "both"},
    {t: "Спид-скетч {}: {} мин/шт", d: "Выбери главное. Отбрось детали. Тренируй композицию.", enT: "Speed sketch {}: {} min/pc", enD: "Choose main. Discard details. Practice composition.", m: "both"},
    {t: "Анализ формы у мастеров: {}", d: "Разбери как профессионалы упрощают сложные объекты.", enT: "Form analysis from masters: {}", enD: "Analyze how professionals simplify complex objects.", m: "both"}
  ]
};

function toEnglish(text) {
  let en = text;
  for (const [ru, enW] of Object.entries(enSubjects)) {
    en = en.replace(new RegExp(ru, 'gi'), enW);
  }
  en = en.replace(/сек/g, 'sec');
  en = en.replace(/мин/gi, 'min');
  en = en.replace(/шт/g, 'pc');
  return en;
}

function main() {
  console.log('Loading quests...');
  const data = fs.readFileSync(inputFile, 'utf8');
  const quests = JSON.parse(data);
  
  console.log(`Processing ${quests.length} quests...`);
  
  for (const quest of quests) {
    const ruTitle = quest.title;
    const ruDesc = quest.description;
    const enTitle = toEnglish(ruTitle);
    const enDesc = toEnglish(ruDesc);
    
    quest.title = { en: enTitle, ru: ruTitle };
    quest.description = { en: enDesc, ru: ruDesc };
  }
  
  console.log('Saving...');
  fs.writeFileSync(outputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();