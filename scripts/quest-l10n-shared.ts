export const QUEST_FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
] as const

export type QuestLocale = 'ru' | 'zh' | 'ja' | 'ko'

export type LocalizedFields = {
  en: string
  ru: string
  zh: string
  ja: string
  ko: string
}

export type QuestRow = {
  id: number
  code: string
  title: LocalizedFields
  description: LocalizedFields
  microChallenges?: { instruction: LocalizedFields }[]
}

/** Shared vocabulary keyed by English slug. */
export const LEX: Record<string, Record<QuestLocale, string>> = {
  pride: { ru: 'гордость', zh: '骄傲', ja: '誇り', ko: '자부심' },
  boredom: { ru: 'скука', zh: '无聊', ja: '退屈', ko: '지루함' },
  anticipation: { ru: 'предвкушение', zh: '期待', ja: '期待', ko: '기대' },
  command: { ru: 'властность', zh: '威严', ja: '威厳', ko: '위압감' },
  victory: { ru: 'победа', zh: '胜利', ja: '勝利', ko: '승리' },
  defeat: { ru: 'поражение', zh: '失败', ja: '敗北', ko: '패배' },
  exposure: { ru: 'разоблачение', zh: '揭露', ja: '暴露', ko: '폭로' },
  journey: { ru: 'путешествие', zh: '旅程', ja: '旅', ko: '여정' },
  rescue: { ru: 'спасение', zh: '救援', ja: '救助', ko: '구조' },
  rivalry: { ru: 'соперничество', zh: '对抗', ja: 'ライバル関係', ko: '라이벌' },
  competition: { ru: 'соревнование', zh: '竞赛', ja: '競争', ko: '경쟁' },
  encouragement: { ru: 'поддержка', zh: '鼓励', ja: '励まし', ko: '격려' },
  apology: { ru: 'извинение', zh: '道歉', ja: '謝罪', ko: '사과' },
  betrayal: { ru: 'предательство', zh: '背叛', ja: '裏切り', ko: '배신' },
  grief: { ru: 'горе', zh: '悲伤', ja: '悲しみ', ko: '슬픔' },
  hope: { ru: 'надежда', zh: '希望', ja: '希望', ko: '희망' },
  threat: { ru: 'угроза', zh: '威胁', ja: '脅威', ko: '위협' },
  triumph: { ru: 'триумф', zh: '凯旋', ja: '凱旋', ko: '승전' },
  epiphany: { ru: 'озарение', zh: '顿悟', ja: '悟り', ko: '깨달음' },
  sacrifice: { ru: 'жертва', zh: '牺牲', ja: '犠牲', ko: '희생' },
  farewell: { ru: 'прощание', zh: '告别', ja: '別れ', ko: '작별' },
  forgiveness: { ru: 'прощение', zh: '原谅', ja: '許し', ko: '용서' },
  climax: { ru: 'кульминация', zh: '高潮', ja: 'クライマックス', ko: '클라이맥스' },
  dialogue: { ru: 'диалог', zh: '对话', ja: '会話', ko: '대화' },
  space: { ru: 'космос', zh: '空间', ja: '空間', ko: '공간' },
  hero: { ru: 'героя', zh: '英雄', ja: 'ヒーロー', ko: '영웅' },
  mage: { ru: 'мага', zh: '法师', ja: '魔法使い', ko: '마법사' },
  dwarf: { ru: 'гнома', zh: '矮人', ja: 'ドワーフ', ko: '드워프' },
  elf: { ru: 'эльфа', zh: '精灵', ja: 'エルフ', ko: '엘프' },
  rogue: { ru: 'плута', zh: '盗贼', ja: 'ローグ', ko: '도적' },
  monster: { ru: 'монстра', zh: '怪物', ja: 'モンスター', ko: '몬스터' },
  robot: { ru: 'робота', zh: '机器人', ja: 'ロボット', ko: '로봇' },
  alien: { ru: 'пришельца', zh: '外星人', ja: 'エイリアン', ko: '외계인' },
  bridge: { ru: 'мост', zh: '桥梁', ja: '橋', ko: '다리' },
  'forest path': { ru: 'лесная тропа', zh: '森林小径', ja: '森の小道', ko: '숲길' },
  'city street': { ru: 'городская улица', zh: '城市街道', ja: '街路', ko: '도시 거리' },
  'market alley': { ru: 'рынок в переулке', zh: '市场小巷', ja: '市場の路地', ko: '시장 골목' },
  spaceport: { ru: 'космопорт', zh: '太空港', ja: '宇宙港', ko: '우주 정거장' },
  'interior hallway': { ru: 'интерьер коридора', zh: '室内走廊', ja: '室内の廊下', ko: '실내 복도' },
  cave: { ru: 'пещера', zh: '洞穴', ja: '洞窟', ko: '동굴' },
  'mountain road': { ru: 'горная дорога', zh: '山路', ja: '山道', ko: '산길' },
  window: { ru: 'окна', zh: '窗景', ja: 'ウィンドウ', ko: '창가' },
  'looking at own work': { ru: 'смотрит на своё произведение', zh: '欣赏自己的作品', ja: '自分の作品を見る', ko: '자신의 작품을 바라봄' },
  'waiting in line': { ru: 'ожидание в очереди', zh: '排队等待', ja: '列に並んで待つ', ko: '줄 서서 기다림' },
  'calm before storm': { ru: 'затишье перед бурей', zh: '暴风雨前的平静', ja: '嵐の前の静けさ', ko: '폭풍 전 고요' },
  'lie revealed': { ru: 'ложь раскрыта', zh: '谎言被揭穿', ja: '嘘が暴かれる', ko: '거짓이 드러남' },
  'authoritative gesture': { ru: 'властный жест', zh: '权威手势', ja: '権威あるジェスチャー', ko: '권위 있는 제스처' },
  resignation: { ru: 'смирение', zh: '认命', ja: '諦め', ko: '체념' },
  'finish line': { ru: 'финишная черта', zh: '终点线', ja: 'ゴールライン', ko: '결승선' },
  'eye to eye': { ru: 'глаза в глаза', zh: '对视', ja: '目を合わせる', ko: '눈을 맞댐' },
  'last moment': { ru: 'последний момент', zh: '最后一刻', ja: '最後の瞬間', ko: '마지막 순간' },
  'looming danger': { ru: 'нависающая опасность', zh: '逼近的危险', ja: '迫る危機', ko: '다가오는 위험' },
  'guilty look': { ru: 'виноватый взгляд', zh: '愧疚的表情', ja: '罪悪感のある表情', ko: '죄책감 어린 표정' },
  'self-sacrifice': { ru: 'самопожертвование', zh: '自我牺牲', ja: '自己犠牲', ko: '자기희생' },
  whisper: { ru: 'шёпот', zh: '耳语', ja: 'ささやき', ko: '속삭임' },
  'dawn after darkness': { ru: 'рассвет после тьмы', zh: '黑暗后的黎明', ja: '暗闇の後の夜明け', ko: '어둠 뒤의 새벽' },
  'farewell to home': { ru: 'прощание с домом', zh: '告别家园', ja: '故郷との別れ', ko: '고향과의 작별' },
  'loneliness in crowd': { ru: 'одиночество в толпе', zh: '人群中孤独', ja: '群衆の中の孤独', ko: '군중 속 외로움' },
  'secret note passing': { ru: 'тайная передача записки', zh: '秘密递纸条', ja: '秘密のメモの受け渡し', ko: '비밀 쪽지 전달' },
  'overheard conversation': { ru: 'подслушанный разговор', zh: '偷听到的对话', ja: '聞き耳を立てた会話', ko: '엿들은 대화' },
  'argument at table': { ru: 'ссора за столом', zh: '餐桌上的争吵', ja: '食卓での口論', ko: '식탁에서의 말다툼' },
  'decision moment': { ru: 'момент решения', zh: '抉择时刻', ja: '決断の瞬間', ko: '결정의 순간' },
  'reunion after long separation': {
    ru: 'встреча после долгой разлуки',
    zh: '久别重逢',
    ja: '長い別れの後の再会',
    ko: '오랜 이별 후 재회',
  },
  'secret conspiracy': { ru: 'тайный заговор', zh: '秘密密谋', ja: '秘密の共謀', ko: '비밀 음모' },
  'farewell at station': { ru: 'прощание на вокзале', zh: '车站告别', ja: '駅での別れ', ko: '역에서의 작별' },
  destruction: { ru: 'разрушения', zh: '破坏', ja: '破壊', ko: '파괴' },
  atmosphere: { ru: 'атмосфера', zh: '大气效果', ja: '大気', ko: '대기' },
  smoke: { ru: 'дым', zh: '烟雾', ja: '煙', ko: '연기' },
  fire: { ru: 'огонь', zh: '火焰', ja: '炎', ko: '불' },
  'water splashes': { ru: 'вода с брызгами', zh: '水花', ja: '水しぶき', ko: '물 튀김' },
  'magical energy': { ru: 'магическая энергия', zh: '魔法能量', ja: '魔法エネルギー', ko: '마법 에너지' },
  hail: { ru: 'град', zh: '冰雹', ja: '雹', ko: '우박' },
  sandstorm: { ru: 'песчаная буря', zh: '沙暴', ja: '砂嵐', ko: '모래 폭풍' },
  'tail drag': { ru: 'перетаскивание хвоста', zh: '拖尾', ja: '尻尾のドラッグ', ko: '꼬리 끌림' },
  'battle scene': { ru: 'боевая сцена', zh: '战斗场景', ja: '戦闘シーン', ko: '전투 장면' },
  'simple scene': { ru: 'простая сцена', zh: '简单场景', ja: 'シンプルなシーン', ko: '단순한 장면' },
  'emotional arc': { ru: 'эмоциональная дуга', zh: '情感弧线', ja: '感情の弧', ko: '감정선' },
  'pro level': { ru: 'профессиональный уровень', zh: '专业级', ja: 'プロレベル', ko: '프로 수준' },
  'simple cycle': { ru: 'простой цикл', zh: '简单循环', ja: 'シンプルなサイクル', ko: '단순한 사이클' },
  creature: { ru: 'существа', zh: '生物', ja: 'クリーチャー', ko: '크리처' },
  'extreme angles': { ru: 'экстремальные ракурсы', zh: '极端角度', ja: '極端なアングル', ko: '극단적 각도' },
  jewelry: { ru: 'шкатулки', zh: '首饰盒', ja: 'ジュエリーボックス', ko: '보석함' },
  'basic shapes': { ru: 'базовых форм', zh: '基本形状', ja: '基本形状', ko: '기본 형태' },
  'bouncing ball': { ru: 'мячика', zh: '弹跳球', ja: 'バウンスボール', ko: '바운스볼' },
  subtext: { ru: 'подтекст', zh: '潜台词', ja: 'サブテキスト', ko: '서브텍스트' },
  'jump with landing': { ru: 'прыжок с приземлением', zh: '跳跃与落地', ja: '着地付きジャンプ', ko: '착지가 있는 점프' },
  'emotional reaction': { ru: 'эмоциональная реакция', zh: '情绪反应', ja: '感情的な反응', ko: '감정적 반응' },
  'run with flight': { ru: 'бег с полётом', zh: '奔跑与飞行', ja: '飛行を伴う走り', ko: '비행이 있는 달리기' },
  'running with flight': { ru: 'бега с полётом', zh: '奔跑与飞行', ja: '飛行を伴う走り', ko: '비행이 있는 달리기' },
  atmospheresphere: { ru: 'атмосфера', zh: '大气', ja: '大気', ko: '대기' },
  industrial: { ru: 'промышленный', zh: '工业', ja: '工業', ko: '산업' },
  'technical specs': { ru: 'технические требования', zh: '技术规格', ja: '技術仕様', ko: '기술 사양' },
  campfire: { ru: 'костёр', zh: '篝火', ja: 'キャンプファイヤー', ko: '모닥불' },
  'magic barrier': { ru: 'магический барьер', zh: '魔法屏障', ja: '魔法の障壁', ko: '마법 장벽' },
  'magic bubbles': { ru: 'магические пузыри', zh: '魔法气泡', ja: '魔法の泡', ko: '마법 거품' },
  opening: { ru: 'открытие', zh: '开场', ja: 'オープニング', ko: '오프닝' },
  sparks: { ru: 'искры', zh: '火花', ja: '火花', ko: '불꽃' },
  dust: { ru: 'пыль', zh: '灰尘', ja: '塵', ko: '먼지' },
  'seamless loop': { ru: 'бесшовный цикл', zh: '无缝循环', ja: 'シームレスループ', ko: '원활한 루프' },
  hybrid: { ru: 'гибрид', zh: '混合', ja: 'ハイブリッド', ko: '하이브리드' },
  'healing sparkles': { ru: 'искры исцеления', zh: '治愈火花', ja: '癒しの輝き', ko: '치유 반짝임' },
  explosion: { ru: 'взрыв', zh: '爆炸', ja: '爆発', ko: '폭발' },
  particles: { ru: 'частицы', zh: '粒子', ja: 'パーティクル', ko: '파티클' },
  liquids: { ru: 'жидкости', zh: '液体', ja: '液体', ko: '액체' },
  electricity: { ru: 'электричество', zh: '电', ja: '電気', ko: '전기' },
  'fog/rain': { ru: 'туман / дождь', zh: '雾 / 雨', ja: '霧 / 雨', ko: '안개 / 비' },
  'anime/comic': { ru: 'аниме / комикс', zh: '动漫 / 漫画', ja: 'アニメ / コミック', ko: '애니 / 만화' },
  curtain: { ru: 'занавес', zh: '幕布', ja: 'カーテン', ko: '커튼' },
  'atmospheric effects': { ru: 'атмосферные эффекты', zh: '大气效果', ja: '大気効果', ko: '대기 효과' },
}

const LEX_KEYS_LONG_FIRST = Object.keys(LEX).sort((a, b) => b.length - a.length)

export function trLex(locale: QuestLocale, phrase: string): string {
  const lower = phrase.trim().toLowerCase()
  if (LEX[lower]?.[locale]) return LEX[lower][locale]

  let out = phrase
  for (const key of LEX_KEYS_LONG_FIRST) {
    const re = new RegExp(key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
    out = out.replace(re, LEX[key][locale])
  }
  return out
}

export function hasLatinLeak(text: string, allow: RegExp = /[A-Za-z]{2,}/): boolean {
  return allow.test(text)
}

export const LATIN_ALLOW = new Set([
  'ufotable', 'pixar', 'vfx', 'npc', 'proko', 'loomis', 'psd', 'px', 'pp', 'scm', 'lod',
  'gif', 'smart', 'hampton', 'triadic', 'block', 'breakdown', 'mocap', 'genga', 'flipbook',
  'showreel', 'ease', 'onion', 'skin', 'playblast', 'model', 'sheet', 'cube', 'sphere',
  'sf', 'vp', 'mm', 'bg',
])

export function latinTokens(text: string): string[] {
  return [...new Set((text.match(/[A-Za-z]{2,}/g) ?? []).map((t) => t.toLowerCase()))]
}

export function unexpectedLatin(text: string): string[] {
  return latinTokens(text).filter((t) => !LATIN_ALLOW.has(t) && !t.startsWith('mc-'))
}
