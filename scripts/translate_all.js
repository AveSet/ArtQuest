const translatte = require('translatte');
const fs = require('fs');

const inputFile = 'src/renderer/src/data/quests.json';

async function translateToEn(text) {
  try {
    const result = await translatte(text, { to: 'en' });
    return result.text;
  } catch (e) {
    return text;
  }
}

async function main() {
  const data = fs.readFileSync(inputFile, 'utf8');
  const quests = JSON.parse(data);
  
  console.log(`Translating ${quests.length} quests...`);
  
  for (let i = 0; i < quests.length; i++) {
    const quest = quests[i];
    const ruTitle = quest.title.ru || quest.title;
    const ruDesc = quest.description.ru || quest.description;
    
    if (i % 20 === 0) {
      console.log(`[${i + 1}/${quests.length}] ${ruTitle.substring(0, 35)}...`);
    }
    
    try {
      quest.title = { ru: ruTitle, en: await translateToEn(ruTitle) };
      quest.description = { ru: ruDesc, en: await translateToEn(ruDesc) };
      await new Promise(r => setTimeout(r, 180));
    } catch (e) {
      quest.title = { ru: ruTitle, en: ruTitle };
      quest.description = { ru: ruDesc, en: ruDesc };
    }
  }
  
  fs.writeFileSync(inputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();