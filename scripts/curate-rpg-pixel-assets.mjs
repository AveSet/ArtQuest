import fs from 'node:fs'
import path from 'node:path'

const root = path.resolve('resources/pixelart_new/parallax_Resource_Pack/sample_project/img')
const srcChars = path.resolve('resources/pixelart_new')
const dest = path.resolve('archive/campaign-pixel/rpg')

const tilesets = [
  ['tilesets/World_A1.png', 'tilesets/world-a1.png'],
  ['tilesets/World_A2.png', 'tilesets/world-a2.png'],
  ['tilesets/World_B.png', 'tilesets/world-b.png'],
  ['tilesets/Outside_A1.png', 'tilesets/outside-a1.png'],
  ['tilesets/Outside_A2.png', 'tilesets/outside-a2.png'],
  ['tilesets/Outside_B.png', 'tilesets/outside-b.png'],
  ['tilesets/Outside_C.png', 'tilesets/outside-c.png'],
  ['tilesets/Dungeon_A1.png', 'tilesets/dungeon-a1.png'],
  ['tilesets/Dungeon_A2.png', 'tilesets/dungeon-a2.png'],
  ['tilesets/Dungeon_B.png', 'tilesets/dungeon-b.png'],
]

const characters = [
  [path.join(srcChars, 'BaseResource/img/characters/SF_Actor1.png'), 'characters/sf-actor1.png'],
  [path.join(srcChars, 'BaseResource/img/characters/SF_Actor2.png'), 'characters/sf-actor2.png'],
  [path.join(srcChars, 'BaseResource/img/characters/SF_Actor3.png'), 'characters/sf-actor3.png'],
  [path.join(srcChars, 'BaseResource/img/characters/SF_Monster.png'), 'characters/sf-monster.png'],
  [path.join(srcChars, 'BaseResource/img/characters/SF_People1.png'), 'characters/sf-people1.png'],
  [path.join(srcChars, 'DarkFantasyCharacterPack/img/characters/2_DF_Actor.png'), 'characters/df-actor.png'],
  [path.join(srcChars, 'DarkFantasyCharacterPack/img/characters/3_DF_Actor.png'), 'characters/df-actor3.png'],
]

function copyPair(from, toRel) {
  const to = path.join(dest, toRel)
  fs.mkdirSync(path.dirname(to), { recursive: true })
  fs.copyFileSync(from, to)
  console.log('Copied', toRel)
}

for (const [fromRel, toRel] of tilesets) {
  copyPair(path.join(root, fromRel), toRel)
}
for (const [from, toRel] of characters) {
  if (fs.existsSync(from)) copyPair(from, toRel)
}

console.log('Done — legacy RPG assets in archive/campaign-pixel/rpg/ (not shipped in public/)')
