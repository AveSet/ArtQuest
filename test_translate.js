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
  
  const limit = 100;
  console.log(`Translating first ${limit} quests...`);
  
  for (let i = 0; i < limit && i < quests.length; i++) {
    const quest = quests[i];
    const ruTitle = quest.title.ru || quest.title;
    const ruDesc = quest.description.ru || quest.description;
    
    console.log(`${i + 1}. ${ruTitle.substring(0, 40)}`);
    
    try {
      quest.title = { ru: ruTitle, en: await translateToEn(ruTitle) };
      quest.description = { ru: ruDesc, en: await translateToEn(ruDesc) };
      await new Promise(r => setTimeout(r, 250));
    } catch (e) {
      quest.title = { ru: ruTitle, en: ruTitle };
      quest.description = { ru: ruDesc, en: ruDesc };
    }
  }
  
  fs.writeFileSync(inputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();