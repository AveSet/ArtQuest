import re
from pathlib import Path

p = Path(__file__).resolve().parent.parent / "src/renderer/i18n/translations.ts"
s = p.read_text(encoding="utf-8")

s = re.sub(r"  campaign: \{.*?\n  \},\n  common:", "  common:", s, count=1, flags=re.S)
s = re.sub(r"    campaign: \{.*?\n    \},\n    common:", "    common:", s, count=2, flags=re.S)
s = s.replace("    campaign: string\n", "")
s = s.replace("      campaign: 'Campaign',\n", "")
s = s.replace("      campaign: 'Кампания',\n", "")
s = re.sub(r"    campaignProgress: string\n    campaignWorldMap: string\n", "", s)
s = re.sub(r"    mixedCampaignBeat\?: string\n", "", s)
s = re.sub(
    r"    campaignSection\?: string\n.*?learningPathCampaignHint\?: string\n",
    "",
    s,
    flags=re.S,
)
s = re.sub(
    r"    pathTitle\?: string\n.*?mixedPathHint\?: string\n",
    "    explorePathHint?: string\n",
    s,
    flags=re.S,
)
s = re.sub(r"    quickNavBodyNoCampaign\?: string\n", "", s)
s = s.replace("    continueCampaign: string", "    continuePlaying: string")
drop = re.compile(
    r"campaignSection:|campaignMode:|campaignModeHint:|learningPath|"
    r"campaignProgress:|campaignWorldMap:|mixedCampaignBeat:|quickNavBodyNoCampaign:|"
    r"pathTitle:|pathIntro:|chooseCampaign:|chooseMixed:|campaignPathHint:|"
    r"mixedPathHint:|continueCampaign:"
)
s = "\n".join(line for line in s.split("\n") if not drop.search(line))
s = s.replace(
    "        'Start fresh with easier dailies, or continue your campaign.',",
    "        'Start fresh with easier dailies, or keep your current progress.',",
)
s = s.replace("      continuePlaying: 'Continue campaign',", "      continuePlaying: 'Keep playing',")
p.write_text(s, encoding="utf-8")
print("ok", s.count("campaign:"))
