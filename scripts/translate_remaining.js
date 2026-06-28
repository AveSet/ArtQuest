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
  
  let remaining = [];
  for (const quest of quests) {
    if (!quest.title.en || quest.title.en === quest.title.ru) {
      remaining.push(quest);
    }
  }
  
  console.log(`Translating ${remaining.length} remaining quests...`);
  
  for (let i = 0; i < remaining.length; i++) {
    const quest = remaining[i];
    const ruTitle = quest.title.ru || quest.title;
    const ruDesc = quest.description.ru || quest.description;
    
    console.log(`${i + 1}. ${ruTitle.substring(0, 40)}`);
    
    try {
      quest.title = { ru: ruTitle, en: await translateToEn(ruTitle) };
      quest.description = { ru: ruDesc, en: await translateToEn(ruDesc) };
      await new Promise(r => setTimeout(r, 200));
    } catch (e) {
      console.log('Error:', e.message);
    }
  }
  
  fs.writeFileSync(inputFile, JSON.stringify(quests, null, 2), 'utf8');
  console.log('Done!');
}

main();