const translatte = require('translatte');
const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';
const outputFile = 'src/renderer/src/data/quests.json';

async function translateToEn(text) {
  try {
    const result = await translatte(text, { to: 'en' });
    return result.text;
  } catch (e) {
    return text;
  }
}

async function main() {
  console.log('Loading quests...');
  const data = fs.readFileSync(inputFile, 'utf8');
  const quests = JSON.parse(data);
  
  console.log(`Translating ${quests.length} quests to English...`);
  
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    const ruTitle = quest.title.ru || quest.title;
    const ruDesc = quest.description.ru || quest.description;
    
    if (i % 50 === 0) {
      console.log(`[${i + 1}/${quests.length}] ${ruTitle.substring(0, 30)}...`);
    }
    
    try {
      quest.title = { ru: ruTitle, en: await translateToEn(ruTitle) };
      quest.description = { ru: ruDesc, en: await translateToEn(ruDesc) };
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      quest.title = { ru: ruTitle, en: ruTitle };
      quest.description = { ru: ruDesc, en: ruDesc };
    }
  }
  
  console.log('Saving...');
  fs.writeFileSync(outputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();