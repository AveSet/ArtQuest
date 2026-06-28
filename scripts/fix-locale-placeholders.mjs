/**
 * Normalize i18n interpolation tokens in zh/ja/ko locale files to match English keys used in code.
 */
import fs from 'node:fs'
import path from 'node:path'

const ROOT = path.join(process.cwd(), 'src/renderer/i18n/locales')

/** Wrong token (inside braces) → canonical English token */
const TOKEN_MAP = {
  // Chinese
  日期: 'date',
  已解锁: 'unlocked',
  总计: 'total',
  当前: 'current',
  标题: 'title',
  标签: 'label',
  预期: 'expected',
  可用: 'available',
  类别: 'categories',
  标准: 'criterion',
  分钟: 'minutes',
  级别: 'level',
  已下载: 'downloaded',
  已上传: 'uploaded',
  已链接: 'linked',
  技能: 'skill',
  分数: 'score',
  信号: 'signals',
  已完成: 'done',
  ' 分钟': 'minutes',
  // Japanese
  日付: 'date',
  ロック解除済み: 'unlocked',
  合計: 'total',
  タイトル: 'title',
  ラベル: 'label',
  スキル: 'skill',
  スコア: 'score',
  シグナル: 'signals',
  ' minutes': 'minutes',
  // Korean
  날짜: 'date',
  '잠금 해제됨': 'unlocked',
  전체: 'total',
  총계: 'total',
  현재: 'current',
  제목: 'title',
  라벨: 'label',
  예상: 'expected',
  '사용 가능': 'available',
  카테고리: 'categories',
  다운로드됨: 'downloaded',
  업로드됨: 'uploaded',
  링크됨: 'linked',
  레벨: 'level',
  분: 'minutes',
}

const COPY_FIXES = [
  // zh mistranslations
  [/("chestStreak":\s*")胸部进展(")/g, '$1奖励箱进度$2'],
  [/("openChest":\s*")打开宝箱(")/g, '$1打开奖励箱$2'],
  [/("chestReady":\s*")胸部准备好了！(")/g, '$1奖励箱已就绪！$2'],
  [/("errors\.dismiss"|"dismiss":\s*")解雇(")/g, '$1关闭$2'],
  [/("nav\.gallery"|"gallery":\s*")画廊(")/, '$1画廊$2'], // ok
  [/("rewards\.dismiss"|"dismiss":\s*")("")/g, '$1知道了$2'],
  // ja chest mistranslations
  [/("openChest":\s*")開いた胸(")/g, '$1宝箱を開く$2'],
  [/("chestReady":\s*")開いた胸！(")/g, '$1宝箱の準備完了！$2'],
  [/("chestStreak":\s*")胸部の進行(")/g, '$1報酬箱の進捗$2'],
  // ko
  [/("nav\.gallery"|"gallery":\s*")갱도(")/g, '$1갤러리$2'],
  [/("openChest":\s*")열린 가슴(")/g, '$1상자 열기$2'],
  [/("chestReady":\s*")열린 가슴!(")/g, '$1상자 준비 완료!$2'],
  [/("chestStreak":\s*")가슴 진행(")/g, '$1보상 상자 진행$2'],
  [/("rewards\.dismiss"|"dismiss":\s*")("")/g, '$1닫기$2'],
]

function fixTokens(content) {
  let out = content
  for (const [wrong, right] of Object.entries(TOKEN_MAP)) {
    out = out.replaceAll(`{${wrong}}`, `{${right}}`)
  }
  out = out.replaceAll('{show}', '{shown}')
  out = out.replaceAll('{n}', '{n}') // noop
  for (const [re, rep] of COPY_FIXES) {
    out = out.replace(re, rep)
  }
  return out
}

for (const lang of ['zh', 'ja', 'ko']) {
  const file = path.join(ROOT, `${lang}.ts`)
  const fixed = fixTokens(fs.readFileSync(file, 'utf8'))
  fs.writeFileSync(file, fixed)
  console.log('fixed', file)
}
