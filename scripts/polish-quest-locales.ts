/**
 * Linguistic polish for quest zh/ja/ko strings (art-education terminology).
 * Applies curated translations + systematic post-processing to cache and quest JSON.
 *
 * Usage: npx tsx scripts/polish-quest-locales.ts
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.join(__dirname, '..')
const CACHE_PATH = path.join(__dirname, 'locale-cache.json')
const DATA_DIR = path.join(ROOT, 'src/renderer/data')

const QUEST_FILES = [
  'quests_drawing.json',
  'quests_anatomy.json',
  'quests_animation.json',
  'quests_effects.json',
  'quests_storytelling.json',
  'quests_character_design.json',
  'quests_environment.json',
]

type Tri = { zh: string; ja: string; ko: string }

/** High-frequency micro-challenge & instruction templates (curated by art-education phrasing). */
const EXACT: Record<string, Tri> = {
  'Warm up: make 5 quick rough sketches for this exercise': {
    zh: '热身：为本练习快速画 5 张粗稿速写',
    ja: 'ウォームアップ：この課題のためにラフなスケッチを5枚素早く描く',
    ko: '워밍업: 이 연습을 위해 거친 스케치 5장을 빠르게 그리세요',
  },
  'Main step: complete the core exercise described in the quest': {
    zh: '主步骤：按任务描述完成核心练习',
    ja: 'メイン：クエスト説明どおりのコア課題を完了する',
    ko: '본 단계: 퀘스트 설명에 있는 핵심 연습을 완료하세요',
  },
  'Polish: refine edges, values, or timing for a clean result': {
    zh: '收尾：修边、调整明暗或节奏，力求干净完成',
    ja: '仕上げ：輪郭・明暗・タイミングを整え、クリーンに仕上げる',
    ko: '마무리: 윤곽·명암·타이밍을 다듬어 깔끔하게 마무리하세요',
  },
  'Main exercise': {
    zh: '主练习',
    ja: 'メイン課題',
    ko: '본 연습',
  },
  'Warm up: 3 tiny thumbnails': {
    zh: '热身：画 3 个小型构图草图',
    ja: 'ウォームアップ：小さな構図サムネイルを3つ描く',
    ko: '워밍업: 작은 구도 썸네일 3개를 그리세요',
  },
  'Pick best and polish once': {
    zh: '选出最佳一稿，精修一次',
    ja: 'ベストを選び、一度仕上げる',
    ko: '가장 좋은 한 장을 골라 한 번 다듬으세요',
  },
  'Warm up: 2 tiny sketches': {
    zh: '热身：画 2 张小型速写',
    ja: 'ウォームアップ：小さなスケッチを2枚描く',
    ko: '워밍업: 작은 스케치 2장을 그리세요',
  },
  'Polish best pass once': {
    zh: '精修最佳一稿',
    ja: 'ベスト案を一度仕上げる',
    ko: '가장 좋은 시안을 한 번 다듬으세요',
  },
  'Warm up: 2 tiny thumbnails of the motion': {
    zh: '热身：为动作画 2 个小型动态草图',
    ja: 'ウォームアップ：動きの小さなサムネイルを2つ描く',
    ko: '워밍업: 동작의 작은 썸네일 2개를 그리세요',
  },
  'Do the main exercise': {
    zh: '完成主练习',
    ja: 'メイン課題を行う',
    ko: '본 연습을 수행하세요',
  },
  'Polish readability (silhouette + timing)': {
    zh: '提升可读性（剪影 + 节奏）',
    ja: '読みやすさを仕上げる（シルエット＋タイミング）',
    ko: '가독성을 다듬으세요(실루엣 + 타이밍)',
  },
  'Pick your 3 strongest pieces and add one refinement pass each': {
    zh: '选出 3 张最佳作品，各精修一遍',
    ja: 'ベスト3枚を選び、それぞれ一度仕上げる',
    ko: '가장 좋은 3장을 골라 각각 한 번씩 다듬으세요',
  },
  'Warm up: 3 loose quick studies — same subject, no erasing': {
    zh: '热身：同一主题快速画 3 张放松习作，不擦改',
    ja: 'ウォームアップ：同じ題材でラフな速習を3枚（消さない）',
    ko: '워밍업: 같은 대상으로 느슨한 속습 3장(지우개 사용 금지)',
  },
  'Complete the main exercise from the quest description': {
    zh: '按任务描述完成主练习',
    ja: 'クエスト説明のメイン課題を完了する',
    ko: '퀘스트 설명의 본 연습을 완료하세요',
  },
  'One focused refinement pass on the best result': {
    zh: '对最佳成果做一次集中精修',
    ja: 'ベスト結果に集中して一度仕上げる',
    ko: '최고 결과물에 집중해서 한 번 다듬으세요',
  },
  'Main set: complete all 20 as described in the quest': {
    zh: '主组：按任务描述完成全部 20 项',
    ja: 'メインセット：クエスト説明どおり20点すべて完了',
    ko: '본 세트: 퀘스트 설명대로 20개 모두 완료',
  },
  'Main set: complete all 10 as described in the quest': {
    zh: '主组：按任务描述完成全部 10 项',
    ja: 'メインセット：クエスト説明どおり10点すべて完了',
    ko: '본 세트: 퀘스트 설명대로 10개 모두 완료',
  },
  'Main set: complete all 15 as described in the quest': {
    zh: '主组：按任务描述完成全部 15 项',
    ja: 'メインセット：クエスト説明どおり15点すべて完了',
    ko: '본 세트: 퀘스트 설명대로 15개 모두 완료',
  },
  'Main set: complete all 12 as described in the quest': {
    zh: '主组：按任务描述完成全部 12 项',
    ja: 'メインセット：クエスト説明どおり12点すべて完了',
    ko: '본 세트: 퀘스트 설명대로 12개 모두 완료',
  },
  'Fill with base colors on separate layers. Do not add shadows or gradients.': {
    zh: '在独立图层上平涂底色，不要加阴影或渐变。',
    ja: '別レイヤーにベースカラーを平塗りする。影やグラデーションは加えない。',
    ko: '별도 레이어에 기본색을 평면적으로 채우세요. 그림자나 그라데이션은 넣지 마세요.',
  },
  'Use the rule of thirds, leading lines, and visual weight. Balance negative space and masses.': {
    zh: '运用三分法、引导线与视觉重心，平衡留白与形体块。',
    ja: '三分割法・視線誘導線・視覚的重みで、余白と形の塊のバランスを取る。',
    ko: '삼분할·유도선·시각적 무게로 여백과 덩어리의 균형을 맞추세요.',
  },
  'Quick timed rendering session. Focus on the main subject and ignore secondary details.': {
    zh: '限时快速绘制：聚焦主体，忽略次要细节。',
    ja: '時間制限の速描。主題に集中し、副次のディテールは省略する。',
    ko: '시간 제한 속속: 주제에 집중하고 부차적 디테일은 생략하세요.',
  },
  'Render different materials with digital brushes and blend modes. Focus on reflections.': {
    zh: '用数字笔刷与混合模式表现不同材质，重点刻画反光。',
    ja: 'デジタルブラシと描画モードで異素材を描き、反射を意識する。',
    ko: '디지털 브러시와 블렌드 모드로 다양한 재질을 표현하고 반사에 집중하세요.',
  },
  'Create a brush for the task (texture, scatter, and dynamics). Test it on an object.': {
    zh: '为任务定制笔刷（纹理、散布、动态），并在物体上试笔。',
    ja: '課題用ブラシ（テクスチャ・散布・ダイナミクス）を作り、オブジェクトで試す。',
    ko: '과제용 브러시(텍스처·분산·다이나믹)를 만들고 오브젝트에 테스트하세요.',
  },
  'Final frame assembly: integration of objects, light, effects, color correction.': {
    zh: '最终画面合成：整合物体、光线、特效与调色。',
    ja: '最終フレーム合成：オブジェクト・光・エフェクト・色調整を統合する。',
    ko: '최종 프레임 합성: 오브젝트·빛·이펙트·색 보정을 통합하세요.',
  },
  'Create a sheet with emotions. Separate layers, control of facial expressions through muscles.': {
    zh: '制作表情参考图：分层绘制，用肌肉结构控制面部表情。',
    ja: '表情リファレンスシートを作る。レイヤー分けし、筋肉で表情をコントロールする。',
    ko: '표정 레퍼런스 시트를 만드세요. 레이어를 나누고 근육으로 표정을 조절하세요.',
  },
  'Block the object using boxes and cylinders first. No detail until forms read.': {
    zh: '先用方盒与圆柱体做体块，形体可读后再加细节。',
    ja: 'まず箱とシリンダーでブロックイン。形が読めるまでディテールは入れない。',
    ko: '먼저 박스와 실린더로 블로킹하세요. 형태가 읽힐 때까지 디테일은 넣지 마세요.',
  },
  'Apply the compression/stretch principle. Maintain the volume of the form.': {
    zh: '运用挤压/拉伸原理，保持形体体积。',
    ja: 'スカッシュ＆ストレッチの原理を適用し、フォームのボリュームを保つ。',
    ko: '스쿼시·스트레치 원리를 적용하고 형태의 부피를 유지하세요.',
  },
  'Layout one portfolio page with 12 polished form studies (any mix of primitives). Unified lighting.': {
    zh: '作品集一页排版：12 幅精修的形体练习（基础体块自由组合），统一光照。',
    ja: 'ポートフォリオ1ページに、磨き上げたフォームスタディ12点（プリミティブ自由組み合わせ）。照明を統一。',
    ko: '포트폴리오 한 페이지에 다듬은 형태 스터디 12점(기본 도형 자유 조합)을 배치하세요. 조명을 통일하세요.',
  },
}

const LINE_SUBJECT: Record<string, Tri> = {
  'призмы': { zh: '棱柱体', ja: 'プリズム', ko: '프리즘' },
  'арки': { zh: '拱形', ja: 'アーチ', ko: '아치' },
  'листа дерева': { zh: '树叶', ja: '木の葉', ko: '나뭇잎' },
}

const INDUSTRY_BRIEF_TOPICS: Record<string, Tri> = {
  архитектура: { zh: '建筑', ja: '建築', ko: '건축' },
  экстерьера: { zh: '室外场景', ja: '屋外シーン', ko: '실외 장면' },
  цилиндр: { zh: '圆柱体', ja: 'シリンダー', ko: '실린더' },
  сфера: { zh: '球体', ja: '球体', ko: '구체' },
  интерьер: { zh: '室内场景', ja: 'インテリア', ko: '실내 장면' },
  пейзаж: { zh: '风景', ja: '風景', ko: '풍경' },
  персонаж: { zh: '角色', ja: 'キャラクター', ko: '캐릭터' },
  диалог: { zh: '对话', ja: '対話', ko: '대화' },
  атмосфера: { zh: '氛围', ja: '雰囲気', ko: '분위기' },
  огонь: { zh: '火焰', ja: '炎', ko: '불꽃' },
  'вода с брызгами': { zh: '水花飞溅', ja: '水しぶき', ko: '물 튀김' },
}

const SILHOUETTE_TOPICS: Record<string, Tri> = {
  'ссора за столом': { zh: '餐桌争执', ja: '食卓での口論', ko: '식탁에서의 말다툼' },
}

const DESC_FROM_RU: Record<string, Tri> = {
  'Создай лист с эмоциями. Отдельные слои, контроль мимики через мышцы.': {
    zh: '制作表情参考图：分层绘制，用肌肉结构控制面部表情。',
    ja: '表情リファレンスシートを作る。レイヤー分けし、筋肉で表情をコントロールする。',
    ko: '표정 레퍼런스 시트를 만드세요. 레이어를 나누고 근육으로 표정을 조절하세요.',
  },
  'Сначала кубы и цилиндры. Детали только после читаемости формы.': {
    zh: '先用方盒与圆柱体做体块，形体可读后再加细节。',
    ja: 'まず箱とシリンダーでブロックイン。形が読めるまでディテールは入れない。',
    ko: '먼저 박스와 실린더로 블로킹하세요. 형태가 읽힐 때까지 디테일은 넣지 마세요.',
  },
  'Примени принцип сжатия/растяжения. Сохраняй объём формы.': {
    zh: '运用挤压/拉伸原理，保持形体体积。',
    ja: 'スカッシュ＆ストレッチの原理を適用し、フォームのボリュームを保つ。',
    ko: '스쿼시·스트레치 원리를 적용하고 형태의 부피를 유지하세요.',
  },
  'Разворот портфолио: 12 отполированных формовых этюдов (примитивы на выбор). Единое освещение.': {
    zh: '作品集一页排版：12 幅精修的形体练习（基础体块自由组合），统一光照。',
    ja: 'ポートフォリオ1ページに、磨き上げたフォームスタディ12点（プリミティブ自由組み合わせ）。照明を統一。',
    ko: '포트폴리오 한 페이지에 다듬은 형태 스터디 12점(기본 도형 자유 조합)을 배치하세요. 조명을 통일하세요.',
  },
  'Чистые, уверенные линии. Без штриховки и растушёвки.': {
    zh: '线条干净利落、自信流畅。不要排线或晕染。',
    ja: 'クリーンで自信のある線。ハッチングやぼかしは入れない。',
    ko: '깔끔하고 자신감 있는 선. 해칭이나 번짐은 넣지 마세요.',
  },
  'Чистые, уверенные линии. Без штриховки и растушёвки. Без ограничений': {
    zh: '线条干净利落、自信流畅。不要排线或晕染，不限时。',
    ja: 'クリーンで自信のある線。ハッチングやぼかしは入れない。時間制限なし。',
    ko: '깔끔하고 자신감 있는 선. 해칭이나 번짐 없이, 시간 제한 없이.',
  },
}

function titleFromRu(ru: string): Tri | null {
  let m: RegExpMatchArray | null
  if ((m = ru.match(/^Качество линии: (.+) \(прямые\/кривые\)$/))) {
    const subj = LINE_SUBJECT[m[1]!] ?? { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `线条质量：${subj.zh}（直线/曲线）`,
      ja: `ラインの質：${subj.ja}（直線/曲線）`,
      ko: `선 품질：${subj.ko}（직선/곡선）`,
    }
  }
  if ((m = ru.match(/^Цикл бега: (.+)$/))) {
    const body = m[1]!
    const zhBody = body
      .replace(/прыжка с приземлением с фазой полёта/i, '带腾空阶段的跳跃落地')
      .replace(/качания головой \(несогласие\) \(с фазой полёта\)/i, '摇头（不同意）（含腾空阶段）')
      .replace(/зевания \(с фазой полёта\)/i, '打哈欠（含腾空阶段）')
      .replace(/вращающегося волчка \(с фазой полёта\)/i, '旋转陀螺（含腾空阶段）')
    return {
      zh: `跑步循环：${zhBody}`,
      ja: `ランサイクル：${body.includes('прыжка') ? 'ジャンプ着地（飛行フェーズあり）' : body}`,
      ko: `런 사이클：${body.includes('прыжка') ? '점프 착지(비행 단계 포함)' : body}`,
    }
  }
  if ((m = ru.match(/^Повествование эффектами: (.+)$/))) {
    const topic =
      m[1] === 'жидкости'
        ? { zh: '液体', ja: '液体', ko: '액체' }
        : { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `特效叙事：${topic.zh}`,
      ja: `エフェクトストーリーテリング：${topic.ja}`,
      ko: `이펙트 스토리텔링：${topic.ko}`,
    }
  }
  if ((m = ru.match(/^Анатомическое повествование: (.+)$/))) {
    const map: Record<string, Tri> = {
      'лицевой мимики': { zh: '面部表情', ja: '表情', ko: '표정' },
      'лицо': { zh: '面部', ja: '顔', ko: '얼굴' },
      'жестов фигуры': { zh: '人物动态', ja: 'フィギュアのジェスチャー', ko: '인체 제스처' },
      'скелета': { zh: '骨骼', ja: '骨格', ko: '골격' },
      'скелетной системы': { zh: '骨骼系统', ja: '骨格系', ko: '골격계' },
    }
    const topic = map[m[1]!] ?? { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `解剖叙事：${topic.zh}`,
      ja: `アナトミー・ストーリーテリング：${topic.ja}`,
      ko: `해부학 스토리텔링：${topic.ko}`,
    }
  }
  if ((m = ru.match(/^Немое повествование: (.+)$/))) {
    return {
      zh: `无声叙事：${m[1]!.replace(/\(без диалогов\)/g, '（无对白）')}`,
      ja: `サイレント叙事：${m[1]!.replace(/\(без диалогов\)/g, '（セリフなし）')}`,
      ko: `무성 스토리텔링：${m[1]!.replace(/\(без диалогов\)/g, '（대사 없음）')}`,
    }
  }
  if ((m = ru.match(/^Выполнить производственное задание: (.+)$/))) {
    const topic = INDUSTRY_BRIEF_TOPICS[m[1]!.toLowerCase()] ?? {
      zh: m[1]!,
      ja: m[1]!,
      ko: m[1]!,
    }
    return {
      zh: `行业案例：${topic.zh}`,
      ja: `業界ブリーフ：${topic.ja}`,
      ko: `업계 브리프: ${topic.ko}`,
    }
  }
  if ((m = ru.match(/^Сделай читаемый силуэт: (.+)$/))) {
    const topic = SILHOUETTE_TOPICS[m[1]!] ?? { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `设计可读的剪影：${topic.zh}`,
      ja: `読みやすいシルエットを作る：${topic.ja}`,
      ko: `읽기 쉬운 실루엣 디자인: ${topic.ko}`,
    }
  }
  if ((m = ru.match(/^Сцена для шоурила: (.+) \(профессиональный уровень\)$/))) {
    const showreelMap: Record<string, Tri> = {
      'раскачивающейся верёвки': {
        zh: '摇摆的绳子（来回）',
        ja: '揺れるロープ（前後）',
        ko: '흔들리는 밧줄(앞뒤)',
      },
    }
    const motion = showreelMap[m[1]!] ?? { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `作品集镜头：${motion.zh}（专业级）`,
      ja: `ショーリールシーン：${motion.ja}（プロ）`,
      ko: `쇼릴 장면: ${motion.ko}(프로)`,
    }
  }
  if ((m = ru.match(/^Изучение текстуры: (.+) \(штрих\)$/))) {
    const textureMap: Record<string, Tri> = {
      'статуи': { zh: '雕像', ja: '彫像', ko: '조각상' },
      'дерева (ствол)': { zh: '树（树干）', ja: '木（幹）', ko: '나무(줄기)' },
    }
    const subj = textureMap[m[1]!] ?? { zh: m[1]!, ja: m[1]!, ko: m[1]! }
    return {
      zh: `纹理研究：${subj.zh}（排线）`,
      ja: `テクスチャ研究：${subj.ja}（ハッチング）`,
      ko: `텍스처 연구: ${subj.ko}(해칭)`,
    }
  }
  return null
}

function descriptionFromRu(ru: string): Tri | null {
  const key = ru.trim()
  return DESC_FROM_RU[key] ?? null
}

/** Post-process fixes for machine-translation artifacts (per language). */
const POST: Record<'zh' | 'ja' | 'ko', Array<[RegExp, string]>> = {
  zh: [
    [/外汇故事/g, '特效叙事'],
    [/外汇/g, '特效'],
    [/讲故事/g, '叙事'],
    [/无声叙事/g, '无声叙事'],
    [/运行周期/g, '跑步循环'],
    [/线路质量/g, '线条质量'],
    [/跳闸/g, '绊倒'],
    [/执行行业简介/g, '行业案例'],
    [/执行行业简报/g, '行业案例'],
    [/执行行业简报：火灾/g, '行业案例：火焰'],
    [/充满情感的表格/g, '表情参考图'],
    [/精美的表格研究/g, '精美的形体研究'],
    [/表格研究/g, '形体研究'],
    [/表格轮廓上设计一个可读的参数/g, '可读的餐桌争执剪影'],
    [/表格轮廓/g, '形体轮廓'],
    [/保持表格的体积/g, '保持形体体积'],
    [/在阅读表格之前/g, '在形体可读之前'],
    [/（孵化）/g, '（排线）'],
    [/行业案例：架构/g, '行业案例：建筑'],
    [/行业案例：气缸/g, '行业案例：圆柱体'],
    [/行业案例：性格/g, '行业案例：角色'],
    [/行业案例：Sphere/g, '行业案例：球体'],
    [/火灾/g, '火焰'],
    [/没有孵化或混合/g, '不要排线或晕染'],
    [/没有孵化/g, '不要排线'],
    [/或混合/g, '或晕染'],
    [/讲故事的道具/g, '叙事道具'],
    [/抛光/g, '精修'],
    [/注重反思/g, '重点刻画反光'],
    [/视觉重量/g, '视觉重心'],
    [/负空间和质量/g, '留白与形体块'],
    [/平衡负空间和质量/g, '平衡留白与形体块'],
    [/复杂的构成/g, '复杂构图'],
    [/构成：/g, '构图：'],
    [/渲染会话/g, '限时绘制'],
    [/散点和动态/g, '散布与笔刷动态'],
    [/在一个物体上测试它/g, '在物体上试笔'],
    [/专业合成/g, '专业合成'],
    [/最终抛光/g, '最终精修'],
    [/速度和抛光/g, '速度胜过精修'],
    [/，值或/g, '、明暗或'],
    [/细化边缘、值/g, '修边、调整明暗'],
    [/主要主题/g, '主体'],
    [/快速定时/g, '限时快速'],
    [/核心运动/g, '核心练习'],
    [/热身：为此练习/g, '热身：为本练习'],
    [/粗略草图/g, '粗稿速写'],
    [/视觉凝聚力/g, '视觉统一性'],
    [/和出口/g, '并导出'],
    [/截止日期、出口/g, '截止日期与交付格式'],
    [/精修、出口/g, '精修与导出'],
    [/开始定时会话/g, '开始计时练习'],
    [/新的会话/g, '新的练习'],
    [/会话模式/g, '练习模式'],
    [/会话 2-3/g, '第 2–3 次练习'],
    [/完整的会话/g, '完整练习'],
    [/行业标准：重量、特性/g, '行业标准：体量、特性'],
    [/最终精修和出口/g, '最终精修并导出'],
  ],
  ja: [
    [/実行サイクル/g, 'ランサイクル'],
    [/FXストーリー/g, 'エフェクト叙事'],
    [/ストーリーテリング：/g, '叙事：'],
    [/等高線/g, '輪郭線'],
    [/交差等高線/g, '交叉輪郭線'],
    [/火災/g, '炎'],
    [/引き出し線/g, '視線誘導線'],
    [/視覚的な重み/g, '視覚的重み'],
    [/負の空間と質量/g, '余白と形の塊'],
    [/コア演習/g, 'コア課題'],
    [/ポリッシュ:/g, '仕上げ：'],
    [/ウォームアップ: この演習/g, 'ウォームアップ：この課題'],
    [/簡単なラフ スケッチ/g, 'ラフなスケッチ'],
    [/メインステップ:/g, 'メイン：'],
    [/複雑な構成:/g, '複雑な構図：'],
    [/クイックタイムのレンダリング/g, '時間制限の速描'],
    [/二次的な詳細/g, '副次のディテール'],
    [/反射に焦点/g, '反射を意識'],
    [/ダイナミクス\)/g, 'ダイナミクス）'],
    [/プロの合成: Plant/g, 'プロの合成：植物'],
    [/ビジュアル開発パス: Plant/g, 'ビジュアル開発：植物'],
    [/: Plant\b/g, '：植物'],
    [/業界概要の作成/g, '業界ブリーフ'],
    [/業界概要を作成する/g, '業界ブリーフ'],
    [/ハンドファイリング/g, 'ロープの揺れ'],
  ],
  ko: [
    [/실행 주기/g, '런 사이클'],
    [/등고선/g, '윤곽선'],
    [/화재/g, '불꽃'],
    [/핵심 운동/g, '핵심 연습'],
    [/대략적인/g, '거친'],
    [/주요 단계:/g, '본 단계:'],
    [/다듬기:/g, '마무리:'],
    [/가장자리, 값/g, '윤곽·명암'],
    [/선행선/g, '유도선'],
    [/음의 공간과 질량/g, '여백과 덩어리'],
    [/복합 구성/g, '복합 구성'],
    [/렌더링 세션/g, '속속'],
    [/주요 주제/g, '주제'],
    [/역학\)/g, '다이나믹)'],
    [/객체에 대해 테스트/g, '오브젝트에 테스트'],
    [/그radient/g, '그라데이션'],
    [/업계 개요 실행/g, '업계 브리프'],
    [/손으로 파일링/g, '흔들리는 밧줄'],
  ],
}

function polishText(text: string, lang: 'zh' | 'ja' | 'ko', enKey?: string): string {
  if (!text?.trim()) return text
  let out = text
  if (enKey && EXACT[enKey]?.[lang]) return EXACT[enKey][lang]
  for (const [re, rep] of POST[lang]) {
    out = out.replace(re, rep)
  }
  return out
}

function polishRecord(
  record: Record<string, string>,
  enKey: string,
  opts?: { isTitle?: boolean; isDescription?: boolean },
): Record<string, string> {
  const en = record.en ?? enKey
  const ru = record.ru?.trim()
  if (opts?.isTitle && ru) {
    const fromRu = titleFromRu(ru)
    if (fromRu) {
      record.zh = fromRu.zh
      record.ja = fromRu.ja
      record.ko = fromRu.ko
      return record
    }
  }
  if (opts?.isDescription && ru) {
    const fromRu = descriptionFromRu(ru)
    if (fromRu) {
      record.zh = fromRu.zh
      record.ja = fromRu.ja
      record.ko = fromRu.ko
      return record
    }
  }
  for (const lang of ['zh', 'ja', 'ko'] as const) {
    if (!record[lang]) continue
    record[lang] = polishText(record[lang], lang, en)
  }
  return record
}

const CACHE_PATCHES: Record<string, Tri> = {
  Animation: { zh: '动画', ja: 'アニメーション', ko: '애니메이션' },
  Storytelling: { zh: '叙事', ja: 'ストーリーテリング', ko: '스토리텔링' },
  Character: { zh: '角色', ja: 'キャラクター', ko: '캐릭터' },
  Materials: { zh: '学习资料', ja: '学習素材', ko: '학습 자료' },
  completed: { zh: '已完成', ja: '完了', ko: '완료' },
  'Total Level': { zh: '总等级', ja: '合計レベル', ko: '총 레벨' },
  'Active Quest': { zh: '进行中的任务', ja: '進行中のクエスト', ko: '진행 중인 퀘스트' },
}

async function polishCache(): Promise<number> {
  const raw = await fs.readFile(CACHE_PATH, 'utf8')
  const cache = JSON.parse(raw) as Record<string, Partial<Record<'zh' | 'ja' | 'ko', string>>>
  let n = 0
  for (const [en, row] of Object.entries(cache)) {
    if (CACHE_PATCHES[en]) {
      for (const lang of ['zh', 'ja', 'ko'] as const) {
        if (row[lang] !== CACHE_PATCHES[en][lang]) {
          row[lang] = CACHE_PATCHES[en][lang]
          n++
        }
      }
    }
    if (en.startsWith('Execute an industry brief: ')) {
      const topicKey = en.slice('Execute an industry brief: '.length).toLowerCase()
      const ruTopicMap: Record<string, string> = {
        architecture: 'архитектура',
        'exterior scene': 'экстерьера',
        cylinder: 'цилиндр',
        sphere: 'сфера',
        'interior scene': 'интерьер',
        landscape: 'пейзаж',
        character: 'персонаж',
        dialogue: 'диалог',
        atmosphere: 'атмосфера',
        fire: 'огонь',
        'water splashes': 'вода с брызгами',
      }
      const ruKey = ruTopicMap[topicKey]
      const tri = ruKey ? INDUSTRY_BRIEF_TOPICS[ruKey] : null
      if (tri) {
        const patched = {
          zh: `行业案例：${tri.zh}`,
          ja: `業界ブリーフ：${tri.ja}`,
          ko: `업계 브리프: ${tri.ko}`,
        }
        for (const lang of ['zh', 'ja', 'ko'] as const) {
          if (row[lang] !== patched[lang]) {
            row[lang] = patched[lang]
            n++
          }
        }
      }
    }
    for (const lang of ['zh', 'ja', 'ko'] as const) {
      if (!row[lang]) continue
      const before = row[lang]!
      const after = polishText(before, lang, en)
      if (after !== before) {
        row[lang] = after
        n++
      }
    }
    if (EXACT[en]) {
      for (const lang of ['zh', 'ja', 'ko'] as const) {
        if (row[lang] !== EXACT[en][lang]) {
          row[lang] = EXACT[en][lang]
          n++
        }
      }
    }
  }
  await fs.writeFile(CACHE_PATH, JSON.stringify(cache, null, 2) + '\n', 'utf8')
  return n
}

async function polishQuestFiles(): Promise<void> {
  for (const file of QUEST_FILES) {
    const filePath = path.join(DATA_DIR, file)
    const quests = JSON.parse(await fs.readFile(filePath, 'utf8')) as Array<{
      title: Record<string, string>
      description: Record<string, string>
      microChallenges?: Array<{ instruction: Record<string, string> }>
    }>
    for (const quest of quests) {
      polishRecord(quest.title, quest.title.en, { isTitle: true })
      polishRecord(quest.description, quest.description.en, { isDescription: true })
      for (const mc of quest.microChallenges ?? []) {
        polishRecord(mc.instruction, mc.instruction.en)
      }
    }
    await fs.writeFile(filePath, JSON.stringify(quests, null, 2) + '\n', 'utf8')
    console.log('Polished', file)
  }
}

async function main(): Promise<void> {
  const cacheUpdates = await polishCache()
  console.log(`Cache: ${cacheUpdates} string updates`)
  await polishQuestFiles()
  console.log('Done')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
