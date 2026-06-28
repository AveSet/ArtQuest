import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const file = path.join(path.dirname(fileURLToPath(import.meta.url)), '../src/renderer/i18n/translations.ts')
let s = fs.readFileSync(file, 'utf8')

function removeBlock(source, startMarker, endMarker) {
  const start = source.indexOf(startMarker)
  if (start === -1) return source
  const end = source.indexOf(endMarker, start)
  if (end === -1) throw new Error(`end not found after: ${startMarker}`)
  return source.slice(0, start) + source.slice(end)
}

// Type-level campaign section (before common:)
s = removeBlock(s, '  campaign: {\n', '  common: {\n')

// EN + RU campaign objects (after portrait closing)
s = removeBlock(s, '    campaign: {\n      title:', "    common: {\n")

// nav.campaign
s = s.replace(/    campaign: string\n/, '')
s = s.replace(/      campaign: 'Campaign',\n/, '')
s = s.replace(/      campaign: 'Кампания',\n/, '')

// a11y
s = s.replace(/    campaignProgress: string\n    campaignWorldMap: string\n/, '')

// dashboard
s = s.replace(/    mixedCampaignBeat\?: string\n/, '')

// settings optional keys
s = s.replace(
  /    campaignSection\?: string\n    campaignMode\?: string\n    campaignModeHint\?: string\n    learningPathHint\?: string\n    learningPathExplore\?: string\n    learningPathMixed\?: string\n    learningPathCampaign\?: string\n    learningPathExploreHint\?: string\n    learningPathMixedHint\?: string\n    learningPathCampaignHint\?: string\n/,
  '',
)

// profile path picker
s = s.replace(
  /    pathTitle\?: string\n    pathIntro\?: string\n    chooseCampaign\?: string\n    chooseExplore\?: string\n    chooseMixed\?: string\n    campaignPathHint\?: string\n    explorePathHint\?: string\n    mixedPathHint\?: string\n/,
  '    explorePathHint\?: string\n',
)

// onboarding
s = s.replace(/    quickNavBodyNoCampaign\?: string\n/, '')

// softRestart key rename in type
s = s.replace(/    continueCampaign: string/, '    continuePlaying: string')

// Remove lines containing campaign settings / values (EN + RU blocks)
const dropLine = (line) =>
  /campaignSection:|campaignMode:|campaignModeHint:|learningPathHint:|learningPathExplore:|learningPathMixed:|learningPathCampaign:|learningPathExploreHint:|learningPathMixedHint:|learningPathCampaignHint:|campaignProgress:|campaignWorldMap:|mixedCampaignBeat:|quickNavBodyNoCampaign:|pathTitle:|pathIntro:|chooseCampaign:|chooseMixed:|campaignPathHint:|mixedPathHint:|continueCampaign:/.test(
    line,
  )

s = s
  .split('\n')
  .filter((line) => !dropLine(line))
  .join('\n')

s = s.replace(
  /        'Start fresh with easier dailies, or continue your campaign.',/,
  "        'Start fresh with easier dailies, or keep your current progress.',",
)
s = s.replace(/      continuePlaying: 'Continue campaign',/, "      continuePlaying: 'Keep playing',")

// profile EN/RU path blocks — drop path lines, keep explorePathHint only
s = s.replace(
  /      pathTitle:[^\n]+\n      pathIntro:[^\n]+\n      chooseCampaign:[^\n]+\n      chooseExplore:[^\n]+\n      chooseMixed:[^\n]+\n      campaignPathHint:[^\n]+\n      explorePathHint:/g,
  '      explorePathHint:',
)

fs.writeFileSync(file, s)
console.log('cleaned', file)
