import fs from 'node:fs'
import path from 'node:path'
import { QUEST_FILES, unexpectedLatin, type QuestLocale } from './quest-l10n-shared.ts'

const DATA = path.join(import.meta.dirname, '../src/renderer/data')
const locales: QuestLocale[] = ['ru', 'zh', 'ja', 'ko']
const tokenCounts = Object.fromEntries(locales.map((l) => [l, new Map<string, number>()])) as Record<
  QuestLocale,
  Map<string, number>
>
const samples: Record<QuestLocale, string[]> = { ru: [], zh: [], ja: [], ko: [] }

for (const file of QUEST_FILES) {
  const quests = JSON.parse(fs.readFileSync(path.join(DATA, file), 'utf8'))
  for (const q of quests) {
    for (const locale of locales) {
      for (const field of ['title', 'description'] as const) {
        const text = q[field][locale] as string
        for (const tok of unexpectedLatin(text)) {
          tokenCounts[locale].set(tok, (tokenCounts[locale].get(tok) ?? 0) + 1)
          if (samples[locale].length < 8 && !samples[locale].some((s) => s.includes(tok))) {
            samples[locale].push(`${q.code} ${field}: ${text.slice(0, 70)}`)
          }
        }
      }
      for (const mc of q.microChallenges ?? []) {
        const text = mc.instruction[locale] as string
        for (const tok of unexpectedLatin(text)) {
          tokenCounts[locale].set(tok, (tokenCounts[locale].get(tok) ?? 0) + 1)
        }
      }
    }
  }
}

for (const locale of locales) {
  console.log(`\n=== ${locale} top tokens ===`)
  const sorted = [...tokenCounts[locale].entries()].sort((a, b) => b[1] - a[1]).slice(0, 20)
  for (const [tok, n] of sorted) console.log(`${n}\t${tok}`)
  console.log('samples:', samples[locale].join('\n  '))
}
