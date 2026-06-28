const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';
const data = fs.readFileSync(inputFile, 'utf8');
const quests = JSON.parse(data);

const categoryMap = {
  'Drawing': 'drawing',
  'Anatomy': 'anatomy',
  'Animation': 'animation',
  'Effects': 'effects',
  'Storytelling': 'storytelling'
};

const difficultyMap = {
  'Novice': 'novice',
  'Intermediate': 'intermediate',
  'Advanced': 'advanced',
  'Master': 'master',
  'Expert': 'expert'
};

let changed = 0;
for (const quest of quests) {
  if (categoryMap[quest.category]) {
    quest.category = categoryMap[quest.category];
    changed++;
  }
  if (difficultyMap[quest.difficulty]) {
    quest.difficulty = difficultyMap[quest.difficulty];
  }
}

console.log(`Fixed ${changed} categories`);
fs.writeFileSync(inputFile, JSON.stringify(quests, null, 2), 'utf8');
console.log('Done!');